import { Env, RepoMetaData } from "./ci_source"
import { GitHubAPI } from "../platforms/github/GitHubAPI"
import { GitHubPRDSL } from "../dsl/GitHubDSL"
import * as find from "lodash.find"

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

/**
 * Retrieves the current pull request open for this branch from the GitHub API
 * @param {Env} env The environment
 * @param {string} branch The branch to find pull requests for
 * @returns {number} The pull request ID, if any.  Otherwise 0 (Github starts from #1).
 * If there are multiple pull requests open for a branch, returns the first.
 */
export async function getPullRequestIDForBranch(metadata: RepoMetaData, env: Env, branch: string): Promise<number> {
  const token = env["DANGER_GITHUB_API_TOKEN"]
  if (!token) {
    return 0
  }
  const api = new GitHubAPI(metadata, token)
  const prs = await api.getPullRequests() as any[]
  const prForBranch: GitHubPRDSL = find(prs, (pr: GitHubPRDSL) => pr.head.ref === branch)
  if (prForBranch) {
    return prForBranch.number
  }
  return 0
}
