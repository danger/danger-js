import {Buildkite} from "../Buildkite"
import {getCISourceForEnv} from "../../get_ci_source"

const correctEnv = {
  "BUILDKITE": "true",
  "BUILDKITE_PULL_REQUEST": "800",
  "BUILDKITE_REPO": "https://github.com/artsy/eigen"
}

describe("being found when looking for CI", () => {
  it("finds Buildkite with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Buildkite)
  })
})

describe(".isCI", () => {
  it("validates when all Buildkite environment vars are set", () => {
    const buildkite = new Buildkite(correctEnv)
    expect(buildkite.isCI).toBeTruthy()
  })

  it("does not validate without env", () => {
    const buildkite = new Buildkite({})
    expect(buildkite.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all buildkite environment vars are set", () => {
    const buildkite = new Buildkite(correctEnv)
    expect(buildkite.isPR).toBeTruthy()
  })

  it("does not validate outside of buildkite", () => {
    const buildkite = new Buildkite({})
    expect(buildkite.isPR).toBeFalsy()
  })

  const envs = ["BUILDKITE_PULL_REQUEST", "BUILDKITE_REPO", "BUILDKITE"]
  envs.forEach((key: string) => {
    let env = {
      "BUILDKITE": "true",
      "BUILDKITE_PULL_REQUEST": "800",
      "BUILDKITE_REPO": "https://github.com/artsy/eigen"
    }
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const buildkite = new Buildkite({})
      expect(buildkite.isPR).toBeFalsy()
    })
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const buildkite = new Buildkite({
      "BUILDKITE_PULL_REQUEST": "800"
    })
    expect(buildkite.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("derives it from the repo URL", () => {
    const buildkite = new Buildkite(correctEnv)
    expect(buildkite.repoSlug).toEqual("artsy/eigen")
  })

  it("derives it from the repo URL in SSH format", () => {
    const env = {
      ...correctEnv,
      "BUILDKITE_REPO": "git@github.com:artsy/eigen.git"
    }
    const buildkite = new Buildkite(env)
    expect(buildkite.repoSlug).toEqual("artsy/eigen")
  })
})
