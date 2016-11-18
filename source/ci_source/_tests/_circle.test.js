import Circle from "../Circle"

const correctEnv = {
  "CIRCLE_CI_API_TOKEN":"xxx",
  "CIRCLE_PROJECT_USERNAME":"circle_org",
  "CIRCLE_PROJECT_REPONAME":"someproject",
  "CIRCLE_BUILD_NUM": "1501",
  "CIRCLE_PR_NUMBER": "800",
  "CI_PULL_REQUEST": "https://github.com/artsy/eigen/pull/800"
}

describe(".isCI", () => {
  test("validates when all Circle environment vars are set", () => {
    const circle = new Circle(correctEnv)
    expect(circle.isCI).toBeTruthy()
  })

  test("does not validate without josh", () => {
    const circle = new Circle({})
    expect(circle.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  test("validates when all circle environment vars are set", () => {
    const circle = new Circle(correctEnv)
    expect(circle.isPR).toBeTruthy()
  })

  test("does not validate outside of circle", () => {
    const circle = new Circle({})
    expect(circle.isPR).toBeFalsy()
  })

  const envs = ["CIRCLE_CI_API_TOKEN", "CIRCLE_PROJECT_USERNAME", "CIRCLE_PROJECT_REPONAME", "CIRCLE_BUILD_NUM"]
  envs.forEach((key: string) => {
    var env = {
      "CIRCLE_CI_API_TOKEN":"xxx",
      "CIRCLE_PROJECT_USERNAME":"circle_org",
      "CIRCLE_PROJECT_REPONAME":"someproject",
      "CIRCLE_BUILD_NUM": "1501",
      "CIRCLE_PR_NUMBER": "800",
      "CI_PULL_REQUEST": "https://github.com/artsy/eigen/pull/800"
    }
    env[key] = null

    test(`does not validate when ${key} is missing`, () => {
      const circle = new Circle({})
      expect(circle.isPR).toBeFalsy()
    })
  })

  it("needs to have a PR number", () => {
    var env = {
      "CIRCLE_PR_NUMBER": "asdasd",
      "CIRCLE_REPO_SLUG": "artsy/eigen"
    }
    const circle = new Circle(env)
    expect(circle.isPR).toBeFalsy()
  })
})

describe(".pullReuestID", () => {
  it("pulls it out of the env", () => {
    const circle = new Circle({CIRCLE_PR_NUMBER: "800"})
    expect(circle.pullRequestID).toEqual("800")
  })

  it("can derive it from PR Url", () => {
    var env = {
      "CI_PULL_REQUEST": "https://github.com/artsy/eigen/pull/23"
    }
    const circle = new Circle(env)
    expect(circle.pullRequestID).toEqual("23")
  })
})

describe(".repoSlug", () => {
  it("derives it from the PR Url", () => {
    const circle = new Circle(correctEnv)
    expect(circle.repoSlug).toEqual("artsy/eigen")
  })
})
