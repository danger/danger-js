// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break

import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitHubDSL } from "../dsl/GitHubDSL"
import { BitBucketServerDSL, BitBucketServerJSONDSL } from "../dsl/BitBucketServerDSL"
import { DangerUtilsDSL } from "./DangerUtilsDSL"
import { CliArgs } from "../dsl/cli-args"
import { GitLabDSL } from "./GitLabDSL"
import { BitBucketCloudJSONDSL, BitBucketCloudDSL } from "./BitBucketCloudDSL"

/**
 * The shape of the JSON passed between Danger and a subprocess. It's built
 * to be expanded in the future.
 */
export interface DangerJSON {
  danger: DangerDSLJSONType
}

/**
 * The available Peril interface, it is possible that this is not
 * always up to date with true DSL in Peril, but I'll be giving it
 * a good shot.
 */

export interface PerilDSL {
  /**
   * A set of key:value string based on ENV vars that have
   * been set to be exposed to your Peril config
   */
  env: any

  /**
   * Allows you to schedule a task declared in your Peril config to run in a certain time-frame,
   * e.g `runTask("reminder_pr_merge", "in 2 days", { number: 2 })`. For more details on how this
   * works, see the Peril documentation.
   * @param taskName the name found in your Peril config
   * @param time the time interval (uses human-internal module)
   * @param data data which will be passed through to the script
   */
  runTask: (taskName: string, time: string, data: any) => void

  /**
   * When running a task, the data passed in when the task
   * was originally scheduled, you can also get this as the first
   * argument in a default function. Deprecated, use a default export
   * function. I'll remove this sometime.
   */
  data?: any
}

/**
 *  The root of the Danger JSON DSL.
 */

export interface DangerDSLJSONType {
  /** The data only version of Git DSL */
  git: GitJSONDSL
  /** The data only version of GitHub DSL */
  github?: GitHubDSL
  /** The data only version of BitBucket Server DSL */
  bitbucket_server?: BitBucketServerJSONDSL
  /** The data only version of BitBucket Cloud DSL */
  bitbucket_cloud?: BitBucketCloudJSONDSL
  /** The data only version of GitLab DSL */
  gitlab?: GitLabDSL
  /**
   * Used in the Danger JSON DSL to pass metadata between
   * processes. It will be undefined when used inside the Danger DSL
   */
  settings: {
    /**
     * Saves each client re-implementing logic to grab these vars
     * for their API clients
     */
    github: {
      /** API token for the GitHub client to use */
      accessToken: string
      /** Optional URL for enterprise GitHub */
      baseURL: string | undefined
      /** Optional headers to add to a request */
      additionalHeaders: any
    }
    /**
     * This is still a bit of a WIP, but this should
     * pass args/opts from the original CLI call through
     * to the process.
     */
    cliArgs: CliArgs
  }
}

/**
 *  The Danger DSL provides the metadata for introspection
 *  in order to create your own rules.
 */
export interface DangerDSLType {
  /**
   *  Details specific to the git changes within the code changes.
   *  Currently, this is just the raw file paths that have been
   *  added, removed or modified.
   */
  readonly git: GitDSL
  /**
   *  The GitHub metadata. This covers things like PR info,
   *  comments and reviews on the PR, label metadata, commits with
   *  GitHub user identities and some useful utility functions
   *  for displaying links to files.
   *
   * Strictly speaking, `github` is a nullable type, if you are not using
   * GitHub then it will be undefined. For the DSL convenience sake though, it
   * is classed as non-nullable
   *
   *  Provides an authenticated API so you can work directly
   *  with the GitHub API. This is an instance of the "@octokit/rest" npm
   *  module.
   *
   *  Finally, if running through Peril on an event other than a PR
   *  this is the full JSON from the webhook. [github-webhook-event-types](https://github.com/orta/github-webhook-event-types) has the full
   *  typings for those webhooks.
   */
  readonly github: GitHubDSL

  /**
   *  The BitBucket Server metadata. This covers things like PR info,
   *  comments and reviews on the PR, related issues, commits, comments
   *  and activities.
   *
   *  Strictly speaking, `bitbucket_server` is a nullable type, if you are not using
   *  BitBucket Server then it will be undefined. For the DSL convenience sake though, it
   *  is classed as non-nullable
   */
  readonly bitbucket_server: BitBucketServerDSL

  /**
   *  The BitBucket Cloud metadata. This covers things like PR info,
   *  comments and reviews on the PR, commits, comments, and activities.
   *
   *  Strictly speaking, `bitbucket_cloud` is a nullable type, if you are not using
   *  BitBucket Cloud then it will be undefined. For the DSL convenience sake though, it
   *  is classed as non-nullable
   */
  readonly bitbucket_cloud: BitBucketCloudDSL
  /**
   * The GitLab metadata. This covers things like PR info,
   * comments and reviews on the MR, commits, comments
   * and activities.
   *
   * Strictly speaking, `gitlab` is a nullable type, if you are not using
   * GitLab then it will be undefined. For the DSL convenience sake though, it
   * is classed as non-nullable
   */
  readonly gitlab: GitLabDSL

  /**
   * Functions which are globally useful in most Dangerfiles. Right
   * now, these functions are around making sentences of arrays, or
   * for making a like of href links easily.
   */
  readonly utils: DangerUtilsDSL
}

/// End of Danger DSL definition

export class DangerDSL {
  public readonly github?: GitHubDSL
  public readonly bitbucket_server?: BitBucketServerDSL
  public readonly gitlab?: GitLabDSL

  constructor(platformDSL: any, public readonly git: GitJSONDSL, public readonly utils: DangerUtilsDSL, name: string) {
    switch (name) {
      case "GitHub":
      case "Fake": // Testing only
        this.github = platformDSL
      case "BitBucketServer":
        this.bitbucket_server = platformDSL
      case "GitLab":
        this.gitlab = platformDSL
    }
  }
}
