import { Platform } from "../platforms/platform"
import { DangerDSLJSONType } from "../dsl/DangerDSL"
import { CliArgs } from "../dsl/cli-args"
import { CISource } from "../ci_source/ci_source"
import { emptyGitJSON } from "../platforms/github/GitHubGit"

export const jsonDSLGenerator = async (platform: Platform, source: CISource): Promise<DangerDSLJSONType> => {
  const useSimpleDSL = platform.getPlatformReviewSimpleRepresentation && source.useEventDSL

  const git = useSimpleDSL ? emptyGitJSON() : await platform.getPlatformGitRepresentation()

  const getDSLFunc = useSimpleDSL
    ? platform.getPlatformReviewSimpleRepresentation
    : platform.getPlatformReviewDSLRepresentation

  const platformDSL = await getDSLFunc!()

  return {
    git,
    [platform.name === "BitBucketServer" ? "bitbucket_server" : "github"]: platformDSL,
    settings: {
      github: {
        accessToken: process.env["DANGER_GITHUB_API_TOKEN"] || process.env["GITHUB_TOKEN"] || "NO_TOKEN",
        additionalHeaders: {},
        baseURL: process.env["DANGER_GITHUB_API_BASE_URL"] || undefined,
      },
      cliArgs: {} as CliArgs,
    },
  }
}
