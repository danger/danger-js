// @flow
"use strict"

export default class Travis {
  env = []
  constructor (env: any) { this.env = env }

  isCI (env: any) : boolean {
    return true
  }
  isPR (env: any) : boolean {
    return true
  }
}
