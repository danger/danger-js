import { Concourse } from "../Concourse"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  CONCOURSE: "true",
  REPO_SLUG: "danger/danger-js",
  PULL_REQUEST_ID: "2",
  BUILD_URL: "https://github.com/danger/danger-js/blob/master",
}

describe("being found when looking for CI", () => {
  it("finds Concourse with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Concourse)
  })
})

describe(".isCI", () => {
  it("validates when all Concourse environment vars are set", () => {
    const concourse = new Concourse(correctEnv)
    expect(concourse.isCI).toBeTruthy()
  })

  it("does not validate without env", () => {
    const concourse = new Concourse({})
    expect(concourse.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all Concourse environment vars are set", () => {
    const concourse = new Concourse(correctEnv)
    expect(concourse.isPR).toBeTruthy()
  })

  it("does not validate outside of Concourse", () => {
    const concourse = new Concourse({})
    expect(concourse.isPR).toBeFalsy()
  })

  const envs = ["CONCOURSE", "REPO_SLUG", "PULL_REQUEST_ID"]
  envs.forEach((key: string) => {
    let env = Object.assign({}, correctEnv)
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const concourse = new Concourse({})
      expect(concourse.isCI && concourse.isPR).toBeFalsy()
    })
  })

  describe("repo slug", () => {
    it("returns correct slug", () => {
      const concourse = new Concourse(correctEnv)
      expect(concourse.repoSlug).toEqual("danger/danger-js")
    })
  })

  describe("pull request id", () => {
    it("returns correct id", () => {
      const concourse = new Concourse(correctEnv)
      expect(concourse.pullRequestID).toEqual("2")
    })
  })

  describe("build url", () => {
    it("returns correct build url", () => {
      const concourse = new Concourse(correctEnv)
      expect(concourse.ciRunURL).toEqual("https://github.com/danger/danger-js/blob/master")
    })
  })
})
