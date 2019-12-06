import { CISource, Env } from "../ci_source/ci_source"
import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitHub } from "./GitHub"
import { GitHubAPI } from "./github/GitHubAPI"
import { BitBucketServer } from "./BitBucketServer"
import { BitBucketServerAPI, bitbucketServerRepoCredentialsFromEnv } from "./bitbucket_server/BitBucketServerAPI"
import { BitBucketCloud } from "./BitBucketCloud"
import { BitBucketCloudAPI, bitbucketCloudCredentialsFromEnv } from "./bitbucket_cloud/BitBucketCloudAPI"
import GitLabAPI, { getGitLabAPICredentialsFromEnv } from "./gitlab/GitLabAPI"
import GitLab from "./GitLab"
import { DangerResults } from "../dsl/DangerResults"
import { ExecutorOptions } from "../runner/Executor"
import { DangerRunner } from "../runner/runners/runner"
import chalk from "chalk"
import { FakePlatform } from "./FakePlatform"

/** A type that represents the downloaded metadata about a code review session */
export type Metadata = any

/** A type that represents a comment */
export type Comment = {
  /**
   *  UUID for the comment
   *
   */
  id: string
  /**
   * Textual representation of comment
   *
   */
  body: string
  /**
   * Was this posted by the account Danger has access to?
   */
  ownedByDanger: boolean
}

export interface Platform extends PlatformCommunicator {
  /** Mainly for logging and error reporting */
  readonly name: string

  getReviewInfo: () => Promise<any>
  /** Pulls in the platform specific metadata for code review runs in JSON format */
  getPlatformReviewDSLRepresentation: () => Promise<any>
  /** Pulls in the platform specific metadata for event runs */
  getPlatformReviewSimpleRepresentation?: () => Promise<any>
  /** Pulls in the Code Review Diff, and offers a succinct user-API for it */
  getPlatformGitRepresentation: () => Promise<GitJSONDSL>
  /** Get the contents of a file at a path */
  getFileContents: (path: string, slug?: string, ref?: string) => Promise<string>
  /** Optional: Wrap the danger evaluation with some of your code */
  executeRuntimeEnvironment?: (
    start: DangerRunner["runDangerfileEnvironment"],
    dangerfilePath: string,
    environment: any
  ) => Promise<void>
}

// This is basically the commenting aspect of a platform, which allow us to
// separate out the comment handling vs the DSL generation for a platform
export interface PlatformCommunicator {
  /** Basically, should a chance for async platform side-effects before passing the results into the comment section of danger issue create/update/deleter */
  platformResultsPreMapper?: (
    results: DangerResults,
    options: ExecutorOptions,
    ciCommitHash?: string
  ) => Promise<DangerResults>
  /** Can it update comments? */
  supportsCommenting: () => boolean
  /** Does the platform support inline comments? */
  supportsInlineComments: () => boolean
  /** Allows the platform to do whatever it wants, instead of using the default commenting system  */
  handlePostingResults?: (results: DangerResults, options: ExecutorOptions) => void
  /** Gets inline comments for current PR */
  getInlineComments: (dangerID: string) => Promise<Comment[]>
  /** Creates a comment on the PR */
  createComment: (dangerID: string, body: string) => Promise<any>
  /** Creates an inline comment on the PR if possible */
  createInlineComment: (git: GitDSL, comment: string, path: string, line: number) => Promise<any>
  /** Updates an inline comment */
  updateInlineComment: (comment: string, commentId: string) => Promise<any>
  /** Delete an inline comment */
  deleteInlineComment: (commentId: string) => Promise<boolean>
  /** Delete the main Danger comment */
  deleteMainComment: (dangerID: string) => Promise<boolean>
  /** Replace the main Danger comment, returning the URL to the issue */
  updateOrCreateComment: (dangerID: string, newComment: string) => Promise<string | undefined>
  /** Sets the current PR's status */
  updateStatus: (
    passed: boolean | "pending",
    message: string,
    url?: string,
    dangerID?: string,
    commitHash?: string
  ) => Promise<boolean>
}

/**
 * Pulls out a platform for Danger to communicate on based on the environment
 * @param {Env} env The environment.
 * @param {CISource} source The existing source, to ensure they can run against each other
 * @returns {Platform} returns a platform if it can be supported
 */
export function getPlatformForEnv(env: Env, source: CISource): Platform {
  // BitBucket Server
  if (env["DANGER_BITBUCKETSERVER_HOST"] || env["DANGER_PR_PLATFORM"] === BitBucketServer.name) {
    const api = new BitBucketServerAPI(
      {
        pullRequestID: source.pullRequestID,
        repoSlug: source.repoSlug,
      },
      bitbucketServerRepoCredentialsFromEnv(env)
    )
    return new BitBucketServer(api)
  }

  // Bitbucket Cloud
  if (
    env["DANGER_BITBUCKETCLOUD_OAUTH_KEY"] ||
    env["DANGER_BITBUCKETCLOUD_USERNAME"] ||
    env["DANGER_PR_PLATFORM"] === BitBucketCloud.name
  ) {
    const api = new BitBucketCloudAPI(
      {
        pullRequestID: source.pullRequestID,
        repoSlug: source.repoSlug,
      },
      bitbucketCloudCredentialsFromEnv(env)
    )
    return new BitBucketCloud(api)
  }

  // GitLab
  if (env["DANGER_GITLAB_API_TOKEN"] || env["DANGER_PR_PLATFORM"] === GitLab.name) {
    const api = new GitLabAPI(
      {
        pullRequestID: source.pullRequestID,
        repoSlug: source.repoSlug,
      },
      getGitLabAPICredentialsFromEnv(env)
    )
    return new GitLab(api)
  }

  // They need to set the token up for GitHub actions to work
  if (env["GITHUB_EVENT_NAME"] && !env["GITHUB_TOKEN"]) {
    console.error(`You need to add GITHUB_TOKEN to your Danger action in the workflow:
  
    - name: Danger JS
      uses: danger/danger-js@X.Y.Z
      ${chalk.green(`env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`)}
    `)
  }

  // GitHub Platform
  const ghToken = env["DANGER_GITHUB_API_TOKEN"] || env["GITHUB_TOKEN"]
  if (ghToken || env["DANGER_PR_PLATFORM"] === GitHub.name) {
    if (!ghToken) {
      console.log("You don't have a DANGER_GITHUB_API_TOKEN set up, this is optional, but TBH, you want to do this")
      console.log("Check out: http://danger.systems/js/guides/the_dangerfile.html#working-on-your-dangerfile")
    }

    const api = new GitHubAPI(source, ghToken)
    return GitHub(api)
  }

  // Support automatically returning a fake platform if you pass a Fake CI
  if (source.name === "Fake Testing CI") {
    return new FakePlatform()
  }

  console.error(
    "The DANGER_GITHUB_API_TOKEN/DANGER_BITBUCKETSERVER_HOST/DANGER_GITLAB_API_TOKEN environmental variable is missing"
  )
  console.error("Without an api token, danger will be unable to comment on a PR")
  throw new Error("Cannot use authenticated API requests.")
}
