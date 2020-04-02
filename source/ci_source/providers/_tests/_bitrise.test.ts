import { Bitrise } from "../Bitrise"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  BITRISE_IO: "true",
  BITRISE_PULL_REQUEST: "800",
  GIT_REPOSITORY_URL: "https://github.com/artsy/eigen",
}

describe("being found when looking for CI", () => {
  it("finds Bitrise with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Bitrise)
  })
})

describe(".isCI", () => {
  it("validates when all Bitrise environment vars are set", () => {
    const bitrise = new Bitrise(correctEnv)
    expect(bitrise.isCI).toBeTruthy()
  })

  it("does not validate without env", () => {
    const bitrise = new Bitrise({})
    expect(bitrise.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all bitrise environment vars are set", () => {
    const bitrise = new Bitrise(correctEnv)
    expect(bitrise.isPR).toBeTruthy()
  })

  it("does not validate outside of bitrise", () => {
    const bitrise = new Bitrise({})
    expect(bitrise.isPR).toBeFalsy()
  })

  const envs = ["BITRISE_PULL_REQUEST", "GIT_REPOSITORY_URL", "BITRISE_IO"]
  envs.forEach((key: string) => {
    let env = { ...correctEnv }
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const bitrise = new Bitrise(env)
      expect(bitrise.isCI && bitrise.isPR).toBeFalsy()
    })
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const bitrise = new Bitrise({
      BITRISE_PULL_REQUEST: "800",
    })
    expect(bitrise.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("derives it from the repo URL", () => {
    const bitrise = new Bitrise(correctEnv)
    expect(bitrise.repoSlug).toEqual("artsy/eigen")
  })

  it("derives it from the repo URL in SSH format", () => {
    const env = {
      ...correctEnv,
      GIT_REPOSITORY_URL: "git@github.com:artsy/eigen.git",
    }
    const bitrise = new Bitrise(env)
    expect(bitrise.repoSlug).toEqual("artsy/eigen")
  })

  it("derives it from a long URL format", () => {
    const env = {
      ...correctEnv,
      GIT_REPOSITORY_URL: "https://github.com/organization/project/subproject/repo.git",
    }
    const bitrise = new Bitrise(env)
    expect(bitrise.repoSlug).toEqual("organization/project/subproject/repo")
  })

  it("derives it from a long SSH format", () => {
    const env = {
      ...correctEnv,
      GIT_REPOSITORY_URL: "git@github.com:organization/project/subproject/repo.git",
    }
    const bitrise = new Bitrise(env)
    expect(bitrise.repoSlug).toEqual("organization/project/subproject/repo")
  })
})

describe("commit hash", () => {
  it("returns correct commit hash when present", () => {
    const env = {
      ...correctEnv,
      BITRISE_GIT_COMMIT: "1234abc",
    }
    const bitrise = new Bitrise(env)
    expect(bitrise.commitHash).toEqual("1234abc")
  })

  it("returns no commit hash when not present", () => {
    const bitrise = new Bitrise(correctEnv)
    expect(bitrise.commitHash).toBeUndefined()
  })
})
