import { Woodpecker } from "../Woodpecker"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  CI: "woodpecker",
  CI_COMMIT_PULL_REQUEST: "800",
  CI_REPO: "artsy/eigen",
  CI_COMMIT_SHA: "6a1b2c3d4e5f",
  CI_PIPELINE_URL: "https://ci.example.com/repos/7/pipeline/42",
}

describe("being found when looking for CI", () => {
  it("finds Woodpecker with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Woodpecker)
  })

  it("finds Woodpecker even with its Drone compatibility variables set", () => {
    const ci = getCISourceForEnv({
      ...correctEnv,
      DRONE_PULL_REQUEST: "800",
      DRONE_REPO: "artsy/eigen",
    })
    expect(ci).toBeInstanceOf(Woodpecker)
  })
})

describe(".isCI", () => {
  test("validates when all Woodpecker environment vars are set", () => {
    const woodpecker = new Woodpecker(correctEnv)
    expect(woodpecker.isCI).toBeTruthy()
  })

  test("does not validate without CI", () => {
    const woodpecker = new Woodpecker({})
    expect(woodpecker.isCI).toBeFalsy()
  })

  test("does not validate when CI is set by another service", () => {
    const woodpecker = new Woodpecker({ ...correctEnv, CI: "true" })
    expect(woodpecker.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  test("validates when all Woodpecker environment vars are set", () => {
    const woodpecker = new Woodpecker(correctEnv)
    expect(woodpecker.isPR).toBeTruthy()
  })

  test("does not validate without CI_COMMIT_PULL_REQUEST", () => {
    const woodpecker = new Woodpecker({})
    expect(woodpecker.isPR).toBeFalsy()
  })

  const envs = ["CI", "CI_COMMIT_PULL_REQUEST", "CI_REPO"]
  envs.forEach((key: string) => {
    let env = {
      CI: "woodpecker",
      CI_COMMIT_PULL_REQUEST: "800",
      CI_REPO: "artsy/eigen",
    }
    env[key] = null

    test(`does not validate when ${key} is missing`, () => {
      const woodpecker = new Woodpecker(env)
      expect(woodpecker.isPR).toBeFalsy()
    })
  })

  it("needs to have a PR number", () => {
    let env = {
      CI: "woodpecker",
      CI_COMMIT_PULL_REQUEST: "asdasd",
      CI_REPO: "artsy/eigen",
    }
    const woodpecker = new Woodpecker(env)
    expect(woodpecker.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const woodpecker = new Woodpecker(correctEnv)
    expect(woodpecker.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("pulls it out of the env", () => {
    const woodpecker = new Woodpecker(correctEnv)
    expect(woodpecker.repoSlug).toEqual("artsy/eigen")
  })
})

describe(".commitHash", () => {
  it("pulls it out of the env", () => {
    const woodpecker = new Woodpecker(correctEnv)
    expect(woodpecker.commitHash).toEqual("6a1b2c3d4e5f")
  })
})

describe(".ciRunURL", () => {
  it("pulls it out of the env", () => {
    const woodpecker = new Woodpecker(correctEnv)
    expect(woodpecker.ciRunURL).toEqual("https://ci.example.com/repos/7/pipeline/42")
  })
})
