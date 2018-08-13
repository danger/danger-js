import { basename } from "path"
import { sentence, href } from "../../runner/DangerUtils"
import { GitHubPRDSL, GitHubUtilsDSL } from "./../../dsl/GitHubDSL"
import { debug } from "../../debug"

const d = debug("GitHub::Utils")

import * as GitHub from "@octokit/rest"

// We need to curry in access to the GitHub PR metadata

const utils = (pr: GitHubPRDSL, api: GitHub): GitHubUtilsDSL => {
  /**
   * Converts a set of filepaths into a sentence'd set of hrefs for the
   * current PR. Can be configured to just show the name (instead of full filepath), to
   * change the github repo or branch.
   *
   */
  const fileLinks = (paths: string[], useBasename: boolean = true, repoSlug?: string, branch?: string): string => {
    // To support enterprise github, we need to handle custom github domains
    // this can be pulled out of the repo url metadata

    const githubRoot = pr.head.repo.html_url.split(pr.head.repo.owner.login)[0]
    const slug = repoSlug || pr.head.repo.full_name
    const ref = branch || pr.head.ref

    const toHref = (path: string) => `${githubRoot}${slug}/blob/${ref}/${path}`
    // As we should only be getting paths we can ignore the nullability
    const hrefs = paths.map(p => href(toHref(p), useBasename ? basename(p) : p)) as string[]
    return sentence(hrefs)
  }

  const createOrAddLabel = async (
    labelConfig: { name: string; color: string; description: string },
    repoConfig?: { owner: string; repo: string; id: number }
  ) => {
    // Create or re-use an existing label
    const config = repoConfig || { owner: pr.base.repo.owner.login, repo: pr.base.repo.name, id: pr.number }

    const existingLabels = await api.issues.getLabels({ owner: config.owner, repo: config.repo })
    const mergeOnGreen = existingLabels.data.find((l: any) => l.name == labelConfig.name)

    // Create the label if it doesn't exist yet
    if (!mergeOnGreen) {
      await api.issues.createLabel({
        owner: config.owner,
        repo: config.repo,
        name: labelConfig.name,
        color: labelConfig.color,
        description: labelConfig.description,
      })
    }

    // Then add the label
    await api.issues.addLabels({
      owner: config.owner,
      repo: config.owner,
      number: config.id,
      labels: [labelConfig.name],
    })
  }

  return {
    fileLinks,
    fileContents: fileContentsGenerator(api, pr.head.repo.full_name, pr.head.ref),
    createUpdatedIssueWithID: createUpdatedIssueWithIDGenerator(api),
    createOrAddLabel,
  }
}

/** Generates the fileContents function, needed so that Peril can re-create this func for an event */
export const fileContentsGenerator = (api: GitHub, defaultRepoSlug: string, defaultRef: string) => async (
  path: string,
  repoSlug?: string,
  ref?: string
): Promise<string> => {
  // Use the current state of PR if no repo/ref is passed
  if (!repoSlug || !ref) {
    repoSlug = defaultRepoSlug
    ref = defaultRef
  }
  const opts = {
    ref,
    path,
    repo: repoSlug.split("/")[1],
    owner: repoSlug.split("/")[0],
  }
  try {
    const response = await api.repos.getContent(opts)
    if (response && response.data && response.data.type === "file") {
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
    const { data: issue } = await api.issues.edit({ body, owner, repo, title, number: issueToUpdate.number, state })
    return issue.html_url
  } else {
    const { data: issue } = await api.issues.create({ body, owner, repo, title })
    return issue.html_url
  }
}

export default utils
