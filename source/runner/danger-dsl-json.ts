import { DangerDSLJSONType } from "../dsl/DangerDSL"
import { GitJSONDSL } from "../dsl/GitDSL"
import { GitHubDSL } from "../dsl/GitHubDSL"
import { CliArgs } from "./cli-args"

/**
 * Using the input JSON create an DangerDSL
 *
 * @see DangerDSLJSONType for more detailed definition
 */
export class DangerDSLJSON implements DangerDSLJSONType {
  git: GitJSONDSL
  github: GitHubDSL
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
    this.settings.cliArgs = cliArgs
  }
}
