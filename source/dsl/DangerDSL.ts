import { GitDSL } from '../dsl/GitDSL';
import { GitHubPRDSL, GitHubDSL } from '../dsl/GitHubDSL';

/**
 *  The Danger DSL provides the metadata for introspection
 *  in order to create your own rules.
 */
export interface DangerDSLType {
  /**
   *  Details specific to the git changes within the code changes.
   *  Currently, this is just the raw file paths that have been
   *  added, removed or modified.
   */
  readonly git: Readonly<GitDSL>;
  /**
   *  The GitHub metadata.
   */
  readonly github: Readonly<GitHubDSL>;
}

/* END FLOWTYPE EXPORT */

export class DangerDSL {
  public readonly github: Readonly<GitHubDSL>;

  constructor(pr: GitHubPRDSL, public readonly git: GitDSL) {
    this.github = {
      pr
    };
  }
}
