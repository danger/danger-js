// @flow
"use strict"

import type { Env } from "./ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "./ci_source_helpers"
export default class Circle {
  env: Env
  constructor(env: Env) { this.env = env }

  get name(): string { return "Circle CI" }

  get isCI() : boolean {
    return ensureEnvKeysExist(this.env, ["CIRCLE_BUILD_NUM"])
  }

  get isPR() : boolean {
    if (ensureEnvKeysExist(this.env, ["CI_PULL_REQUEST"])) {
      return true
    }

    const mustHave = ["CIRCLE_CI_API_TOKEN", "CIRCLE_PROJECT_USERNAME", "CIRCLE_PROJECT_REPONAME", "CIRCLE_BUILD_NUM"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, ["CIRCLE_PR_NUMBER"])
  }

  _prParseURL(): {owner?: string, reponame?: string, id?: string} {
    const pr_url = this.env.CI_PULL_REQUEST || '';
    const split_slug = pr_url.split('/')
    if (split_slug.length === 7) {
      const owner = split_slug[3]
      const reponame = split_slug[4]
      const id = split_slug[6]
      return {owner, reponame, id}
    }
    return {}
  }

  get pullRequestID(): string {
    if (this.env.CIRCLE_PR_NUMBER) {
      return this.env.CIRCLE_PR_NUMBER
    } else {
      const {id} = this._prParseURL()
      return id ? id : ''
    }
  }

  get repoSlug(): string {
    const {owner, reponame} = this._prParseURL()
    return (owner && reponame) ? `${owner}/${reponame}` : ''
  }

  get repoURL(): string { return this.env.CIRCLE_REPOSITORY_URL }
  get supportedPlatforms() : string[] { return ["github"] }
}
