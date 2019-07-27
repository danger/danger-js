import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

describe(".ensureEnvKeysExist", () => {
  const env = {
    COMMIT: "9d2f95a4019935f91ed10e9d716d2b7551dcbcc1",
    REPO_SLUG: "bar",
    PR_ID: "30",
    PR_DESTINATION_BRANCH: "develop",
    REPO_OWNER: "foo",
  }
  test("return true if every key is in env", () => {
    const result = ensureEnvKeysExist(env, ["COMMIT", "REPO_SLUG"])
    expect(result).toBe(true)
  })

  test("return false if any key is not in env", () => {
    const result0 = ensureEnvKeysExist(env, ["test"])
    expect(result0).toBe(false)

    const result1 = ensureEnvKeysExist(env, [""])
    expect(result1).toBe(false)
  })
})

describe(".ensureEnvKeysAreInt", () => {
  const env = {
    COMMIT: "9d2f95a4019935f91ed10e9d716d2b7551dcbcc1",
    REPO_SLUG: "bar",
    PR_ID: "30",
    PR_DESTINATION_BRANCH: "develop",
    REPO_OWNER: "foo",
  }

  test("return true if key is in env and value is int", () => {
    const result = ensureEnvKeysAreInt(env, ["PR_ID"])
    expect(result).toBe(true)
  })

  test("return false if any key is not in env", () => {
    const result0 = ensureEnvKeysAreInt(env, ["test"])
    expect(result0).toBe(false)

    const result1 = ensureEnvKeysAreInt(env, [""])
    expect(result1).toBe(false)
  })

  test("return false if any key is in env, but vlaue is not int", () => {
    const result = ensureEnvKeysAreInt(env, ["REPO_OWNER"])
    expect(result).toBe(false)
  })
})
