import { getPlatformForEnv } from "../platform"

it("should bail if there is no DANGER_GITHUB_API_TOKEN found", () => {
  expect(() => {
    getPlatformForEnv({} as any, {} as any)
  }).toThrow("Cannot use authenticated API requests")
})
