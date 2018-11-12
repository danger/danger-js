// Note: This file is ignored by Wallaby.js (but is included in jest runs)

import { contextForDanger } from "../../Dangerfile"
import vm2 from "../vm2"

import { FakeCI } from "../../../ci_source/providers/Fake"
import { FakePlatform } from "../../../platforms/FakePlatform"
import { Executor, ExecutorOptions } from "../../Executor"

import { resolve } from "path"
import { jsonToDSL } from "../../jsonToDSL"
import { jsonDSLGenerator } from "../../dslGenerator"
import { checkForNodeModules } from "../utils/transpiler"
const fixtures = resolve(__dirname, "../../_tests/fixtures")

checkForNodeModules()

// const runners = [{ name: "inline", fn: inlineRunner }, { name: "vm2", fn: vm2 }]
const runners = [{ name: "vm2", fn: vm2 }]
// const runners = [{ name: "inline", fn: inlineRunner }]

runners.forEach(run => {
  describe(run.name, () => {
    const config: ExecutorOptions = {
      stdoutOnly: false,
      verbose: false,
      jsonOnly: true,
      dangerID: run.name,
    }

    const makeExecutor = () => {
      const platform = new FakePlatform()

      exec = new Executor(new FakeCI({}), platform, run.fn, config)
      platform.getPlatformGitRepresentation = jest.fn()
      platform.getPlatformReviewDSLRepresentation = async () => ({
        pr: {},
      })
      return exec
    }

    /**
     * Sets up an example context
     * @returns {Promise<DangerContext>} a context
     */
    async function setupDangerfileContext() {
      const platform = new FakePlatform()
      const source = new FakeCI({})
      exec = new Executor(source, platform, run.fn, config)

      const dsl = await jsonDSLGenerator(platform, new FakeCI({}), {} as any)
      dsl.github = {
        pr: {
          number: 1,
          base: { sha: "321", repo: { full_name: "321" } },
          head: { sha: "123", repo: { full_name: "123" } },
        },
      } as any
      const realDSL = await jsonToDSL(dsl, source)
      return contextForDanger(realDSL)
    }

    let exec: Executor

    describe("with fixtures", () => {
      it("handles a blank Dangerfile", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileEmpty.js")],
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
        const exec = makeExecutor()

        await exec.dslForDanger()
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)

        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileFullMessages.js")],
          undefined,
          runtime
        )

        expect(results).toEqual({
          fails: [{ message: "this is a failure" }],
          markdowns: [{ message: "this is a *markdown*" }],
          messages: [{ message: "this is a message" }],
          warnings: [{ message: "this is a warning" }],
        })
      })

      it("handles a failing dangerfile", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileBadSyntax.js")],
          undefined,
          runtime
        )

        expect(results.fails[0].message).toContain("Danger failed to run")
        expect(results.markdowns[0].message).toContain("hello is not defined")
      })

      it("handles relative imports correctly in Babel", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileImportRelative.js")],
          undefined,
          runtime
        )
      })

      it("handles scheduled (async) code", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileScheduled.js")],
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
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileMultiScheduled.js")],
          undefined,
          runtime
        )
        expect(results).toEqual({
          fails: [{ message: "Asynchronous Failure" }],
          messages: [{ message: "Asynchronous Message" }],
          markdowns: [{ message: "Asynchronous Markdown" }],
          warnings: [{ message: "Asynchronous Warning" }],
        })
      })

      it("in Typescript it handles multiple scheduled statements and all message types", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileAsync.ts")],
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
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileAsync.js")],
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
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileAsync.ts")],
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
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileCallback.js")],
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
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileTypeScript.ts")],
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
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfilePlugin.js")],
          undefined,
          runtime
        )

        expect(results.fails[0].message).toContain("@types dependencies were added to package.json")
      })

      it("does not swallow errors thrown in Dangerfile", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileThrows.js")],
          undefined,
          runtime
        )

        expect(results.fails[0].message).toContain("Danger failed to run")
        expect(results.markdowns[0].message).toContain("Error: failure")
      })

      it("handles running default export code", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileDefaultExport.js")],
          undefined,
          runtime
        )
        expect(results).toEqual({
          fails: [],
          messages: [],
          markdowns: [],
          warnings: [{ message: "Synchronous Warning" }],
        })
      })

      it("handles running default export async code", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileDefaultExportAsync.js")],
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

      it("handles running multiple local files", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__DangerfileTypeScript.ts"), resolve(fixtures, "__DangerfileAsync.ts")],
          undefined,
          runtime
        )

        expect(results).toEqual({
          fails: [],
          markdowns: [],
          messages: [{ message: "Honey, we got Types" }],
          warnings: [{ message: "Async Function" }, { message: "After Async Function" }],
        })
      })

      it("handles running multiple dangerfiles with passed in content", async () => {
        const context = await setupDangerfileContext()
        const runtime = await exec.runner.createDangerfileRuntimeEnvironment(context)
        const results = await exec.runner.runDangerfileEnvironment(
          [resolve(fixtures, "__MadeUpDangerfileOne.ts"), resolve(fixtures, "__MadeUpDangerfileTwo.ts")],
          ["markdown('hello')", "markdown('hello2')"],
          runtime
        )

        expect(results).toEqual({
          fails: [],
          markdowns: [{ message: "hello" }, { message: "hello2" }],
          messages: [],
          warnings: [],
        })
      })
    })
  })
})
