import { getPlatformForEnv } from "../platform"

// Something about getPlatformForEnv being async breaks this
it.skip("should bail if there is no DANGER_GITHUB_API_TOKEN found", () => {
  const e = expect as any
  e(async () => {
    await getPlatformForEnv({} as any, {} as any)
  }).toThrow("Cannot use authenticated API requests")
})
