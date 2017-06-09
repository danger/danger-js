import * as url from "url"
import * as includes from "lodash.includes"

export interface PullRequestParts {
  pullRequestNumber: string
  repo: string
}

export function pullRequestParser(address: string): PullRequestParts | null {
  const components = url.parse(address, false)
  if (components && components.path && includes(components.path, "pull")) {
    return {
      repo: components.path.split("/pull")[0].slice(1),
      pullRequestNumber: components.path.split("/pull/")[1],
    }
  }
  return null
}
