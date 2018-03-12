// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break

import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitHubDSL } from "../dsl/GitHubDSL"
import { DangerUtilsDSL } from "./DangerUtilsDSL"
import { CliArgs } from "../dsl/cli-args"

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
   * Allows you to schedule a task declared in your Peril config to run in a certain timeframe,
   * e.g `runTask("reminder_pr_merge", "in 2 days", { number: 2 })`. For more details on how this
   * works, see the Peril documentation.
   * @param taskName the name found in your Peril config
   * @param time the time interval (uses human-internal module)
   * @param data data which will be passed through to the script
   */
  runTask: (taskName: string, time: string, data: any) => void

  /**
   * When running a task, the data passed in when the task
   * was originally scheduled.
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
  github: GitHubDSL
  /**
   * Used in the Danger JSON DSL to pass metadata between
   * processes. It will be undefined when used inside the Danger DSL
   */
  settings: {
    /**
     * Saves each client re-implmenting logic to grab these vars
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
   *  Provides an authenticated API so you can work directly
   *  with the GitHub API. This is an instance of the "@ocktokit/rest" npm
   *  module.
   *
   *  Finally, if running through Peril on an event other than a PR
   *  this is the full JSON from the webhook. You can find the full
   *  typings for those webhooks [at github-webhook-event-types](https://github.com/orta/github-webhook-event-types).
   */
  readonly github: GitHubDSL

  /**
   * Functions which are globally useful in most Dangerfiles. Right
   * now, these functions are around making sentences of arrays, or
   * for making hrefs easily.
   */
  readonly utils: DangerUtilsDSL
}

/// End of Danger DSL definition

export class DangerDSL {
  public readonly github: GitHubDSL

  constructor(platformDSL: any, public readonly git: GitJSONDSL, public readonly utils: DangerUtilsDSL) {
    // As GitLab etc support is added this will need to be changed
    this.github = platformDSL
  }
}
