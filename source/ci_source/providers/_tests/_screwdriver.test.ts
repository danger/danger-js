import { Screwdriver } from "../Screwdriver"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  SCREWDRIVER: "true",
  SD_PULL_REQUEST: "42",
  SCM_URL: "git@github.com:danger/danger-js",
}

describe("being found when looking for CI", () => {
  it("finds Screwdriver with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Screwdriver)
  })
})

describe(".isCI", () => {
  it("validates when SCREWDRIVER is present in environment", () => {
    const screwdriver = new Screwdriver(correctEnv)
    expect(screwdriver.isCI).toBeTruthy()
  })

  it("does not validate without SCREWDRIVER present in environment", () => {
    const screwdriver = new Screwdriver({})
    expect(screwdriver.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all Screwdriver environment variables are set", () => {
    const screwdriver = new Screwdriver(correctEnv)
    expect(screwdriver.isPR).toBeTruthy()
  })

  it("does not validate with required environment variables", () => {
    const screwdriver = new Screwdriver({})
    expect(screwdriver.isPR).toBeFalsy()
  })

  const envs = ["SD_PULL_REQUEST", "SCM_URL"]
  envs.forEach((key: string) => {
    const env = {
      ...correctEnv,
      [key]: null,
    }

    it(`does not validate when ${key} is missing`, () => {
      const screwdriver = new Screwdriver(env)
      expect(screwdriver.isPR).toBeFalsy()
    })
  })

  it("needs to have a PR number", () => {
    const env = {
      ...correctEnv,
      SD_PULL_REQUEST: "not a number",
    }
    const screwdriver = new Screwdriver(env)
    expect(screwdriver.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of environment", () => {
    const screwdriver = new Screwdriver(correctEnv)
    expect(screwdriver.pullRequestID).toEqual("42")
  })
})

describe(".repoSlug", () => {
  it("pulls it out of environment", () => {
    const screwdriver = new Screwdriver(correctEnv)
    expect(screwdriver.repoSlug).toEqual("danger/danger-js")
  })
})
