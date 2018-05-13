// import * as debug from "debug"
import { PlatformCommunicator } from "../../platform"
import { GitHubAPI } from "../GitHubAPI"
import { DangerResults } from "../../../dsl/DangerResults"
import { ExecutorOptions } from "../../../runner/Executor"
import { resultsToCheck } from "./checks/resultsToCheck"

// See https://github.com/auth0/node-jsonwebtoken/issues/162
const JWT_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/

// const d = debug("danger:GitHub::Checks")

export const getCheckAuthFromEnv = () => {
  const appID = process.env.DANGER_GITHUB_APP_ID || process.env.PERIL_INTEGRATION_ID
  const key = process.env.DANGER_GITHUB_APP_PRIVATE_SIGNING_KEY || process.env.PRIVATE_GITHUB_SIGNING_KEY
  const installID = process.env.DANGER_GITHUB_APP_INSTALL_ID || process.env.PERIL_ORG_INSTALLATION_ID

  return {
    appID,
    key,
    installID,
  }
}

const canUseChecks = (token: string | undefined) => {
  // Is it a JWT from Peril, basically?
  if (token && token.match(JWT_REGEX)) {
    return true
  } else {
    const auth = getCheckAuthFromEnv()
    return auth.appID && auth.key && auth.installID
  }
}

/**
 * An object whose responsibility is to handle commenting on an issue
 * @param api
 */
export const GitHubChecksCommenter = (api: GitHubAPI): PlatformCommunicator | undefined => {
  if (!canUseChecks(api.token)) {
    return undefined
  }

  return {
    supportsCommenting: () => true,
    supportsInlineComments: () => true,
    supportsHandlingResultsManually: () => true,

    handlePostingResults: async (results: DangerResults, options: ExecutorOptions) => {
      const pr = await api.getPullRequestInfo()

      // TODO, auth correctly!
      const octokit = api.getExternalAPI()

      // const existingReport = octokit.issues
      const checkData = resultsToCheck(results, options, pr)
    },

    // These are all NOOPs, because they aren't actually going to be called
    updateStatus: () => Promise.resolve(true),
    getInlineComments: () => Promise.resolve([]),
    createComment: () => Promise.resolve({}),
    createInlineComment: () => Promise.resolve({}),
    updateInlineComment: () => Promise.resolve({}),
    deleteMainComment: () => Promise.resolve(true),
    deleteInlineComment: () => Promise.resolve(true),
    updateOrCreateComment: () => Promise.resolve("NOOP"),
  }
}
