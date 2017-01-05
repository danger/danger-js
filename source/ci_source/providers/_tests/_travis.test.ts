import {Travis} from "../Travis"

const correctEnv = {
  "HAS_JOSH_K_SEAL_OF_APPROVAL": "true",
  "TRAVIS_PULL_REQUEST": "800",
  "TRAVIS_REPO_SLUG": "artsy/eigen"
}

describe(".isCI", () => {
  test("validates when all Travis environment vars are set and Josh K says so", () => {
    const travis = new Travis(correctEnv)
    expect(travis.isCI).toBeTruthy()
  })

  test("does not validate without josh", () => {
    const travis = new Travis({})
    expect(travis.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  test("validates when all Travis environment vars are set and Josh K says so", () => {
    const travis = new Travis(correctEnv)
    expect(travis.isPR).toBeTruthy()
  })

  test("does not validate without josh", () => {
    const travis = new Travis({})
    expect(travis.isPR).toBeFalsy()
  })

  const envs = ["TRAVIS_PULL_REQUEST", "TRAVIS_REPO_SLUG"]
  envs.forEach((key: string) => {
    let env = {
      "HAS_JOSH_K_SEAL_OF_APPROVAL": "true",
      "TRAVIS_PULL_REQUEST": "800",
      "TRAVIS_REPO_SLUG": "artsy/eigen"
    }
    env[key] = null

    test(`does not validate when ${key} is missing`, () => {
      const travis = new Travis(env)
      expect(travis.isPR).toBeFalsy()
    })
  })

  it("needs to have a PR number", () => {
    let env = {
      "HAS_JOSH_K_SEAL_OF_APPROVAL": "true",
      "TRAVIS_PULL_REQUEST": "asdasd",
      "TRAVIS_REPO_SLUG": "artsy/eigen"
    }
    const travis = new Travis(env)
    expect(travis.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const travis = new Travis(correctEnv)
    expect(travis.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("pulls it out of the env", () => {
    const travis = new Travis(correctEnv)
    expect(travis.repoSlug).toEqual("artsy/eigen")
  })
})
