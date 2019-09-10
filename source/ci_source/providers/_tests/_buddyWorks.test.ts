import { BuddyWorks } from "../BuddyWorks"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  BUDDY_PIPELINE_ID: "170873",
  BUDDY_EXECUTION_PULL_REQUEST_ID: "pull/1799",
  BUDDY_REPO_SLUG: "danger/dangerjs",
  BUDDY_EXECUTION_URL:
    "https://app.buddy.works/danger/dangerjs/pipelines/pipeline/170873/execution/5d6d49dbaab2cb6fdf975c71",
}

describe("being found when looking for CI", () => {
  it("finds Buddy.works with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(BuddyWorks)
  })
})

describe(".isCI", () => {
  test("validates when all Buddy.works environment vars are set", () => {
    const buddyWorks = new BuddyWorks(correctEnv)
    expect(buddyWorks.isCI).toBeTruthy()
  })

  test("does not validate without pipeline ID", () => {
    const buddyWorks = new BuddyWorks({})
    expect(buddyWorks.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  test("validates when all Buddy.works environment vars are set", () => {
    const buddyWorks = new BuddyWorks(correctEnv)
    expect(buddyWorks.isPR).toBeTruthy()
  })

  test("does not validate without pipeline ID", () => {
    const buddyWorks = new BuddyWorks({})
    expect(buddyWorks.isPR).toBeFalsy()
  })

  const envs = ["BUDDY_EXECUTION_PULL_REQUEST_ID", "BUDDY_REPO_SLUG"]
  envs.forEach((key: string) => {
    const env = Object.assign({}, correctEnv)
    env[key] = null

    test(`does not validate when ${key} is missing`, () => {
      const buddyWorks = new BuddyWorks(env)
      expect(buddyWorks.isPR).toBeFalsy()
    })
  })

  it("needs to have a PR id", () => {
    const env = Object.assign({}, correctEnv)
    delete env.BUDDY_EXECUTION_PULL_REQUEST_ID
    const buddyWorks = new BuddyWorks(env)
    expect(buddyWorks.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const buddyWorks = new BuddyWorks(correctEnv)
    expect(buddyWorks.pullRequestID).toEqual("pull/1799")
  })
})

describe(".repoSlug", () => {
  it("pulls it out of the env", () => {
    const buddyWorks = new BuddyWorks(correctEnv)
    expect(buddyWorks.repoSlug).toEqual("danger/dangerjs")
  })
})

describe(".ciRunURL", () => {
  it("pulls it out of the env", () => {
    const buddyWorks = new BuddyWorks(correctEnv)
    expect(buddyWorks.ciRunURL).toEqual(
      "https://app.buddy.works/danger/dangerjs/pipelines/pipeline/170873/execution/5d6d49dbaab2cb6fdf975c71"
    )
  })
})
