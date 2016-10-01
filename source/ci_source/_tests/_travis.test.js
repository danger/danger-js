import Travis from "../travis.js"

let correctEnv = {
  "HAS_JOSH_K_SEAL_OF_APPROVAL": "true",
  "TRAVIS_PULL_REQUEST": "800",
  "TRAVIS_REPO_SLUG": "artsy/eigen"
}

describe(".validates_as_ci?", () => {
  test("validates when all Travis environment vars are set and Josh K says so", () => {
    let travis = new Travis(correctEnv)
    expect(travis.isCI).toBeTruthy()
  })
})
