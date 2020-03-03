import { basename } from "path"
import { sentence, href } from "../../runner/DangerUtils"
import { GitHubPRDSL, GitHubUtilsDSL } from "./../../dsl/GitHubDSL"
import { debug } from "../../debug"
import { filepathContentsMapToUpdateGitHubBranch, BranchCreationConfig } from "memfs-or-file-map-to-github-branch"

const d = debug("GitHub::Utils")

import { Octokit as GitHub } from "@octokit/rest"

// We need to curry in access to the GitHub PR metadata

const utils = (pr: GitHubPRDSL | undefined, api: GitHub): GitHubUtilsDSL => {
  /**
   * Converts a set of filepaths into a sentence'd set of hrefs for the
   * current PR. Can be configured to just show the name (instead of full filepath), to
   * change the github repo or branch.
   *
   */
  const fileLinks = (paths: string[], useBasename: boolean = true, repoSlug?: string, branch?: string): string => {
    // To support enterprise github, we need to handle custom github domains
    // this can be pulled out of the repo url metadata

    const githubRoot = pr && pr.head.repo.html_url.split(pr.head.repo.owner.login)[0]
    const slug = repoSlug || (pr && pr.head.repo.full_name)
    const ref = branch || (pr && pr.head.ref)

    const toHref = (path: string) => `${githubRoot}${slug}/blob/${ref}/${path}`
    // As we should only be getting paths we can ignore the nullability
    const hrefs = paths.map(p => href(toHref(p), useBasename ? basename(p) : p)) as string[]
    return sentence(hrefs)
  }

  return {
    fileLinks,
    fileContents: fileContentsGenerator(api, pr && pr.head.repo.full_name, pr && pr.head.ref),
    createUpdatedIssueWithID: createUpdatedIssueWithIDGenerator(api),
    createOrAddLabel: createOrAddLabel(pr, api),
    createOrUpdatePR: createOrUpdatePR(pr, api),
  }
}

/** Generates the fileContents function, needed so that Peril can re-create this func for an event */
export const fileContentsGenerator = (
  api: GitHub,
  defaultRepoSlug: string | undefined,
  defaultRef: string | undefined
) => async (path: string, repoSlug?: string, ref?: string): Promise<string> => {
  // Use the current state of PR if no repo/ref is passed
  if (!repoSlug) {
    repoSlug = defaultRepoSlug
  }

  if (!ref) {
    ref = defaultRef
  }

  if (!repoSlug) {
    throw new Error("You used fileContentsGenerator in a non-PR without specifying the repoSlug")
  }

  const opts = {
    ref,
    path,
    repo: repoSlug.split("/")[1],
    owner: repoSlug.split("/")[0],
  }
  try {
    // response of getContents() can be one of 4 things. We are interested in file responses only
    // https://developer.github.com/v3/repos/contents/#get-contents
    const response = await api.repos.getContents(opts)
    if (Array.isArray(response.data)) {
      return ""
    }
    if (response && response.data && response.data.content) {
      const buffer = new Buffer(response.data.content, response.data.encoding)
      return buffer.toString()
    } else {
      return ""
    }
  } catch {
    return ""
  }
}

/** Generates the createUpdatedIssueWithID function, needed so that Peril can re-create this func for an event */
export const createUpdatedIssueWithIDGenerator = (api: GitHub) => async (
  id: string,
  content: string,
  settings: { title: string; open: boolean; owner: string; repo: string }
) => {
  // Could also scope:
  //   by author
  //   by label
  const uniqueHeader = `Danger-Issue-ID-${id.replace(/ /g, "_")}`
  const q = `user:${settings.owner} repo:${settings.repo} ${uniqueHeader}`
  const { data: searchResults } = await api.search.issues({ q })
  d(`Got ${searchResults.total_count} for ${uniqueHeader}`)

  const body = `${content}\n\n${uniqueHeader}`
  const { repo, owner, title } = settings
  const state = settings.open ? "open" : "closed"

  if (searchResults.total_count > 0 && searchResults.items[0]) {
    const issueToUpdate = searchResults.items[0]
    d(`Found: ${issueToUpdate}`)
    const { data: issue } = await api.issues.update({ body, owner, repo, title, number: issueToUpdate.number, state })
    return issue.html_url
  } else {
    const { data: issue } = await api.issues.create({ body, owner, repo, title })
    return issue.html_url
  }
}

interface PRCreationConfig {
  /** PR title */
  title: string
  /** PR body */
  body: string
  /** The danger in danger/danger-js - defaults to the PR base name if undefined */
  owner?: string
  /** The danger-js in danger/danger-js - defaults to the PR base repo if undefined */
  repo?: string
  /** A message for the commit */
  commitMessage: string
  /** The name of the branch on the repo */
  newBranchName: string
  /** Base branch for the new branch e.g. what should Danger create the new branch from */
  baseBranch: string
}

export const createOrUpdatePR = (pr: GitHubPRDSL | undefined, api: GitHub) => async (
  config: PRCreationConfig,
  fileMap: any
) => {
  const repo = config.repo || (pr && pr.base.repo.name)
  if (!repo) {
    throw new Error("You need to set a `repo` in the config for `createOrUpdatePR`")
  }

  const owner = config.owner || (pr && pr.base.user.login)
  if (!owner) {
    throw new Error("You need to set a `owner` in the config for `createOrUpdatePR`")
  }

  const branchSettings: BranchCreationConfig = {
    fullBaseBranch: `heads/${config.baseBranch}`,
    fullBranchReference: `heads/${config.newBranchName}`,
    message: config.commitMessage,
    owner,
    repo,
  }

  d("Creating a branch")
  await filepathContentsMapToUpdateGitHubBranch(api, fileMap, branchSettings)

  d("Getting open PRs")
  const prs = await api.pulls.list({ repo, owner, state: "open" })
  const existingPR = prs.data.find(pr => pr.base.ref === config.newBranchName)

  if (existingPR) {
    d("Updating existing PR")
    return await api.pulls.update({
      number: existingPR.number,
      base: config.baseBranch,
      owner,
      repo,
      title: config.title,
      body: config.body,
    })
  } else {
    d("Creating a new PR")
    return await api.pulls.create({
      base: config.baseBranch,
      head: config.newBranchName,
      owner,
      repo,
      title: config.title,
    })
  }
}

export const createOrAddLabel = (pr: GitHubPRDSL | undefined, api: GitHub) => async (
  labelConfig: { name: string; color: string; description: string },
  repoConfig?: { owner: string; repo: string; id: number }
) => {
  // Create or re-use an existing label
  if (!repoConfig && !pr) {
    throw new Error("To use createOrAddLabel without a PR you need to add a repoConfig arg")
  }

  const config = repoConfig || (pr && { owner: pr.base.repo.owner.login, repo: pr.base.repo.name, id: pr.number })!

  d("Checking for existing labels")
  let label: any = null
  try {
    const existingLabels = await api.issues.listLabelsForRepo({ owner: config.owner, repo: config.repo })
    label = existingLabels.data.find((l: any) => l.name == labelConfig.name)
  } catch (e) {
    d("api.issues.getLabels gave an error", e)
  }

  // Create the label if it doesn't exist yet
  if (!label) {
    d("no label found, creating a new one for this repo")
    await api.issues.createLabel({
      owner: config.owner,
      repo: config.repo,
      name: labelConfig.name,
      color: labelConfig.color,
      description: labelConfig.description,
    })
  }

  d("adding a label to this pr")
  // Then add the label
  await api.issues.addLabels({
    owner: config.owner,
    repo: config.repo,
    number: config.id,
    labels: [labelConfig.name],
  })
}

export default utils
