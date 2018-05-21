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

  return {
    fileLinks,
    fileContents: async (path: string, repoSlug?: string, ref?: string): Promise<string> => {
      // Use the current state of PR if no repo/ref is passed
      if (!repoSlug || !ref) {
        repoSlug = pr.head.repo.full_name
        ref = pr.head.ref
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
    },
    createUpdatedIssueWithID: async (
      id: string,
      content: string,
      settings: { title: string; open: boolean; owner: string; repo: string }
    ) => {
      // Could also scope:
      //   by author
      //   by label
      //   by repo
      const uniqueHeader = `Danger-ID: ${id.replace(/ /g, "_")}`
      const { data: searchResults } = await api.search.issues({ q: uniqueHeader })
      d(`Got ${searchResults.total_count} for ${uniqueHeader}`)

      const body = `${content}\n\n`
      const { repo, owner, title } = settings
      const state = open ? "open" : "closed"

      if (searchResults.total_count) {
        const issueToUpdate = searchResults[0]
        const { data: issue } = await api.issues.edit({ body, owner, repo, title, number: issueToUpdate.number, state })
        return issue.html_url
      } else {
        const { data: issue } = await api.issues.create({ body, owner, repo, title })
        return issue.html_url
      }
    },
  }
}

export default utils
