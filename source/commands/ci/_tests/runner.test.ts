jest.mock("../../utils/runDangerSubprocess")
import { runDangerSubprocess } from "../../utils/runDangerSubprocess"
const mockRunDangerSubprocess = runDangerSubprocess as jest.Mock<typeof runDangerSubprocess>

import { runRunner } from "../runner"
import { SharedCLI } from "../../utils/sharedDangerfileArgs"
import { FakeCI } from "../../../ci_source/providers/Fake"
import { FakePlatform } from "../../../platforms/FakePlatform"
import { Executor } from "../../../runner/Executor"

const defaultAppArgs: Partial<SharedCLI> = {
  verbose: false,
  textOnly: false,
}

const source = new FakeCI({})
const platform = new FakePlatform()

it("uses the source and platform from config", async () => {
  await runRunner(defaultAppArgs as SharedCLI, { platform, source })

  // Pull the executor out of the call to runDangerSubprocess
  const executor: Executor = mockRunDangerSubprocess.mock.calls[0][2]
  expect(executor.ciSource).toEqual(source)
  expect(executor.platform).toEqual(platform)
})

// TODO: This occasionally fails!
it.skip("passes the dangerID from args into the executor config", async () => {
  const customArgs = {
    ...defaultAppArgs,
    id: "test-danger-run",
  } as SharedCLI

  await runRunner(customArgs, { platform, source })

  // Pull the executor out of the call to runDangerSubprocess
  const executor: Executor = mockRunDangerSubprocess.mock.calls[0][2]
  expect(executor.options.dangerID).toEqual("test-danger-run")
})
