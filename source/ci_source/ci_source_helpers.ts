import { Env } from "./ci_source"

/**
 * Validates that all ENV keys exist and have a length
 * @param {Env} env The environment.
 * @param {[string]} keys Keys to ensure existence of
 * @returns {bool} true if they exist, false if not
 */
export function ensureEnvKeysExist(env: Env, keys: Array<string>): boolean {
  /*const hasKeys = keys.map((key: string): boolean => {
    return env.hasOwnProperty(key) && env[key] != null && env[key].length > 0
  });
  return !includes(hasKeys, false);*/

  return keys.map((key: string) => env.hasOwnProperty(key) && env[key] != null && env[key].length > 0)
    .filter(x => x === false).length === 0
}

/**
 * Validates that all ENV keys exist and can be turned into ints
 * @param {Env} env The environment.
 * @param {[string]} keys Keys to ensure existence and number-ness of
 * @returns {bool} true if they are all good, false if not
 */
export function ensureEnvKeysAreInt(env: Env, keys: Array<string>): boolean {
  /*const hasKeys = keys.map((key: string): boolean => {
    return env.hasOwnProperty(key) && !isNaN(parseInt(env[key]))
  })
  return !includes(hasKeys, false);*/

  return keys.map((key: string) => env.hasOwnProperty(key) && !isNaN(parseInt(env[key])))
    .filter(x => x === false).length === 0
}
