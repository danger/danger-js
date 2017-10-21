import { basename } from "path"
import { sentence, href } from "../../runner/DangerUtils"
import { GitHubPRDSL, GitHubUtilsDSL } from "./../../dsl/GitHubDSL"

import * as GitHub from "github"

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

      const data = await api.repos.getContent({
        ref,
        path,
        repo: repoSlug.split("/")[1],
        owner: repoSlug.split("/")[0],
      })

      if (data && data.type === "file") {
        const buffer = new Buffer(data.content, data.encoding)
        return buffer.toString()
      } else {
        return ""
      }
    },
  }
}

export default utils
