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
    ciSource: CISource
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
