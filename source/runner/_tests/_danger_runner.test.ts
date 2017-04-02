import { contextForDanger } from "../Dangerfile"
import {
  createDangerfileRuntimeEnvironment,
  runDangerfileEnvironment,
  updateDangerfile,
  cleanDangerfile,
  dangerJestConfig
} from "../DangerfileRunner"

import {FakeCI} from "../../ci_source/providers/Fake"
import {FakePlatform} from "../../platforms/FakePlatform"
import {Executor} from "../Executor"

import * as os from "os"
import * as fs from "fs"

import { resolve } from "path"
const fixtures = resolve(__dirname, "fixtures")

/**
 * Sets up an example context
 * @returns {Promise<DangerContext>} a context
 */
async function setupDangerfileContext() {
  const platform = new FakePlatform()
  const config = {
    stdoutOnly: false,
    verbose: false
  }

  const exec = new Executor(platform, config)

  platform.getPlatformGitRepresentation = jest.fn()
  platform.getPlatformDSLRepresentation = jest.fn()

  const dsl = await exec.dslForDanger()
  return contextForDanger(dsl)
}

if (process.platform !== "win32") {
  describe("with fixtures", () => {
    it("handles a blank Dangerfile", async () => {
      const context = await setupDangerfileContext()
      const runtime = await createDangerfileRuntimeEnvironment(context)
      const results = await runDangerfileEnvironment(resolve(fixtures, "__DangerfileEmpty.js"), runtime)

      expect(results).toEqual({
        fails: [],
        markdowns: [],
        messages: [],
        warnings: []
      })
    })

    it("handles a full set of messages", async () => {
      const context = await setupDangerfileContext()
      const runtime = await createDangerfileRuntimeEnvironment(context)
      const results = await runDangerfileEnvironment(resolve(fixtures, "__DangerfileFullMessages.js"), runtime)

      expect(results).toEqual({
        fails: [{"message": "this is a failure"}],
        markdowns: ["this is a *markdown*"],
        messages: [{"message": "this is a message"}],
        warnings: [{"message": "this is a warning"}]
      })
    })

    it("handles a failing dangerfile", async () => {
      const context = await setupDangerfileContext()
      const runtime = await createDangerfileRuntimeEnvironment(context)

      try {
        await runDangerfileEnvironment(resolve(fixtures, "__DangerfileBadSyntax.js"), runtime)
        throw new Error("Do not get to this")
      }
      catch (e) {
        // expect(e.message === ("Do not get to this")).toBeFalsy()
        expect(e.message).toEqual("hello is not defined")
      }
    })

    it("handles relative imports correctly", async () => {
      const context = await setupDangerfileContext()
      const runtime = await createDangerfileRuntimeEnvironment(context)
      await runDangerfileEnvironment(resolve(fixtures, "__DangerfileImportRelative.js"), runtime)
    })

    it("handles scheduled (async) code", async () => {
      const context = await setupDangerfileContext()
      const runtime = await createDangerfileRuntimeEnvironment(context)
      const results = await runDangerfileEnvironment(resolve(fixtures, "__DangerfileScheduled.js"), runtime)
      expect(results).toEqual({
        fails: [],
        messages: [],
        markdowns: [],
        warnings: [{ message: "Asynchronous Warning" }],
      })
    })

    it("handles multiple scheduled statements and all message types", async () => {
      const context = await setupDangerfileContext()
      const runtime = await createDangerfileRuntimeEnvironment(context)
      const results = await runDangerfileEnvironment(resolve(fixtures, "__DangerfileMultiScheduled.js"), runtime)
      expect(results).toEqual({
        fails: [{ message: "Asynchronous Failure" }],
        messages: [{ message: "Asynchronous Message" }],
        markdowns: ["Asynchronous Markdown"],
        warnings: [{ message: "Asynchronous Warning" }],
      })
    })

    // This adds > 6 seconds to the tests! Only orta should be forced into that.
    if (process.env["USER"] === "orta") {
      it("can execute async/await scheduled functions", async () => {
        // this test takes *forever* because of babel-polyfill being required
        const context = await setupDangerfileContext()
        const runtime = await createDangerfileRuntimeEnvironment(context)
        const results = await runDangerfileEnvironment(resolve(fixtures, "__DangerfileAsync.js"), runtime)
        expect(results.warnings).toEqual([{
          message: "Async Function"
        }, {
          message: "After Async Function"
        }])
      })
    }

    it("can schedule callback-based promised", async () => {
      const context = await setupDangerfileContext()
      const runtime = await createDangerfileRuntimeEnvironment(context)
      const results = await runDangerfileEnvironment(resolve(fixtures, "__DangerfileCallback.js"), runtime)
      expect(results.warnings).toEqual([{
        message: "Scheduled a callback",
      }])
    })

    it("can handle TypeScript based Dangerfiles", async () => {
      const context = await setupDangerfileContext()
      const runtime = await createDangerfileRuntimeEnvironment(context)
      const results = await runDangerfileEnvironment(resolve(fixtures, "__DangerfileTypeScript.ts"), runtime)
      expect(results.messages).toEqual([{
        message: "Honey, we got Types",
      }])
    })

  })
}

describe("cleaning Dangerfiles", () => {
  it("Supports removing the danger import", () => {
    const path = resolve(os.tmpdir(), "fake_dangerfile_1")
    fs.writeFileSync(path, "import { danger, warn, fail, message } from 'danger'")
    updateDangerfile(path)
    expect(fs.readFileSync(path).toString()).toEqual("// Removed import")
  })

  it("also handles typescript style imports", () => {
    const before = `
import { danger, warn, fail, message } from 'danger'
import { danger, warn, fail, message } from "danger"
import { danger, warn, fail, message } from "danger";
import danger from "danger"
import danger from 'danger'
import danger from 'danger';
`
    const after = `
// Removed import
// Removed import
// Removed import
// Removed import
// Removed import
// Removed import
`
    expect(cleanDangerfile(before)).toEqual(after)
  })

  it("also handles require style imports", () => {
        const before = `
const { danger, warn, fail, message } = require('danger')
var { danger, warn, fail, message } = require("danger")
let { danger, warn, fail, message } = require('danger');
`
    const after = `
// Removed require
// Removed require
// Removed require
`
    expect(cleanDangerfile(before)).toEqual(after)
  })
})

it("creates a working jest config", async () => {
  const config = await dangerJestConfig()
  // OK, this is almost perfect, but well, everyone has different paths.
  // So we'll amend the ones that should be different per developer/CI
  config.cacheDirectory = "[cache]"
  config.testPathDirs = ["[testPathDirs]"]
  config.testPathIgnorePatterns = ["[testPathIgnorePatterns]"]

  const cwd = process.cwd()
  config.transform = config.transform.map(([files, transformer]) => {
    const trans = transformer.includes("ts-jest")  ? "[ts-jest-transformer]" : transformer
    return [files, trans]
  })

  expect(config).toMatchSnapshot()
})
