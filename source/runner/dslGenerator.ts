import { Platform } from "../platforms/platform"
import { DangerDSLJSONType } from "../dsl/DangerDSL"
import { CliArgs } from "../dsl/cli-args"
import { CISource } from "../ci_source/ci_source"
import { emptyGitJSON } from "../platforms/github/GitHubGit"
import { CommanderStatic } from "commander"

export const jsonDSLGenerator = async (
  platform: Platform,
  source: CISource,
  program: CommanderStatic
): Promise<DangerDSLJSONType> => {
  const useSimpleDSL = platform.getPlatformReviewSimpleRepresentation && source.useEventDSL

  const git = useSimpleDSL ? emptyGitJSON() : await platform.getPlatformGitRepresentation()

  const getDSLFunc = useSimpleDSL
    ? platform.getPlatformReviewSimpleRepresentation
    : platform.getPlatformReviewDSLRepresentation

  const platformDSL = await getDSLFunc!()

  const cliArgs: CliArgs = {
    base: program.base,
    dangerfile: program.dangerfile,
    externalCiProvider: program.externalCiProvider,
    id: program.id,
    textOnly: program.textOnly,
    verbose: program.verbose,
  }

  const dslPlatformName = jsonDSLPlatformName(platform)

  return {
    git,
    [dslPlatformName]: platformDSL,
    settings: {
      github: {
        accessToken: process.env["DANGER_GITHUB_API_TOKEN"] || process.env["GITHUB_TOKEN"] || "NO_TOKEN",
        additionalHeaders: {},
        baseURL: process.env["DANGER_GITHUB_API_BASE_URL"] || process.env["GITHUB_URL"] || undefined,
      },
      cliArgs,
    },
  }
}

const jsonDSLPlatformName = (platform: Platform): string => {
  switch (platform.name) {
    case "BitBucketServer":
      return "bitbucket_server"
    case "BitBucketCloud":
      return "bitbucket_cloud"
    case "GitLab":
      return "gitlab"
    case "GitHub":
      return "github"
    default:
      return platform.name.split(" ").join("_")
  }
}
