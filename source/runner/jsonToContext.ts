import { CliArgs } from "../dsl/cli-args"
import { jsonToDSL } from "./jsonToDSL"
import { contextForDanger, DangerContext } from "./Dangerfile"
import { DangerDSLJSON } from "./dangerDSLJSON"
import { CISource } from "../ci_source/ci_source"

/**
 * Reads in the JSON string converts to a dsl object and gets the change context
 * to be used for Danger.
 * @param JSONString {string} from stdin
 * @param program {any} commander
 * @returns {Promise<DangerContext>} context for danger
 */
export async function jsonToContext(JSONString: string, program: any, source: CISource): Promise<DangerContext> {
  const dslJSON = { danger: new DangerDSLJSON(JSONString, program as CliArgs) }
  const dsl = await jsonToDSL(dslJSON.danger, source)
  return contextForDanger(dsl)
}
