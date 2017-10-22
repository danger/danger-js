import * as GitHubNodeAPI from "github"

import { DangerDSLJSONType, DangerDSLType } from "../dsl/DangerDSL"
import { gitJSONToGitDSL } from "../platforms/github/GitHubGit"
import { githubJSONToGitHubDSL } from "../platforms/GitHub"
import { sentence, href } from "./DangerUtils"

export const jsonToDSL = async (dsl: DangerDSLJSONType): Promise<DangerDSLType> => {
  const api = githubAPIForDSL(dsl)
  const github = githubJSONToGitHubDSL(dsl.github, api)
  const git = gitJSONToGitDSL(github, dsl.git)
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
    Promise,
  })

  if (dsl.settings.github && dsl.settings.github.accessToken) {
    api.authenticate({ type: "token", token: dsl.settings.github.accessToken })
  }
  return api
}
