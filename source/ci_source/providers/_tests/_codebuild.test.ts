import { CodeBuild } from "../CodeBuild"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  CODEBUILD_BUILD_ID: "123",
  CODEBUILD_SOURCE_VERSION: "pr/2",
  CODEBUILD_SOURCE_REPO_URL: "https://github.com/sharkysharks/some-repo",
  DANGER_GITHUB_API_TOKEN: "xxx",
}

describe("being found when looking for CI", () => {
  it("finds CodeBuild with the right ENV", () => {
    const cb = getCISourceForEnv(correctEnv)
    expect(cb).toBeInstanceOf(CodeBuild)
  })
})

describe(".isCI", () => {
  it("validates when all CodeBuild environment vars are set", () => {
    const codebuild = new CodeBuild(correctEnv)
    expect(codebuild.isCI).toBeTruthy()
  })

  it("does not validate without env", () => {
    const codebuild = new CodeBuild({})
    expect(codebuild.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all CodeBuild environment vars are set", () => {
    const codebuild = new CodeBuild(correctEnv)
    expect(codebuild.isPR).toBeTruthy()
  })

  it("does not validate outside of CodeBuild", () => {
    const codebuild = new CodeBuild({})
    expect(codebuild.isPR).toBeFalsy()
  })

  const envs = ["CODEBUILD_BUILD_ID", "CODEBUILD_SOURCE_VERSION", "CODEBUILD_SOURCE_REPO_URL"]
  envs.forEach((key: string) => {
    let env = Object.assign({}, correctEnv)
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const codebuild = new CodeBuild({})
      expect(codebuild.isPR).toBeFalsy()
    })
  })

  it("needs to have a PR number", () => {
    let env = Object.assign({}, correctEnv)
    env.CODEBUILD_SOURCE_VERSION = "pr/abc"
    const codebuild = new CodeBuild(env)
    expect(codebuild.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it("splits it from the env", () => {
    const codebuild = new CodeBuild({ CODEBUILD_SOURCE_VERSION: "pr/2" })
    expect(codebuild.pullRequestID).toEqual("2")
  })
})

describe(".repoSlug", () => {
  it("parses it from the repo url", () => {
    const codebuild = new CodeBuild(correctEnv)
    expect(codebuild.repoSlug).toEqual("sharkysharks/some-repo")
  })
})
