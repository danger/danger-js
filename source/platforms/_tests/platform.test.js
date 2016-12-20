// @flow

import { getPlatformForEnv } from "../platform"

it("should bail if there is no DANGER_GITHUB_API_TOKEN found", () => {
  expect(() => {
    getPlatformForEnv({}, {})
  }).toThrow("Cannot use authenticated API requests")
})

