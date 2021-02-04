import { Codemagic } from "../Codemagic"
import { getCISourceForEnv } from "../../get_ci_source"

const correctEnv = {
  FCI_PROJECT_ID: "abcdef123-app-uuid",
  FCI_BUILD_ID: "abcdef123-build-uuid",
  FCI_REPO_SLUG: "danger/danger-js",
  FCI_PULL_REQUEST: "true",
  FCI_PULL_REQUEST_NUMBER: "2",
  BUILD_NUMBER: "42",
}

describe("being found when looking for CI", () => {
  it("finds Codemagic with the right ENV", () => {
    const ci = getCISourceForEnv(correctEnv)
    expect(ci).toBeInstanceOf(Codemagic)
  })
})

describe(".isCI", () => {
  it("validates when all Codemagic environment vars are set", () => {
    const codemagic = new Codemagic(correctEnv)
    expect(codemagic.isCI).toBeTruthy()
  })

  it("does not validate without env", () => {
    const codemagic = new Codemagic({})
    expect(codemagic.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all codemagic environment vars are set", () => {
    const codemagic = new Codemagic(correctEnv)
    expect(codemagic.isPR).toBeTruthy()
  })

  it("does not validate outside of codemagic", () => {
    const codemagic = new Codemagic({})
    expect(codemagic.isPR).toBeFalsy()
  })

  const envs = [
    "FCI_PULL_REQUEST",
    "FCI_REPO_SLUG",
    "FCI_PROJECT_ID",
    "FCI_BUILD_ID",
    "BUILD_NUMBER",
    "FCI_PULL_REQUEST_NUMBER",
  ]
  envs.forEach((key: string) => {
    let env = Object.assign({}, correctEnv)
    delete env[key]

    it(`does not validate when ${key} is missing`, () => {
      const codemagic = new Codemagic(env)
      expect(codemagic.isCI && codemagic.isPR).toBeFalsy()
    })
  })
})
