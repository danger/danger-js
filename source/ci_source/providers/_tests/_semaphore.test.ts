import {Semaphore} from "../Semaphore"

const correctEnv = {
  "SEMAPHORE": "Yep",
  "SEMAPHORE_REPO_SLUG": "artsy/eigen",
  "PULL_REQUEST_NUMBER": "800"
}

describe(".isCI", () => {
  test("validates when all Semaphore environment vars are set", () => {
    const semaphore = new Semaphore(correctEnv)
    expect(semaphore.isCI).toBeTruthy()
  })

  test("does not validate without josh", () => {
    const semaphore = new Semaphore({})
    expect(semaphore.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  test("validates when all semaphore environment vars are set", () => {
    const semaphore = new Semaphore(correctEnv)
    expect(semaphore.isPR).toBeTruthy()
  })

  test("does not validate outside of semaphore", () => {
    const semaphore = new Semaphore({})
    expect(semaphore.isPR).toBeFalsy()
  })

  const envs = ["SEMAPHORE_CI_API_TOKEN", "SEMAPHORE_PROJECT_USERNAME", "SEMAPHORE_PROJECT_REPONAME", "SEMAPHORE_BUILD_NUM"]
  envs.forEach((key: string) => {
    let env = {
      "SEMAPHORE_CI_API_TOKEN": "xxx",
      "SEMAPHORE_PROJECT_USERNAME": "semaphore_org",
      "SEMAPHORE_PROJECT_REPONAME": "someproject",
      "SEMAPHORE_BUILD_NUM": "1501",
      "SEMAPHORE_PR_NUMBER": "800",
      "CI_PULL_REQUEST": "https://github.com/artsy/eigen/pull/800"
    }
    env[key] = null

    test(`does not validate when ${key} is missing`, () => {
      const semaphore = new Semaphore({})
      expect(semaphore.isPR).toBeFalsy()
    })
  })

  it("needs to have a PR number", () => {
    let env = {
      "SEMAPHORE_PR_NUMBER": "asdasd",
      "SEMAPHORE_REPO_SLUG": "artsy/eigen"
    }
    const semaphore = new Semaphore(env)
    expect(semaphore.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const semaphore = new Semaphore({PULL_REQUEST_NUMBER: "800"})
    expect(semaphore.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("derives it from the PR Url", () => {
    const semaphore = new Semaphore(correctEnv)
    expect(semaphore.repoSlug).toEqual("artsy/eigen")
  })
})
