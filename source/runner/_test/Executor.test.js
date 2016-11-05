// @flow

import Executor from "../Executor"
import Fake from "../../ci_source/Fake"
import FakePlatform from "../../platforms/FakePlatform"

describe("setup", () => {
  it("gets diff / pr info in setup", () => {
    const exec = new Executor(new Fake({}), new FakePlatform())
    exec.setup()
  })

  it("creates a dangerfile based on the platform", () => {

  })
})
