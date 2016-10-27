// @flow

import type { CISource } from "../ci_source/ci_source"

/** A type that represents the downloaded metadata about a code review session */
export type Metadata = any;

/** A type that represents a comment */
export type Comment = {
    id: string,
    body: string
}

export interface Platform {
    /** Mainly for logging and error reporting */
    name: String,
    ciSource: CISource,
    /** Pulls in the Code Review Metadata for inspection */
    getReviewInfo: () => Promise<any>,
    /** Pulls in the Code Review Diff, and offers a succinct user-API for it */
    fetchDiffInfo: () => Promise<GitDSL>
}

//     envVars: () => string[];
//     optionalEnvVars: () => string[];

//     /** Fetch Pull Request Metadata */
//     async fetchPR: (id: string) => Promise<Metadata>;

//     /** Download all the comments in a PR */
//     async downloadComments: (id: string) => Promise<Comment[]>;

//     /** Create a comment on a PR */
//     async  createComment: (body: string) => Promise<?Comment>;

//     /** Delete comments on a PR */
//     async deleteComment: (env: any) => Promise<boolean>;

//     /** Edit an existing comment */
//     async editComment: (comment: Comment, newBody: string) => Promise<boolean>;
// }

import { GitHub } from "./github"

/**
 * Pulls out a platform for Danger to communicate on based on the environment
 * @param {Env} env The environment.
 * @param {CISource} source The existing source, to ensure they can run against each other
 * @returns {?Platform} returns a platform if it can be supported
*/
export function getPlatformForEnv(env: Env, source: CISource) : ?Platform {
  const github = new GitHub(env["DANGER_GITHUB_API_TOKEN"], source)
  return github
}

