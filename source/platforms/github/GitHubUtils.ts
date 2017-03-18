import {basename} from "path"
import {sentence, href} from "../../runner/DangerUtils"
import {GitHubPRDSL, GitHubUtilsDSL} from "./../../dsl/GitHubDSL"

// We need to curry in access to the GitHub PR metadata

const utils =  (pr: GitHubPRDSL) : GitHubUtilsDSL => {

  const fileLinks = (paths: string[], useBasename: boolean = true, repoSlug?: string, branch?: string): string => {
    // To support enterprise github, we need to handle custom github domains
    // this can be pulled out of the repo url metadata

    const githubRoot =  pr.head.repo.html_url.split(pr.head.repo.owner.login)[0]
    const slug = repoSlug || pr.head.repo.full_name
    const ref = branch || pr.head.ref

    const toHref = (path: string) => `${githubRoot}${slug}/blob/${ref}/${path}`
    // As we should only be getting paths we can ignore the nullability
    const hrefs = paths.map(p => href(toHref(p), useBasename ?  basename(p) : p )) as string[]
    return sentence(hrefs)
  }

  return {
    fileLinks
  }
}

export default utils
