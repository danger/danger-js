// @flow
"use strict"

import type { Env } from "./ci_source"

/**
 * Validates that all ENV keys exist and have a length
 * @param {Env} env The environment.
 * @param {[string]} keys Keys to ensure existence of
 * @returns {bool} true if they exist, false if not
*/
export function ensureEnvKeysExist(env: Env, keys: string[]): boolean {
  const hasKeys = keys.map((key: string): boolean => {
    return env.hasOwnProperty(key) && env[key] != null && env[key].length > 0
  })
  return !hasKeys.includes(false)
}

/**
 * Validates that all ENV keys exist and can be turned into ints
 * @param {Env} env The environment.
 * @param {[string]} keys Keys to ensure existence and number-ness of
 * @returns {bool} true if they are all good, false if not
*/
export function ensureEnvKeysAreInt(env: Env, keys: string[]): boolean {
  const hasKeys = keys.map((key: string): boolean => {
    return env.hasOwnProperty(key) && !isNaN(parseInt(env[key]))
  })
  return !hasKeys.includes(false)
}
