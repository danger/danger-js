import { CliArgs } from "./cli-args"
import { jsonToDSL } from "./jsonToDSL"
import { contextForDanger, DangerContext } from "./Dangerfile"
import { DangerDSLJSON } from "./danger-dsl-json"

/**
 * Reads in the JSON string converts to a dsl object and gets the change context
 * to be used for Danger.
 * @param JSONString {string} from stdin
 * @param program {any} commander
 * @returns {Promise<DangerContext>} context for danger
 */
export async function jsonToContext(JSONString: string, program: any): Promise<DangerContext> {
  const dslJSON = { danger: new DangerDSLJSON(JSONString, program as CliArgs) }
  const dsl = await jsonToDSL(dslJSON.danger)
  return contextForDanger(dsl)
}
