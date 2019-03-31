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

beforeEach(() => {
  mockRunDangerSubprocess.mockReset()
})

it("uses the source and platform from config", async () => {
  await runRunner(defaultAppArgs as SharedCLI, { platform, source })

  // Pull the executor out of the call to runDangerSubprocess
  const executor: Executor = mockRunDangerSubprocess.mock.calls[0][2]
  expect(executor.ciSource).toEqual(source)
  expect(executor.platform).toEqual(platform)
})

it("does not use GitHub Checks by default", async () => {
  await runRunner(defaultAppArgs as SharedCLI, { platform, source })

  // Pull the executor out of the call to runDangerSubprocess
  const executor: Executor = mockRunDangerSubprocess.mock.calls[0][2]
  expect(executor.ciSource).toEqual(source)
  expect(executor.platform).toEqual(platform)
  expect(executor.options.disableGitHubChecksSupport).toEqual(true)
})

it("uses GitHub Checks if requested", async () => {
  const customArgs = {
    ...defaultAppArgs,
    useGithubChecks: true,
  } as SharedCLI
  await runRunner(customArgs, { platform, source })

  // Pull the executor out of the call to runDangerSubprocess
  const executor: Executor = mockRunDangerSubprocess.mock.calls[0][2]
  expect(executor.ciSource).toEqual(source)
  expect(executor.platform).toEqual(platform)
  expect(executor.options.disableGitHubChecksSupport).toEqual(false)
})

it("does not use GitHub Checks if requested not to", async () => {
  const customArgs = {
    ...defaultAppArgs,
    useGithubChecks: false,
  } as SharedCLI
  await runRunner(customArgs, { platform, source })

  // Pull the executor out of the call to runDangerSubprocess
  const executor: Executor = mockRunDangerSubprocess.mock.calls[0][2]
  expect(executor.ciSource).toEqual(source)
  expect(executor.platform).toEqual(platform)
  expect(executor.options.disableGitHubChecksSupport).toEqual(true)
})

it("passes the strictm option from args into the executor config", async () => {
  const customArgs = {
    ...defaultAppArgs,
    strict: true,
  } as SharedCLI

  await runRunner(customArgs, { platform, source })

  // Pull the executor out of the call to runDangerSubprocess
  const executor: Executor = mockRunDangerSubprocess.mock.calls[0][2]
  expect(executor.options.strict).toEqual(true)
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
