// @flow

export interface CISource {
    /** hello */
    env: any,
    /** validates */
    isCI: (env: any) => boolean,
    /** PRs */
    isPR: (env: any) => boolean
}
