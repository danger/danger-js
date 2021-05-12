import { GitHubAPI } from "../GitHubAPI"
import { DangerResults, isEmptyResults, isMarkdownOnlyResults } from "../../../dsl/DangerResults"
import { ExecutorOptions } from "../../../runner/Executor"
import { resultsToCheck } from "./checks/resultsToCheck"
import { getAccessTokenForInstallation } from "./checks/githubAppSupport"
import { debug } from "../../../debug"
import { sentence } from "../../../runner/DangerUtils"
import { getCustomAppAuthFromEnv, getAuthWhenUsingDangerJSApp } from "./githubAppSetup"

const d = debug("GitHub::Checks")

const canUseChecks = (token: string | undefined) => {
  // An access token for an app looks like: v1.a06e8953d69edf05f06d61ab016ee80ab4b088ca
  if (token && token.startsWith("v1.")) {
    return true
  }
  // Are you using a custom GH app manually?
  const custom = getCustomAppAuthFromEnv()
  if (custom.appID && custom.key && custom.installID) {
    return true
  }
  // Are you using the Danger JS app?
  const dangerApp = getAuthWhenUsingDangerJSApp()
  if (dangerApp.appID && dangerApp.key && dangerApp.installID) {
    return true
  }

  d("Not using the checks API for GitHub")
  return false
}

/**
 * An object whose responsibility is to handle commenting on an issue
 * @param api
 */
export const GitHubChecksCommenter = (api: GitHubAPI) => {
  if (!canUseChecks(api.token)) {
    return undefined
  }

  return {
    platformResultsPreMapper: async (
      results: DangerResults,
      options: ExecutorOptions,
      ciCommitHash?: string
    ): Promise<DangerResults> => {
      // Does nothing if you disable checks support
      if (options.disableGitHubChecksSupport) {
        return results
      }

      let token = api.token
      // Either it doesn't exist, or is a personal access token
      if (!token || !token.startsWith("v1.")) {
        const custom = process.env.DANGER_JS_APP_INSTALL_ID ? getAuthWhenUsingDangerJSApp() : getCustomAppAuthFromEnv()
        token = await getAccessTokenForInstallation(custom.appID!, parseInt(custom.installID!), custom.key!)
        d("Created a custom access token: ", [custom.appID!, parseInt(custom.installID!), custom.key!, token])
      }

      let returnedResults = results
      d("Getting PR details for checks")
      const pr = await api.getPullRequestInfo()
      const checkData = await resultsToCheck(results, options, pr, api.getExternalAPI(), ciCommitHash)
      try {
        // If Danger succeeds at creating a checks API call, then we switch out
        // the results which go through to the issue commenter with a summary version.
        const response = await api.postCheckRun(checkData, token!)
        returnedResults = tweetSizedResultsFromResults(results, response)
        d("Got response on the checks API")
        d(JSON.stringify(response))
      } catch (error) {
        d("Check Creation failed with:")
        d(JSON.stringify(error))
      }

      return returnedResults
    },
  }
}

export const tweetSizedResultsFromResults = (results: DangerResults, checksResponse: any): DangerResults => {
  const allowMarkdowns = isMarkdownOnlyResults(results)
  const isEmpty = isEmptyResults(results)

  if (allowMarkdowns || isEmpty) {
    return results
  }

  return {
    warnings: [],
    messages: [],
    fails: [],
    markdowns: [
      {
        message:
          "Danger run resulted in " +
          messageFromResults(results) +
          `; to find out more, see the [checks page](${checksResponse.html_url}).`,
      },
    ],
  }
}

const messageFromResults = (results: DangerResults): string => {
  const appendS = (arr: any[]) => (arr.length === 1 ? "" : "s")
  const makeString = (name: string, arr: any[]) =>
    arr.length ? `${arr.length} ${name.substring(0, name.length - 1)}${appendS(arr)}` : null

  const newMessageComponents = Object.keys(results)
    .map(key => makeString(key, results[key]))
    .filter(Boolean) as any[]

  return sentence(newMessageComponents)
}
