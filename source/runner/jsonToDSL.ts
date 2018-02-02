import * as GitHubNodeAPI from "@octokit/rest"

import { DangerDSLJSONType, DangerDSLType } from "../dsl/DangerDSL"
import { gitHubGitDSL as githubJSONToGitDSL } from "../platforms/github/GitHubGit"
import { githubJSONToGitHubDSL } from "../platforms/GitHub"
import { sentence, href } from "./DangerUtils"
import { LocalGit } from "../platforms/LocalGit"
import { GitDSL } from "../dsl/GitDSL"

export const jsonToDSL = async (dsl: DangerDSLJSONType): Promise<DangerDSLType> => {
  const api = githubAPIForDSL(dsl)
  const platformExists = [dsl.github].some(p => !!p)
  const github = dsl.github && githubJSONToGitHubDSL(dsl.github, api)
  // const gitlab = dsl.gitlab && githubJSONToGitLabDSL(dsl.gitlab, api)

  let git: GitDSL
  if (!platformExists) {
    const localPlatform = new LocalGit(dsl.settings.cliArgs)
    git = await localPlatform.getPlatformGitRepresentation()
  } else {
    git = githubJSONToGitDSL(github, dsl.git)
  }

  return {
    git,
    github: github,
    utils: {
      sentence,
      href,
    },
  }
}

const githubAPIForDSL = (dsl: DangerDSLJSONType) => {
  const api = new GitHubNodeAPI({
    host: dsl.settings.github.baseURL,
    headers: {
      ...dsl.settings.github.additionalHeaders,
    },
  })

  if (dsl.settings.github && dsl.settings.github.accessToken) {
    api.authenticate({ type: "token", token: dsl.settings.github.accessToken })
  }
  return api
}
