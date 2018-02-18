import { Platform } from "../platforms/platform"
import { DangerDSLJSONType } from "../dsl/DangerDSL"
import { CliArgs } from "./cli-args"

export const jsonDSLGenerator = async (platform: Platform): Promise<DangerDSLJSONType> => {
  const git = await platform.getPlatformGitRepresentation()
  const platformDSL = await platform.getPlatformDSLRepresentation()

  return {
    git,
    [platform.name === "BitBucketServer" ? "bitbucket_server" : "github"]: platformDSL,
    settings: {
      github: {
        accessToken: process.env["DANGER_GITHUB_API_TOKEN"] || "NO_TOKEN",
        additionalHeaders: {},
        baseURL: process.env["DANGER_GITHUB_API_BASE_URL"] || undefined,
      },
      cliArgs: {} as CliArgs,
    },
  }
}
