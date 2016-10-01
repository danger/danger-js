// @flow

/** A type that represents the downloaded metadata about a code review session */
type Metadata = any;

/** A type that represents a comment */
type Comment = {
    id: string,
    body: string
}

export interface Platform {
    /** Fetch Pull Request Metadata */
    fetchPR: (id: string) => Promise<Metadata>,

    /** Download all the comments in a PR */
    downloadComments: (id: string) => Promise<Comment[]>,

    /** Create a comment on a PR */
    createComment: (body: string) => Promise<?Comment>,

    /** Delete comments on a PR */
    deleteComment: (env: any) => Promise<boolean>,

    /** Edit an existing comment */
    editComment: (comment: Comment, newBody: string) => Promise<boolean>
}
