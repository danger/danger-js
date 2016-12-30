// @flow
"strict mode"

/** A json object that represents the outer ENV */
export type Env = any;

/** The shape of an object that represents an individual CI */
export interface CISource {
    /** The project name, mainly for showing errors */
    +name: string,

    /** The hash of environment variables */
    +env: Env,

    /** Does this validate as being on a particular CI? */
    +isCI: boolean,

    /** Does this validate as being on a particular PR on a CI? */
    +isPR: boolean,

    /** What is the reference slug for this environment? */
    +repoSlug: string,

    /** What platforms can this CI communicate with? */
    +supportedPlatforms: string[],

    /** What unique id can be found for the code review platform's PR */
    +pullRequestID: string,
}

import providers from "./providers"

/**
 * Gets a CI Source form the current environment, by asking all known
 * sources if they can be represented in this environment.
 * @param {Env} env The environment.
 * @returns {?CISource} a CI source if it's OK, otherwise Danger can't run.
*/
export function getCISourceForEnv(env: Env): ?CISource {
  const availableProviders = [...providers].map(Provider => new Provider(env)).filter(x => x.isCI)
  return (availableProviders && availableProviders.length > 0) ? availableProviders[0] : undefined
}

