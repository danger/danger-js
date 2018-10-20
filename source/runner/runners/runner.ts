import { DangerResults } from "../../dsl/DangerResults"
import { DangerContext } from "../Dangerfile"

export interface DangerRunner {
  /**
   * Executes a Dangerfile at a specific path, with a context.
   * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
   *
   * @param {string[]} filenames a set of file paths for the dangerfile
   * @param {string[] | undefined[]} originalContents optional, the JS pre-compiled
   * @param {DangerContext} environment the results of createDangerfileRuntimeEnvironment
   * @param {any | undefined} injectedObjectToExport an optional object for passing into default exports
   * @returns {DangerResults} the results of the run
   */
  runDangerfileEnvironment: (
    filenames: string[],
    originalContents: string[] | undefined[] | undefined,
    environment: any,
    injectedObjectToExport?: any
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
