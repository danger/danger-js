
interface DangerDSLType {
    git: GitDSL;
    github: GitHubDSL;
}
interface GitDSL {
  modified_files: string[],
  created_files: string[],
  deleted_files: string[]
}
interface GitHubDSL {
    pr: GitHubPRDSL
}
interface GitHubUser {
    id: number,
    login: string,
    type: "User" | "Organization"
}
interface GitHubRepo {
    id: number,
    name: string,
    full_name: string,
    owner: GitHubUser,
    private: bool,
    description: string,
    fork: false
}
interface GitHubSHARef {
    label: string,
    ref: string,
    sha: string,
    user: GitHubUser
}
interface GitHubPRDSL {
  number: number,
  state: "closed" | "open" | "locked" | "merged",
  locked: boolean,
  title: string,
  body: string,
  created_at: string,
  updated_at: string,
  closed_at: ?string,
  merged_at: ?string,
  head: GitHubSHARef,
  base: GitHubSHARef
}
declare module "danger" {
  declare module.exports: {
  /**
   * Fails a build, outputting a specific reason for failing
   *
   * @param {string} message the String to output
   */
    declare function fail(message: string): void;
  /** Typical console */
    declare var console: any;
  /** Typical require statement */
    declare function require(id: string): any;
  /**
   * The Danger object to work with
   *
   * @type {DangerDSL}
   */
    declare var danger: DangerDSL
  };
}
