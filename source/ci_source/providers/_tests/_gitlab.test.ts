import { GitLabCI } from "../GitLabCI"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  GITLAB_CI: "true",
  CI_MERGE_REQUEST_IID: "27117",
  CI_PROJECT_PATH: "gitlab-org/gitlab-foss",
  // DANGER_GITLAB_API_TOKEN: "gitlab_dummy_a829-07bd7559eecb"
}

describe("being found when looking for CI", () => {
  it("finds GitLab with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(GitLabCI)
  })
})

describe(".isCI", () => {
  it("validates when all GitLab environment vars are set", async () => {
    const result = new GitLabCI(correctEnv)
    expect(result.isCI).toBeTruthy()
  })

  it("does not validate without env", async () => {
    const result = new GitLabCI({})
    expect(result.isCI).toBeFalsy()
  })
})

// missed

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const result = new GitLabCI(correctEnv)
    expect(result.pullRequestID).toEqual("27117")
  })
})

describe(".repoSlug", () => {
  it("derives it from the PR Url", () => {
    const result = new GitLabCI(correctEnv)
    expect(result.repoSlug).toEqual("gitlab-org/gitlab-foss")
  })
})
