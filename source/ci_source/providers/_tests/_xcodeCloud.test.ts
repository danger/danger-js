import { XcodeCloud } from "../XcodeCloud"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  CI: "TRUE",
  CI_XCODEBUILD_ACTION: "build",
  CI_PULL_REQUEST_TARGET_REPO: "someone/something",
  CI_PULL_REQUEST_NUMBER: "999",
}

describe("being found when looking for CI", () => {
  it("finds XcodeCloud with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(XcodeCloud)
  })
})

describe(".isCI", () => {
  it("validates when all XcodeCloud environment vars are set", () => {
    const xcodeCloud = new XcodeCloud(correctEnv)
    expect(xcodeCloud.isCI).toBeTruthy()
  })

  it("does not validate", () => {
    const xcodeCloud = new XcodeCloud({})
    expect(xcodeCloud.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all XcodeCloud environment vars are set", () => {
    const xcodeCloud = new XcodeCloud(correctEnv)
    expect(xcodeCloud.isPR).toBeTruthy()
  })

  it("does not validate outside of XcodeCloud", () => {
    const xcodeCloud = new XcodeCloud({})
    expect(xcodeCloud.isPR).toBeFalsy()
  })

  const envs = ["CI_PULL_REQUEST_TARGET_REPO", "CI_PULL_REQUEST_NUMBER"]
  envs.forEach((key: string) => {
    let env = {
      CI_PULL_REQUEST_TARGET_REPO: "someone/something",
      CI_PULL_REQUEST_NUMBER: "999",
    }
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const xcodeCloud = new XcodeCloud(env)
      expect(xcodeCloud.isPR).toBeFalsy()
    })
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const xcodeCloud = new XcodeCloud({ CI_PULL_REQUEST_NUMBER: "999" })
    expect(xcodeCloud.pullRequestID).toEqual("999")
  })
})

describe(".repoSlug", () => {
  it("pulls it out of the env", () => {
    const xcodeCloud = new XcodeCloud({ CI_PULL_REQUEST_TARGET_REPO: "someone/something" })
    expect(xcodeCloud.repoSlug).toEqual("someone/something")
  })
})

describe("commit hash", () => {
    it("returns correct commit hash when present", () => {
      const env = {
        ...correctEnv,
        CI_COMMIT: "1234abc",
      }
      const xcodeCloud = new XcodeCloud(env)
      expect(xcodeCloud.commitHash).toEqual("1234abc")
    })

    it("returns no commit hash when not present", () => {
      const xcodeCloud = new XcodeCloud(correctEnv)
      expect(xcodeCloud.commitHash).toBeUndefined()
    })
  })
