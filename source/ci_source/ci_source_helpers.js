// @flow
"use strict"

import type { Env } from "./ci_source"

/** Validates that all ENV keys exist and have a length */
export function ensureEnvKeysExist(env: Env, keys: string[]) : boolean {
  let hasKeys = keys.map((key: string) : boolean => {
    return env.hasOwnProperty(key) && env[key].length > 0
  })
  return !hasKeys.includes(false)
}

/** Validates that all ENV keys exist and can be turned into ints */
export function ensureEnvKeysAreInt(env: Env, keys: string[]) : boolean {
  let hasKeys = keys.map((key: string) : boolean => {
    return env.hasOwnProperty(key) && !isNaN(parseInt(env.TRAVIS_PULL_REQUEST))
  })
  return !hasKeys.includes(false)
}
