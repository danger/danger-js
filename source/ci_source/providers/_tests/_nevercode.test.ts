import { Nevercode } from "../Nevercode"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  NEVERCODE: "true",
  NEVERCODE_PULL_REQUEST: "true",
  NEVERCODE_GIT_PROVIDER_PULL_REQUEST: "123234",
}

describe("being found when looking for CI", () => {
  it("finds Nevercode with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Nevercode)
  })
})

describe(".isCI", () => {
  it("validates when all Nevercode environment vars are set", () => {
    const nevercode = new Nevercode(correctEnv)
    expect(nevercode.isCI).toBeTruthy()
  })

  it("does not validate without env", () => {
    const nevercode = new Nevercode({})
    expect(nevercode.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all nevercode environment vars are set", () => {
    const nevercode = new Nevercode(correctEnv)
    expect(nevercode.isPR).toBeTruthy()
  })

  it("does not validate outside of nevercode", () => {
    const nevercode = new Nevercode({})
    expect(nevercode.isPR).toBeFalsy()
  })

  const envs = ["NEVERCODE_PULL_REQUEST", "NEVERCODE", "NEVERCODE_GIT_PROVIDER_PULL_REQUEST"]
  envs.forEach((key: string) => {
    let env = Object.assign({}, correctEnv)
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const nevercode = new Nevercode(env)
      expect(nevercode.isCI && nevercode.isPR).toBeFalsy()
    })
  })
})
