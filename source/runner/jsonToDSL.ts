import * as GitHubNodeAPI from "@octokit/rest"

import { DangerDSLJSONType, DangerDSLType } from "../dsl/DangerDSL"
import { gitHubGitDSL as githubJSONToGitDSL } from "../platforms/github/GitHubGit"
import { githubJSONToGitHubDSL } from "../platforms/GitHub"
import { sentence, href } from "./DangerUtils"
import { LocalGit } from "../platforms/LocalGit"
import { GitDSL } from "../dsl/GitDSL"
import { bitBucketServerGitDSL } from "../platforms/bitbucket_server/BitBucketServerGit"
import { BitBucketServerAPI } from "../platforms/bitbucket_server/BitBucketServerAPI"

export const jsonToDSL = async (dsl: DangerDSLJSONType): Promise<DangerDSLType> => {
  const api = apiForDSL(dsl)
  const platformExists = [dsl.github].some(p => !!p)
  const github = dsl.github && githubJSONToGitHubDSL(dsl.github, api as GitHubNodeAPI)
  const bitbucket_server = dsl.bitbucket_server
  // const gitlab = dsl.gitlab && githubJSONToGitLabDSL(dsl.gitlab, api)

  let git: GitDSL
  if (!platformExists) {
    const localPlatform = new LocalGit(dsl.settings.cliArgs)
    git = await localPlatform.getPlatformGitRepresentation()
  } else if (process.env["DANGER_BITBUCKETSERVER_HOST"]) {
    git = bitBucketServerGitDSL(bitbucket_server!, dsl.git, api as BitBucketServerAPI)
  } else {
    git = githubJSONToGitDSL(github!, dsl.git)
  }

  return {
    git,
    github,
    bitbucket_server,
    utils: {
      sentence,
      href,
    },
  }
}

const apiForDSL = (dsl: DangerDSLJSONType): GitHubNodeAPI | BitBucketServerAPI => {
  if (process.env["DANGER_BITBUCKETSERVER_HOST"]) {
    return new BitBucketServerAPI(
      { repoSlug: "", pullRequestID: "" },
      {
        host: process.env["DANGER_BITBUCKETSERVER_HOST"]!,
        username: process.env["DANGER_BITBUCKETSERVER_USERNAME"],
        password: process.env["DANGER_BITBUCKETSERVER_PASSWORD"],
      }
    )
  }

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
