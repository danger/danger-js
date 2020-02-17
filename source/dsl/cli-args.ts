/**
 * Describes the possible arguments that
 * could be used when calling the CLI
 */
export interface CliArgs {
  /** The base reference used by danger PR (e.g. not master) */
  base: string
  /** For debugging  */
  verbose: string
  /** Used by danger-js o allow having a custom CI */
  externalCiProvider: string
  /** Use SDTOUT instead of posting to the code review side */
  textOnly: string
  /** A custom path for the dangerfile (can also be a remote reference) */
  dangerfile: string
  /** So you can have many danger runs in one code review */
  id: string
  /** Use staged changes */
  staged?: boolean
}

// NOTE: if add something new here, you need to change dslGenerator.ts
