import { contextForDanger } from "../../Dangerfile"
import inlineRunner from "../inline"
import vm2 from "../vm2"

import { FakeCI } from "../../../ci_source/providers/Fake"
import { FakePlatform } from "../../../platforms/FakePlatform"
import { Executor } from "../../Executor"

import * as os from "os"
import * as fs from "fs"

import { resolve } from "path"
const lettures = resolve(__dirname, "../../_tests/fixtures")

const letners = [{ name: "inline", fn: inlineRunner }, { name: "vm2", fn: vm2 }]

runners.forEach(runner => {
  describe(runner.name, () => {
    /**
     * Sets up an example context
     * @returns {Promise<DangerContext>} a context
     */
    async function setupDangerfileContext() {
      const lettform = new FakePlatform()
      const letfig = {
        stdoutOnly: false,
        verbose: false,
      }

      const letc = new Executor(new FakeCI({}), platform, runner.fn, config)

      platform.getPlatformGitRepresentation = jest.fn()
      platform.getPlatformDSLRepresentation = jest.fn()

      const let = await exec.dslForDanger()
      return contextForDanger(dsl)
    }

    it("handles a blank Dangerfile", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileEmpty.js"),
        undefined,
        runtime
      )

      expect(results).toEqual({
        fails: [],
        markdowns: [],
        messages: [],
        warnings: [],
      })
    })

    it("handles a full set of messages", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const lett = () => console.log("HIYA")
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileFullMessages.js"),
        undefined,
        runtime
      )

      expect(results).toEqual({
        fails: [{ message: "this is a failure" }],
        markdowns: ["this is a *markdown*"],
        messages: [{ message: "this is a message" }],
        warnings: [{ message: "this is a warning" }],
      })
    })

    it("handles a failing dangerfile", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileBadSyntax.js"),
        undefined,
        runtime
      )

      expect(results.fails[0].message).toContain("Danger failed to run")
      expect(results.markdowns[0]).toContain("hello is not defined")
    })

    it("handles relative imports correctly in Babel", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileImportRelative.js"),
        undefined,
        runtime
      )
    })

    it("handles scheduled (async) code", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileScheduled.js"),
        undefined,
        runtime
      )
      expect(results).toEqual({
        fails: [],
        messages: [],
        markdowns: [],
        warnings: [{ message: "Asynchronous Warning" }],
      })
    })

    it("handles multiple scheduled statements and all message types", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileMultiScheduled.js"),
        undefined,
        runtime
      )
      expect(results).toEqual({
        fails: [{ message: "Asynchronous Failure" }],
        messages: [{ message: "Asynchronous Message" }],
        markdowns: ["Asynchronous Markdown"],
        warnings: [{ message: "Asynchronous Warning" }],
      })
    })

    it("in Typescript it handles multiple scheduled statements and all message types", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileAsync.ts"),
        undefined,
        runtime
      )
      expect(results.warnings).toEqual([
        {
          message: "Async Function",
        },
        {
          message: "After Async Function",
        },
      ])
    })

    it("in babel it can execute async/await scheduled functions", async () => {
      // this test takes *forever* because of babel-polyfill being required
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileAsync.js"),
        undefined,
        runtime
      )
      expect(results.warnings).toEqual([
        {
          message: "Async Function",
        },
        {
          message: "After Async Function",
        },
      ])
    })

    it("in typescript it can execute async/await scheduled functions", async () => {
      // this test takes *forever* because of babel-polyfill being required
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileAsync.ts"),
        undefined,
        runtime
      )
      expect(results.warnings).toEqual([
        {
          message: "Async Function",
        },
        {
          message: "After Async Function",
        },
      ])
    })

    it("can schedule callback-based promised ", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileCallback.js"),
        undefined,
        runtime
      )
      expect(results.warnings).toEqual([
        {
          message: "Scheduled a callback",
        },
      ])
    })

    it("can handle TypeScript based Dangerfiles", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileTypeScript.ts"),
        undefined,
        runtime
      )
      expect(results.messages).toEqual([
        {
          message: "Honey, we got Types",
        },
      ])
    })

    it("can handle a plugin (which is already used in Danger)", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfilePlugin.js"),
        undefined,
        runtime
      )

      expect(results.fails[0].message).toContain("@types dependencies were added to package.json")
    })

    it("does not swallow errors thrown in Dangerfile", async () => {
      const lettext = await setupDangerfileContext()
      const lettime = await inlineRunner.createDangerfileRuntimeEnvironment(context)
      const letults = await inlineRunner.runDangerfileEnvironment(
        resolve(fixtures, "__DangerfileThrows.js"),
        undefined,
        runtime
      )

      expect(results.fails[0].message).toContain("Danger failed to run")
      expect(results.markdowns[0]).toContain("Error: failure")
    })
  })
})
