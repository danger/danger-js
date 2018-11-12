import { Netlify } from "../Netlify"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  NETLIFY_BUILD_BASE: "opt/build",
  REPOSITORY_URL: "https://github.com/someone/something",
  REVIEW_ID: "999",
}

describe("being found when looking for CI", () => {
  it("finds Netlify with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Netlify)
  })
})

describe(".isCI", () => {
  it("validates when all Netlify environment vars are set", () => {
    const netlify = new Netlify(correctEnv)
    expect(netlify.isCI).toBeTruthy()
  })

  it("does not validate", () => {
    const netlify = new Netlify({})
    expect(netlify.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all Netlify environment vars are set", () => {
    const netlify = new Netlify(correctEnv)
    expect(netlify.isPR).toBeTruthy()
  })

  it("does not validate outside of Netlify", () => {
    const netlify = new Netlify({})
    expect(netlify.isPR).toBeFalsy()
  })

  const envs = ["REPOSITORY_URL", "REVIEW_ID"]
  envs.forEach((key: string) => {
    let env = {
      REPOSITORY_URL: "https://github.com/someone/something",
      REVIEW_ID: "999",
    }
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const netlify = new Netlify(env)
      expect(netlify.isPR).toBeFalsy()
    })

    it("needs to have a PR number", () => {
      let env = {
        REPOSITORY_URL: "https://github.com/someone/something",
        REVIEW_ID: "asdf",
      }
      const netlify = new Netlify(env)
      expect(netlify.isPR).toBeFalsy()
    })
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const netlify = new Netlify({ REVIEW_ID: "999" })
    expect(netlify.pullRequestID).toEqual("999")
  })
})

describe(".repoSlug", () => {
  it("pulls it out of the env", () => {
    const netlify = new Netlify({ REPOSITORY_URL: "https://x-access-token:v1.9xxx0@github.com/someone/something" })
    expect(netlify.repoSlug).toEqual("someone/something")
  })
})
