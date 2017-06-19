import { BuddyBuild } from "../BuddyBuild"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  BUDDYBUILD_BUILD_ID: "xxx",
  BUDDYBUILD_REPO_SLUG: "someone/something",
  BUDDYBUILD_PULL_REQUEST: "999",
}

describe("being found when looking for CI", () => {
  it("finds BuddyBuild with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(BuddyBuild)
  })
})

describe(".isCI", () => {
  it("validates when all BuddyBuild environment vars are set", () => {
    const buddyBuild = new BuddyBuild(correctEnv)
    expect(buddyBuild.isCI).toBeTruthy()
  })

  it("does not validate", () => {
    const buddyBuild = new BuddyBuild({})
    expect(buddyBuild.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all BuddyBuild environment vars are set", () => {
    const buddyBuild = new BuddyBuild(correctEnv)
    expect(buddyBuild.isPR).toBeTruthy()
  })

  it("does not validate outside of BuddyBuild", () => {
    const buddyBuild = new BuddyBuild({})
    expect(buddyBuild.isPR).toBeFalsy()
  })

  const envs = ["BUDDYBUILD_REPO_SLUG", "BUDDYBUILD_PULL_REQUEST"]
  envs.forEach((key: string) => {
    let env = {
      BUDDYBUILD_REPO_SLUG: "someone/something",
      BUDDYBUILD_PULL_REQUEST: "999",
    }
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const buddyBuild = new BuddyBuild(env)
      expect(buddyBuild.isPR).toBeFalsy()
    })

    it("needs to have a PR number", () => {
      let env = {
        BUDDYBUILD_REPO_SLUG: "someone/something",
        BUDDYBUILD_PULL_REQUEST: "asdf",
      }
      const buddyBuild = new BuddyBuild(env)
      expect(buddyBuild.isPR).toBeFalsy()
    })
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const buddyBuild = new BuddyBuild({ BUDDYBUILD_PULL_REQUEST: "999" })
    expect(buddyBuild.pullRequestID).toEqual("999")
  })
})

describe(".repoSlug", () => {
  it("pulls it out of the env", () => {
    const buddyBuild = new BuddyBuild({ BUDDYBUILD_REPO_SLUG: "someone/something" })
    expect(buddyBuild.repoSlug).toEqual("someone/something")
  })
})
