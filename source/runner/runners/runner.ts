import { DangerResults } from "../../dsl/DangerResults"
import { DangerContext } from "../Dangerfile"

export interface DangerRunner {
  /**
   * Executes a Dangerfile at a specific path, with a context.
   * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
   *
   * @param {string} filename the file path for the dangerfile
   * @param {string | undefined} originalContents the contents of the Dangerfile, or undefined to use fs.readFileSync
   * @param {any} environment the resuts of createDangerfileRuntimeEnvironment
   * @returns {DangerResults} the results of the run
   */
  runDangerfileEnvironment: (
    filename: string,
    originalContents: string | undefined,
    environment: any
  ) => Promise<DangerResults>

  /**
   * Sets up the runtime environment for running Danger, this could be loading VMs
   * or creating new processes etc. The return value is expected to go into the environment
   * section of runDangerfileEnvironment.
   *
   * @param {DangerContext} dangerfileContext the global danger context, basically the DSL
   */
  createDangerfileRuntimeEnvironment: (dangerfileContext: DangerContext) => Promise<any>
}
