import * as url from "url"
import includes from "lodash.includes"

export interface PullRequestParts {
  pullRequestNumber: string
  repo: string
}

export function pullRequestParser(address: string): PullRequestParts | null {
  const components = url.parse(address, false)

  if (components && components.path) {
    // shape: http://localhost:7990/projects/PROJ/repos/repo/pull-requests/1/overview
    const parts = components.path.match(/(projects\/\w+\/repos\/[\w-]+)\/pull-requests\/(\d+)/)
    if (parts) {
      return {
        repo: parts[1],
        pullRequestNumber: parts[2],
      }
    }

    // shape: http://github.com/proj/repo/pull/1
    if (includes(components.path, "pull")) {
      return {
        repo: components.path.split("/pull")[0].slice(1),
        pullRequestNumber: components.path.split("/pull/")[1],
      }
    }
  }

  return null
}
