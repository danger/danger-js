import { Drone } from "../Drone"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  DRONE: "true",
  DRONE_PULL_REQUEST: "800",
  DRONE_REPO: "artsy/eigen",
}

describe("being found when looking for CI", () => {
  it("finds Drone with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Drone)
  })
})

describe(".isCI", () => {
  test("validates when all Drone environment vars are set", () => {
    const drone = new Drone(correctEnv)
    expect(drone.isCI).toBeTruthy()
  })

  test("does not validate without DRONE", () => {
    const drone = new Drone({})
    expect(drone.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  test("validates when all Drone environment vars are set", () => {
    const drone = new Drone(correctEnv)
    expect(drone.isPR).toBeTruthy()
  })

  test("does not validate without DRONE_PULL_REQUEST", () => {
    const drone = new Drone({})
    expect(drone.isPR).toBeFalsy()
  })

  const envs = ["DRONE_PULL_REQUEST", "DRONE_REPO"]
  envs.forEach((key: string) => {
    let env = {
      DRONE: "true",
      DRONE_PULL_REQUEST: "800",
      DRONE_REPO: "artsy/eigen",
    }
    env[key] = null

    test(`does not validate when ${key} is missing`, () => {
      const drone = new Drone(env)
      expect(drone.isPR).toBeFalsy()
    })
  })

  it("needs to have a PR number", () => {
    let env = {
      DRONE: "true",
      DRONE_PULL_REQUEST: "asdasd",
      DRONE_REPO: "artsy/eigen",
    }
    const drone = new Drone(env)
    expect(drone.isPR).toBeFalsy()
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const drone = new Drone(correctEnv)
    expect(drone.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("pulls it out of the env", () => {
    const drone = new Drone(correctEnv)
    expect(drone.repoSlug).toEqual("artsy/eigen")
  })
})
