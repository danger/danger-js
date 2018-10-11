import { Jenkins } from "../Jenkins"
import { getCISourceForEnv } from "../../get_ci_source"

const envs = {
  ghprb: {
    ghprbGhRepository: "danger/danger-js",
    ghprbPullId: "50",
    JENKINS_URL: "https://danger.jenkins",
  },
  multibranchGitHub: {
    CHANGE_URL: "https://github.com/danger/danger-js/pull/50",
    CHANGE_ID: "50",
    JENKINS_URL: "https://danger.jenkins",
  },
  multibranchBBS: {
    CHANGE_URL: "https://bitbucket.server/projects/PROJ/repos/REPO/pull-requests/50",
    CHANGE_ID: "50",
    JENKINS_URL: "https://danger.jenkins",
  },
}

const types = Object.keys(envs)

describe("being found when looking for CI", () => {
  it.each(types)("%s - finds Jenkins with the right ENV", type => {
    const env = envs[type]
    const ci = getCISourceForEnv(env)
    expect(ci).toBeInstanceOf(Jenkins)
  })
})

describe(".isCI", () => {
  it.each(types)("%s - validates when JENKINS_URL is present in environment", type => {
    const jenkins = new Jenkins(envs[type])
    expect(jenkins.isCI).toBeTruthy()
  })

  it("does not validate without JENKINS_URL", () => {
    const jenkins = new Jenkins({})
    expect(jenkins.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it.each(types)("%s - validates when all Jenkins environment variables are set", type => {
    const jenkins = new Jenkins(envs[type])
    expect(jenkins.isPR).toBeTruthy()
  })

  it("does not validate with required environment variables", () => {
    const jenkins = new Jenkins({})
    expect(jenkins.isPR).toBeFalsy()
  })

  describe.each(types)("%s", type => {
    const envVars = Object.keys(envs[type])
    envVars.forEach((key: string) => {
      const env = {
        ...envs[type],
        [key]: null,
      }

      it(`does not validate when ${key} is missing`, () => {
        const jenkins = new Jenkins(env)
        expect(jenkins.isPR).toBeFalsy()
      })
    })
  })

  it("ghprb - needs to have a PR number", () => {
    const env = {
      ...envs.ghprb,
      ghprbPullId: "not a number",
    }
    const jenkins = new Jenkins(env)
    expect(jenkins.isPR).toBeFalsy()
  })

  it("multibranch - needs to have a PR number", () => {
    const env = {
      ...envs.multibranchGitHub,
      CHANGE_ID: "not a number",
    }
    const jenkins = new Jenkins(env)
    expect(jenkins.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it.each(types)("%s - pulls it out of environment", type => {
    const jenkins = new Jenkins(envs[type])
    expect(jenkins.pullRequestID).toEqual("50")
  })
})

describe(".repoSlug", () => {
  it("ghprb - pulls it out of environment", () => {
    const jenkins = new Jenkins(envs.ghprb)
    expect(jenkins.repoSlug).toEqual("danger/danger-js")
  })

  it("multibranch-github - pulls it out of environment", () => {
    const jenkins = new Jenkins(envs.multibranchGitHub)
    expect(jenkins.repoSlug).toEqual("danger/danger-js")
  })

  it("multibranch-bb-server - pulls it out of environment", () => {
    const jenkins = new Jenkins(envs.multibranchBBS)
    expect(jenkins.repoSlug).toEqual("projects/PROJ/repos/REPO")
  })
})
