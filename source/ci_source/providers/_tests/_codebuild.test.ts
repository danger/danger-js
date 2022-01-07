import { CodeBuild } from "../CodeBuild"
import { getCISourceForEnv } from "../../get_ci_source"
import { getPullRequestIDForBranch } from "../../ci_source_helpers"

const correctEnv = {
  CODEBUILD_BUILD_ID: "123",
  CODEBUILD_SOURCE_VERSION: "pr/2",
  CODEBUILD_SOURCE_REPO_URL: "https://github.com/sharkysharks/some-repo",
  DANGER_GITHUB_API_TOKEN: "xxx",
}

const setupCodeBuildSource = async (env: Object) => {
  const source = new CodeBuild(env)
  await source.setup()

  return source
}

jest.mock("../../ci_source_helpers", () => ({
  ...jest.requireActual("../../ci_source_helpers"),
  getPullRequestIDForBranch: jest.fn(),
}))

describe("being found when looking for CI", () => {
  it("finds CodeBuild with the right ENV", () => {
    const cb = getCISourceForEnv(correctEnv)
    expect(cb).toBeInstanceOf(CodeBuild)
  })
})

describe(".isCI", () => {
  it("validates when all CodeBuild environment vars are set", async () => {
    const codebuild = await setupCodeBuildSource(correctEnv)
    expect(codebuild.isCI).toBeTruthy()
  })

  it("does not validate without env", async () => {
    const codebuild = await setupCodeBuildSource({})
    expect(codebuild.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all CodeBuild environment vars are set", async () => {
    const codebuild = await setupCodeBuildSource(correctEnv)
    expect(codebuild.isPR).toBeTruthy()
  })

  it("does not validate outside of CodeBuild", async () => {
    const codebuild = await setupCodeBuildSource({})
    expect(codebuild.isPR).toBeFalsy()
  })

  it.each(["CODEBUILD_BUILD_ID", "CODEBUILD_SOURCE_REPO_URL"])(`does not validate when %s is missing`, async key => {
    const copiedEnv = { ...correctEnv }
    delete copiedEnv[key]
    const codebuild = await setupCodeBuildSource(copiedEnv)
    expect(codebuild.isPR).toBeFalsy()
  })

  it("needs to have a PR number", async () => {
    let env = Object.assign({}, correctEnv)
    env.CODEBUILD_SOURCE_VERSION = "pr/abc"
    const codebuild = await setupCodeBuildSource(env)
    expect(codebuild.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it.each(["CODEBUILD_SOURCE_VERSION", "CODEBUILD_WEBHOOK_TRIGGER"])("splits it from %s", async key => {
    const codebuild = await setupCodeBuildSource({ [key]: "pr/2" })
    await codebuild.setup()
    expect(codebuild.pullRequestID).toEqual("2")
  })

  it("calls the API to get the PR number if not available in the env vars", async () => {
    ;(getPullRequestIDForBranch as jest.Mock).mockResolvedValue(1)
    const env = {
      CODEBUILD_SOURCE_REPO_URL: "https://github.com/sharkysharks/some-repo",
      CODEBUILD_WEBHOOK_TRIGGER: "branch/my-branch",
      DANGER_GITHUB_API_TOKEN: "xxx",
    }
    const codebuild = await setupCodeBuildSource(env)
    expect(codebuild.pullRequestID).toBe("1")
    expect(getPullRequestIDForBranch).toHaveBeenCalledTimes(1)
    expect(getPullRequestIDForBranch).toHaveBeenCalledWith(codebuild, env, "my-branch")
  })

  it("does not call the API if no PR number or branch name available in the env vars", async () => {
    const env = {
      CODEBUILD_SOURCE_REPO_URL: "https://github.com/sharkysharks/some-repo",
      CODEBUILD_WEBHOOK_TRIGGER: "tag/my-tag",
      DANGER_GITHUB_API_TOKEN: "xxx",
    }
    const codebuild = await setupCodeBuildSource(env)
    expect(codebuild.pullRequestID).toBe("0")
    expect(getPullRequestIDForBranch).not.toHaveBeenCalled()
  })
})

describe(".repoSlug", () => {
  it("parses it from the repo url", async () => {
    const codebuild = await setupCodeBuildSource(correctEnv)
    expect(codebuild.repoSlug).toEqual("sharkysharks/some-repo")
  })
})
