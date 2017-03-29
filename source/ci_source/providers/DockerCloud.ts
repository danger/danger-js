import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"

export class DockerCloud implements CISource {
  constructor(private readonly env: Env) {
  }

  get name(): string { return "Docker Cloud" }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["DOCKER_REPO"])
  }

  get isPR(): boolean {
    if (ensureEnvKeysExist(this.env, ["PULL_REQUEST_URL"])) {
      return true
    }

    const mustHave = ["SOURCE_REPOSITORY_URL", "PULL_REQUEST_URL"]
    return ensureEnvKeysExist(this.env, mustHave)
  }

  private _prParseURL(): {owner?: string, reponame?: string, id?: string} {
    const prUrl = this.env.PULL_REQUEST_URL || ""
    const splitSlug = prUrl.split("/")
    if (splitSlug.length === 7) {
      const owner = splitSlug[3]
      const reponame = splitSlug[4]
      const id = splitSlug[6]
      return {owner, reponame, id}
    }
    return {}
  }

  get pullRequestID(): string {
    const {id} = this._prParseURL()
    return id || ""
  }

  get repoSlug(): string {
    const {owner, reponame} = this._prParseURL()
    return (owner && reponame) ? `${owner}/${reponame}` : ""
  }

  get repoURL(): string { return this.env.SOURCE_REPOSITORY_URL }
  get supportedPlatforms(): string[] { return ["github"] }
}
