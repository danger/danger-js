import { Codefresh } from "../Codefresh"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  CF_REPO_OWNER: "codefresh",
  CF_REPO_NAME: "someproject",
  CF_BUILD_ID: "1501",
  CF_PULL_REQUEST_NUMBER: "800",
  CF_BUILD_URL: "https://g.codefresh.io/build/1234",
}

describe("being found when looking for CI", () => {
  it("finds Codefresh with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Codefresh)
  })
})

describe(".isCI", () => {
  it("validates when all Codefresh environment vars are set", () => {
    const codefresh = new Codefresh(correctEnv)
    expect(codefresh.isCI).toBeTruthy()
  })

  it("does not validate without env", () => {
    const codefresh = new Codefresh({})
    expect(codefresh.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all Codefresh environment vars are set", () => {
    const codefresh = new Codefresh(correctEnv)
    expect(codefresh.isPR).toBeTruthy()
  })

  it("does not validate outside of Codefresh", () => {
    const codefresh = new Codefresh({})
    expect(codefresh.isPR).toBeFalsy()
  })

  const envs = ["CF_REPO_OWNER", "CF_REPO_NAME", "CF_BUILD_ID", "CF_PULL_REQUEST_NUMBER", "CF_BUILD_URL"]
  envs.forEach((key: string) => {
    let env = {
      CF_REPO_OWNER: "codefresh",
      CF_REPO_NAME: "someproject",
      CF_BUILD_ID: "1501",
      CF_PULL_REQUEST_NUMBER: "800",
      CF_BUILD_URL: "https://g.codefresh.io/build/1234",
    }
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const codefresh = new Codefresh({})
      expect(codefresh.isPR).toBeFalsy()
    })
  })

  it("needs to have an integer PR number", () => {
    let env = {
      CF_PULL_REQUEST_NUMBER: "asdasd",
    }
    const codefresh = new Codefresh(env)
    expect(codefresh.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const codefresh = new Codefresh({ CF_PULL_REQUEST_NUMBER: "800" })
    expect(codefresh.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("derives it from the PR Url", () => {
    const codefresh = new Codefresh(correctEnv)
    expect(codefresh.repoSlug).toEqual("codefresh/someproject")
  })
})
