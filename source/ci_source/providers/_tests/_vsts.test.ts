import { VSTS } from "../VSTS"
import { getCISourceForEnv } from "../../get_ci_source"

const PRNum = "2398"
const correctEnv = {
  SYSTEM_TEAMFOUNDATIONCOLLECTIONURI: "https://test.visualstudio.com/",
  BUILD_REPOSITORY_PROVIDER: "GitHub",
  BUILD_REASON: "PullRequest",
  BUILD_REPOSITORY_NAME: "artsy/eigen",
  BUILD_SOURCEBRANCH: `refs/pull/${PRNum}/merge`,
}

describe("being found when looking for CI", () => {
  it("finds VSTS with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(VSTS)
  })
})

describe(".isCI", () => {
  test("validates when all VSTS environment vars are set", () => {
    const vsts = new VSTS(correctEnv)
    expect(vsts.isCI).toBeTruthy()
  })

  test("does not validate without environment vars", () => {
    const vsts = new VSTS({})
    expect(vsts.isCI).toBeFalsy()
  })

  test("does not validate without the repository provider being set to github", () => {
    const vsts = new VSTS({ ...correctEnv, BUILD_REPOSITORY_PROVIDER: "VSTS" })
    expect(vsts.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  test("validates when all VSTS environment vars are set", () => {
    const vsts = new VSTS(correctEnv)
    expect(vsts.isPR).toBeTruthy()
  })

  test("does not validate without environment vars", () => {
    const vsts = new VSTS({})
    expect(vsts.isPR).toBeFalsy()
  })

  const envs = ["BUILD_SOURCEBRANCH", "BUILD_REPOSITORY_PROVIDER", "BUILD_REASON", "BUILD_REPOSITORY_NAME"]
  envs.forEach((key: string) => {
    let env = { ...correctEnv, [key]: null }

    test(`does not validate when ${key} is missing`, () => {
      const vsts = new VSTS(env)
      expect(vsts.isPR).toBeFalsy()
    })
  })

  it("needs to have a PR number", () => {
    let env = { ...correctEnv, BUILD_SOURCEBRANCH: null }
    const vsts = new VSTS(env)
    expect(vsts.isPR).toBeFalsy()
  })

  it("validates with the correct build reason", () => {
    const vsts = new VSTS({ ...correctEnv, BUILD_REASON: "PullRequest" })
    expect(vsts.isPR).toBeTruthy()
  })

  it("does not validate without the correct build reason", () => {
    const vsts = new VSTS({ ...correctEnv, BUILD_REASON: "Unknown" })
    expect(vsts.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const vsts = new VSTS(correctEnv)
    expect(vsts.pullRequestID).toEqual(PRNum)
  })
})

describe(".repoSlug", () => {
  it("pulls it out of the env", () => {
    const vsts = new VSTS(correctEnv)
    expect(vsts.repoSlug).toEqual("artsy/eigen")
  })
})
