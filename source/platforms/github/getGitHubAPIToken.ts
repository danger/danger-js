import { getAccessTokenForInstallation } from "../github/comms/checks/githubAppSupport"
import { Env } from "../../ci_source/ci_source"
import { getAuthWhenUsingDangerJSApp, getCustomAppAuthFromEnv, hasCustomApp } from "./comms/githubAppSetup"

/** Grabs the GitHub API token from the process, or falls back to using a GitHub App "Danger OSS" */
export const getGitHubAPIToken = async (diEnv?: Env) => {
  // "Normal" auth via a token
  const env = diEnv || process.env

  const token = env["DANGER_GITHUB_API_TOKEN"] || env["GITHUB_TOKEN"]!
  if (token) {
    return token
  }

  // If you're not on GitHub Actions
  const isActions = env["GITHUB_WORKFLOW"]
  if (!isActions) {
    return undefined
  }

  const installID = env.DANGER_OSS_APP_INSTALL_ID || env.DANGER_JS_APP_INSTALL_ID

  if (installID) {
    const app = getAuthWhenUsingDangerJSApp()
    const appToken = await getAccessTokenForInstallation(app.appID, parseInt(installID), app.key)
    return appToken
  }

  if (hasCustomApp()) {
    const app = getCustomAppAuthFromEnv()
    const appToken = await getAccessTokenForInstallation(app.appID!, parseInt(app.installID!), app.key!)
    return appToken
  }

  return undefined
}
