// @flow

import { contextForDanger } from "../Dangerfile"
import {runDangerfile} from "../DangerfileRunner"
import Fake from "../../ci_source/Fake"
import FakePlatform from "../../platforms/FakePlatform"
import Executor from "../Executor"

import { resolve } from "path"
const fixtures = resolve(__dirname, "fixtures")

/**
 * Sets up an example context
 * @returns {Promise<DangerContext>} a context
*/
async function setupDangerfileContext() {
  const platform = new FakePlatform()
  const exec = new Executor(new Fake({}), platform)

  platform.getReviewDiff = jest.fn()
  platform.getReviewInfo = jest.fn()

  const dsl = await exec.dslForDanger()
  return contextForDanger(dsl)
}

describe("with fixtures", () => {
  it("handles a blank Dangerfile", async () => {
    const context = await setupDangerfileContext()
    const results = await runDangerfile(`${fixtures}/__DangerfileEmpty.js`, context)

    expect(results).toEqual({
      fails: [],
      markdowns: [],
      messages: [],
      warnings: []
    })
  })

  it("handles a full set of  messages", async () => {
    const context = await setupDangerfileContext()
    const results = await runDangerfile(`${fixtures}/__DangerfileFullMessages.js`, context)

    expect(results).toEqual({
      fails: [{"message": "this is a failure"}],
      markdowns: ["this is a *markdown*"],
      messages: [{"message": "this is a message"}],
      warnings: [{"message": "this is a warning"}]
    })
  })

  it("handles a full set of  messages", async () => {
    const context = await setupDangerfileContext()
    return runDangerfile(`${fixtures}/__DangerfileBadSyntax.js`, context).catch(e => {
      expect(e.toString().includes("hello is not defined")).toBeTruthy()
    })
  })
})

