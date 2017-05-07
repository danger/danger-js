
/** A json object that represents the outer ENV */
export type Env = any

/** Key details about a repo */
export interface RepoMetaData {
  /** A path like "artsy/eigen" */
  repoSlug: string,
  /** The ID for the pull/merge request "11" */
  pullRequestID: string
}

/** The shape of an object that represents an individual CI */
export interface CISource {
  /** The project name, mainly for showing errors */
  readonly name: string

  /** Does this validate as being on a particular CI? */
  readonly isCI: boolean

  /** Does this validate as being on a particular PR on a CI? */
  readonly isPR: boolean

  /** What is the reference slug for this environment? */
  readonly repoSlug: string

  /** What platforms can this CI communicate with? */
  readonly supportedPlatforms: string[]

  /** What unique id can be found for the code review platform's PR */
  readonly pullRequestID: string

  /** allows the source to do some setup */
  setup?(): Promise<any>
}
