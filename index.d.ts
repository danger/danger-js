type Env = any;
declare var CISource: Danger.CISource

declare namespace Danger {
  export interface CISourceConstructor {
    new (env?: Env): CISource;
  }

  export interface CISource implements CISourceConstructor {
    /** The project name, mainly for showing errors */
    readonly name: string,

    /** The hash of environment variables */
    readonly env: Env,

    /** Does this validate as being on a particular CI? */
    readonly isCI: boolean,

    /** Does this validate as being on a particular PR on a CI? */
    readonly isPR: boolean,

    /** What is the reference slug for this environment? */
    readonly repoSlug: string,

    /** What platforms can this CI communicate with? */
    readonly supportedPlatforms: Array<string>,

    /** What unique id can be found for the code review platform's PR */
    readonly pullRequestID: string,
  }
}

declare module "danger" {
  export = Danger;
}