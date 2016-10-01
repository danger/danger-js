// @flow
"use strict"

export default class Travis {
  env: any
  constructor (env: any) { this.env = env }

  get isCI () : boolean {
    return this.env.HAS_JOSH_K_SEAL_OF_APPROVAL != null
  }

  get isPR () : boolean {
    let mustHave = ["TRAVIS_PULL_REQUEST", "TRAVIS_REPO_SLUG"]
    // TODO: has valid int for TRAVIS_PULL_REQUEST
    let hasKey = mustHave.map((key: string) : boolean => {
      return this.env.hasOwnProperty(key) && this.env[key].length > 0
    })

    let gotRequiredKeys = !hasKey.includes(false)
    return gotRequiredKeys
  }
}
