import { RepoMetaData } from "../../dsl/BitBucketServerDSL"
import { api as fetch } from "../../api/fetch"

export type GitLabAPIToken = string

class GitLabAPI {
  fetch: typeof fetch

  constructor(public readonly repoMetadata: RepoMetaData, public readonly token: GitLabAPIToken) {
    // This allows Peril to DI in a new Fetch function
    // which can handle unique API edge-cases around integrations
    this.fetch = fetch
  }
}

export default GitLabAPI
