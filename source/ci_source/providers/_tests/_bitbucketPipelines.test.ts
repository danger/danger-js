import { BitbucketPipelines } from "../BitbucketPipelines"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  BITBUCKET_GIT_HTTP_ORIGIN: "http://bitbucket.org/foo/bar",
  BITBUCKET_COMMIT: "9d2f95a4019935f91ed10e9d716d2b7551dcbcc1",
  BITBUCKET_REPO_SLUG: "bar",
  BITBUCKET_REPO_OWNER_UUID: "{b7f79a45-2e8d-4889-a6c8-68aa8c98dd99}",
  BITBUCKET_PR_ID: "30",
  BITBUCKET_PR_DESTINATION_BRANCH: "develop",
  BITBUCKET_BUILD_NUMBER: "5",
  BITBUCKET_PR_DESTINATION_COMMIT: "91c917d4389b82ec11a0d372b9e5754eb7727e4a",
  BITBUCKET_REPO_OWNER: "foo",
}

describe("being found when looking for CI", () => {
  it("finds BitbucketPipelines with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(BitbucketPipelines)
  })
})

describe(".isCI", () => {
  it("validates when all BitbucketPipelines environment vars are set", () => {
    const pipelines = new BitbucketPipelines(correctEnv)
    expect(pipelines.isCI).toBeTruthy()
  })

  it("does not validate without josh", () => {
    const pipelines = new BitbucketPipelines({})
    expect(pipelines.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all BuddyBuild environment vars are set", () => {
    const pipelines = new BitbucketPipelines(correctEnv)
    expect(pipelines.isPR).toBeTruthy()
  })

  it("does not validate outside of BuddyBuild", () => {
    const pipelines = new BitbucketPipelines({})
    expect(pipelines.isPR).toBeFalsy()
  })

  const envs = ["BITBUCKET_GIT_HTTP_ORIGIN", "BITBUCKET_REPO_SLUG", "BITBUCKET_REPO_OWNER", "BITBUCKET_PR_ID"]
  envs.forEach((key: string) => {
    let env = {
      BITBUCKET_GIT_HTTP_ORIGIN: "http://bitbucket.org/foo/bar",
      BITBUCKET_REPO_SLUG: "bar",
      BITBUCKET_REPO_OWNER: "foo",
      BITBUCKET_PR_ID: "30",
    }
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const pipelines = new BitbucketPipelines(env)
      expect(pipelines.isPR).toBeFalsy()
    })

    it("needs to have a PR number", () => {
      let env = {
        BITBUCKET_GIT_HTTP_ORIGIN: "http://bitbucket.org/foo/bar",
        BITBUCKET_REPO_SLUG: "bar",
        BITBUCKET_REPO_OWNER: "foo",
        BITBUCKET_PR_ID: "qw",
      }
      const pipelines = new BitbucketPipelines(env)
      expect(pipelines.isPR).toBeFalsy()
    })
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const pipelines = new BitbucketPipelines({ BITBUCKET_PR_ID: "800" })
    expect(pipelines.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("derives it from the PR Url", () => {
    const pipelines = new BitbucketPipelines(correctEnv)
    expect(pipelines.repoSlug).toEqual("foo/bar")
  })
})
