import { Bamboo } from "../Bamboo"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  bamboo_buildPlanName: "My Build Plan",
  bamboo_repository_pr_key: "1234",
  bamboo_planRepository_repositoryUrl: "ssh://git@bitbucket.mycompany.com:7999/my_project/my_repository.git",
}

const correctDotedRepoEnv = {
  bamboo_buildPlanName: "My Build Plan",
  bamboo_repository_pr_key: "1234",
  bamboo_planRepository_repositoryUrl: "ssh://git@bitbucket.mycompany.com:7999/my_project/my.custom.repository.git",
}

describe("being found when looking for CI", () => {
  it("finds Bamboo with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Bamboo)
  })
})

describe(".isCI", () => {
  it("validates when all Bamboo environment vars are set", () => {
    const pipelines = new Bamboo(correctEnv)
    expect(pipelines.isCI).toBeTruthy()
  })

  it("does not validate without josh", () => {
    const pipelines = new Bamboo({})
    expect(pipelines.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all Bamboo environment vars are set", () => {
    const pipelines = new Bamboo(correctEnv)
    expect(pipelines.isPR).toBeTruthy()
  })

  it("does not validate outside of Bamboo", () => {
    const pipelines = new Bamboo({})
    expect(pipelines.isPR).toBeFalsy()
  })

  Object.keys(correctEnv).forEach((key: string) => {
    let env = Object.assign({}, correctEnv)
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const pipelines = new Bamboo(env)
      expect(pipelines.isPR).toBeFalsy()
    })

    it("needs to have a PR number", () => {
      let env = Object.assign({}, correctEnv)
      // @ts-ignore
      delete env["bamboo_repository_pr_key"]
      const pipelines = new Bamboo(env)
      expect(pipelines.isPR).toBeFalsy()
    })
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const pipelines = new Bamboo({ bamboo_repository_pr_key: "800" })
    expect(pipelines.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("derives it from the PR Url", () => {
    const pipelines = new Bamboo(correctEnv)
    expect(pipelines.repoSlug).toEqual("projects/my_project/repos/my_repository")
  })
  it("derives it from the PR doted Url", () => {
    const pipelines = new Bamboo(correctDotedRepoEnv)
    expect(pipelines.repoSlug).toEqual("projects/my_project/repos/my.custom.repository")
  })
})
