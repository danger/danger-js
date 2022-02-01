/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DangerDSLJSONType } from "../dsl/DangerDSL"
import { GitJSONDSL } from "../dsl/GitDSL"
import { GitHubDSL } from "../dsl/GitHubDSL"
import { CliArgs } from "../dsl/cli-args"

/**
 * Using the input JSON create an DangerDSL
 *
 * @see DangerDSLJSONType for more detailed definition
 */
export class DangerDSLJSON implements DangerDSLJSONType {
  // Prettier + `git!` do not work yet
  // and this class uses runtime hackery

  // @ts-ignore
  git: GitJSONDSL
  // @ts-ignore
  github: GitHubDSL
  // @ts-ignore
  settings: {
    github: {
      accessToken: string
      baseURL: string | undefined
      additionalHeaders: any
    }
    cliArgs: CliArgs
  }
  /**
   * Parse the JSON and assign danger to this object
   *
   * Also add the arguments sent to the CLI
   *
   * @param JSONString DSL in JSON format
   * @param cliArgs arguments used running danger command
   */
  constructor(JSONString: string, cliArgs: CliArgs) {
    const parsedString = JSON.parse(JSONString)
    Object.assign(this, parsedString.danger)

    // Merge the command line settings with the settings from the
    // original command invocation.  This is needed because some
    // commands like danger-local have options that are unknown to
    // danger-runner
    // @ts-ignore
    Object.assign(this.settings.cliArgs, cliArgs)
  }
}
