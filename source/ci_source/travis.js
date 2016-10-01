// @flow
"use strict"

export default class Travis {
  env: any
  constructor (env: any) { this.env = env }

  get isCI () : boolean {
    return this.env.HAS_JOSH_K_SEAL_OF_APPROVAL != null
  }

  get isPR () : boolean {
    return this.env.HAS_JOSH_K_SEAL_OF_APPROVAL != null
  }
}
