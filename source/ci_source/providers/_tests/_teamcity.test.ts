import { TeamCity } from "../TeamCity"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  TEAMCITY_VERSION: "1.2.3",
  PULL_REQUEST_URL: "https://github.com/danger/danger-js/pull/541",
}

describe("being found when looking for CI", () => {
  it("finds TeamCity with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(TeamCity)
  })
})

describe(".isCI", () => {
  it("validates when all TeamCity environment vars are set", () => {
    const teamcity = new TeamCity(correctEnv)
    expect(teamcity.isCI).toBeTruthy()
  })

  it("does not validate without env", () => {
    const teamcity = new TeamCity({})
    expect(teamcity.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all TeamCity environment vars are set", () => {
    const teamcity = new TeamCity(correctEnv)
    expect(teamcity.isPR).toBeTruthy()
  })

  it("does not validate outside of TeamCity", () => {
    const teamcity = new TeamCity({})
    expect(teamcity.isPR).toBeFalsy()
  })

  const envs = ["TEAMCITY_VERSION", "PULL_REQUEST_URL"]
  envs.forEach((key: string) => {
    let env = {
      TEAMCITY_VERSION: "1.2.3",
      PULL_REQUEST_URL: "https://github.com/danger/danger-js/pull/541",
    }
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const teamcity = new TeamCity({})
      expect(teamcity.isPR).toBeFalsy()
    })
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const teamcity = new TeamCity({
      PULL_REQUEST_URL: "https://github.com/danger/danger-js/pull/541",
    })
    expect(teamcity.pullRequestID).toEqual("541")
  })
})

describe(".repoSlug", () => {
  it("derives it from the PR Url", () => {
    const teamcity = new TeamCity(correctEnv)
    expect(teamcity.repoSlug).toEqual("danger/danger-js")
  })
})
