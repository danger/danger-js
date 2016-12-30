// @flow

import Fake from "../providers/Fake"
import { getCISourceForEnv } from "../ci_source"

describe(".getCISourceForEnv", () => {
  test("returns undefined if nothing is found", () => {
    const ci = getCISourceForEnv({ })
    expect(ci).toBeUndefined()
  })

  test("falls back to the fake if DANGER_FAKE_CI exists", () => {
    const ci = getCISourceForEnv({ DANGER_FAKE_CI: "YES" })
    expect(ci).toBeInstanceOf(Fake)
  })
})
