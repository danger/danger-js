import { Platform } from "../platforms/platform"
import { DangerDSLJSONType } from "../dsl/DangerDSL"

export const jsonDSLGenerator = async (platform: Platform): Promise<DangerDSLJSONType> => {
  const git = await platform.getPlatformGitRepresentation()
  const platformDSL = await platform.getPlatformDSLRepresentation()

  return {
    git,
    github: platformDSL,
    settings: {
      github: {
        accessToken: process.env["DANGER_GITHUB_API_TOKEN"],
        additionalHeaders: {},
        baseURL: process.env["DANGER_GITHUB_API_BASE_URL"] || undefined,
      },
      cliArgs: {},
    },
  }
}
