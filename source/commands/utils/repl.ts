import * as repl from "repl"

import { DangerContext } from "../../runner/Dangerfile"

function openRepl(dangerContext: DangerContext): void {
  /**
   * Injects a read-only, global variable into the REPL
   *
   * @param {repl.REPLServer} repl The Node REPL created via `repl.start()`
   * @param {string} name The name of the global variable
   * @param {*} value The value of the global variable
   */
  function injectReadOnlyProperty(repl: repl.REPLServer, name: string, value: any) {
    Object.defineProperty(repl["context"], name, {
      configurable: false,
      enumerable: true,
      value,
    })
  }

  /**
   * Sets up the Danger REPL with `danger` and `results` global variables
   *
   * @param {repl.REPLServer} repl The Node REPL created via `repl.start()`
   */
  function setup(repl: repl.REPLServer) {
    injectReadOnlyProperty(repl, "danger", dangerContext.danger)
    injectReadOnlyProperty(repl, "results", dangerContext.results)
  }

  const dangerRepl = repl.start({ prompt: "> " })
  setup(dangerRepl)
  dangerRepl.on("exit", () => process.exit())
  // Called when `.clear` is executed in the Node REPL
  // This ensures that `danger` and `results` are not cleared from the REPL context
  dangerRepl.on("reset", () => setup(dangerRepl))
}

export default openRepl
