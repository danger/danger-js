// @flow

/** A json object that represents the outer ENV */
export type Env = any;

/** The shape of an object that represents an individual CI */

export interface CISource {
    /** The hash of environment variables */
    env: Env,

    /** Does this validate as being on a particular CI? */
    isCI: boolean,

    /** Does this validate as being on a particular PR on a CI? */
    isPR: boolean,

    /** What is the reference slug for this environment? */
    repoSlug: string,

    /** What platforms can this CI communicate with? */
    supportedPlatforms: string[],

    /** What unique id can be found for the code review platform's PR */
    pullRequestID: string,

    /** What is the URL for the repo */
    repoURL: string,
}
