import { Env } from "./ci_source"
import { GitHubAPI } from "../platforms/github/GitHubAPI"
import { GitHubPRDSL } from "../dsl/GitHubDSL"
import find from "lodash.find"
import {
  BitBucketServerAPI,
  bitbucketServerRepoCredentialsFromEnv,
} from "../platforms/bitbucket_server/BitBucketServerAPI"
import { RepoMetaData } from "../dsl/BitBucketServerDSL"
import { BitBucketCloudAPI, bitbucketCloudCredentialsFromEnv } from "../platforms/bitbucket_cloud/BitBucketCloudAPI"

/**
 * Validates that all ENV keys exist and have a length
 * @param {Env} env The environment.
 * @param {[string]} keys Keys to ensure existence of
 * @returns {bool} true if they exist, false if not
 */
export function ensureEnvKeysExist(env: Env, keys: string[]): boolean {
  return keys.every((key: string) => env.hasOwnProperty(key) && env[key] != null && env[key].length > 0)
}

/**
 * Validates that all ENV keys exist and can be turned into ints
 * @param {Env} env The environment.
 * @param {[string]} keys Keys to ensure existence and number-ness of
 * @returns {bool} true if they are all good, false if not
 */
export function ensureEnvKeysAreInt(env: Env, keys: string[]): boolean {
  return keys.every((key: string) => env.hasOwnProperty(key) && !isNaN(parseInt(env[key])))
}

/**
 * Retrieves the current pull request open for this branch from an API
 * @param {Env} env The environment
 * @param {string} branch The branch to find pull requests for
 * @returns {number} The pull request ID, if any.  Otherwise 0 (Github starts from #1).
 * If there are multiple pull requests open for a branch, returns the first.
 */
export async function getPullRequestIDForBranch(metadata: RepoMetaData, env: Env, branch: string): Promise<number> {
  if (process.env["DANGER_BITBUCKETSERVER_HOST"]) {
    const api = new BitBucketServerAPI(metadata, bitbucketServerRepoCredentialsFromEnv(env))
    const prs = await api.getPullRequestsFromBranch(branch)
    if (prs.length) {
      return prs[0].id
    }
    return 0
  }
  if (process.env["DANGER_BITBUCKETCLOUD_OAUTH_KEY"] || process.env["DANGER_BITBUCKETCLOUD_USERNAME"]) {
    const api = new BitBucketCloudAPI(metadata, bitbucketCloudCredentialsFromEnv(env))
    const prs = await api.getPullRequestsFromBranch(branch)
    if (prs.length) {
      return prs[0].id
    }
    return 0
  }

  const token = env["DANGER_GITHUB_API_TOKEN"] || env["GITHUB_TOKEN"]
  if (!token) {
    return 0
  }
  const api = new GitHubAPI(metadata, token)
  const prs = (await api.getPullRequests()) as any[]
  const prForBranch: GitHubPRDSL = find(prs, (pr: GitHubPRDSL) => pr.head.ref === branch)
  if (prForBranch) {
    return prForBranch.number
  }
  return 0
}
