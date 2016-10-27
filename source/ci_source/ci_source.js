// @flow
"strict mode"

/** A json object that represents the outer ENV */
export type Env = any;

/** The shape of an object that represents an individual CI */

export interface CISource {
    /** The name, mainly for showing errors */
    env: string,

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

import Travis from "./travis"
import Fake from "./fake"

/**
 * Gets a CI Source form the current environment, by asking all known
 * sources if they can be represented in this environment.
 * @param {Env} env The environment.
 * @returns {?CISource} a CI source if it's OK, otherwise Danger can't run.
*/
export function getCISourceForEnv(env: Env) : ?CISource {
  // Fake is what I'm using during dev for the minute
  const travis = new Travis(env)
  if (travis.isCI) {
    return travis
  } else {
    return new Fake()
  }
}

