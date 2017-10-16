import { Platform } from "../platforms/platform"
import { DangerDSLJSONType, DangerDSLType } from "../dsl/DangerDSL"
import { gitJSONToGitDSL } from "../platforms/github/GitHubGit"
import { githubJSONToGitHubDSL } from "../platforms/GitHub"

export const jsonToDSL = async (platform: Platform, dsl: DangerDSLJSONType): Promise<DangerDSLType> => {
  const github = githubJSONToGitHubDSL(dsl.github)
  const git = gitJSONToGitDSL(github, dsl.git)
  return {
    git,
    github: platformDSL,
  }
}
