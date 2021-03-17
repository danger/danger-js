import { getAccessTokenForInstallation } from "../github/comms/checks/githubAppSupport"
import { Env } from "../../ci_source/ci_source"
import { getAuthWhenUsingDangerJSApp, getCustomAppAuthFromEnv } from "./comms/githubAppSetup"

/** Grabs the GitHub API token from the process, or falls back to using a GitHub App "Danger OSS" */
export const getGitHubToken = async (diEnv?: Env) => {
  // "Normal" auth via a token
  const env = diEnv || process.env

  const token = env["DANGER_GITHUB_API_TOKEN"] || env["GITHUB_TOKEN"]!
  if (token) {
    return token
  }

  // If you're not on GitHub Actions
  const isActions = diEnv["GITHUB_WORKFLOW"]
  if (!isActions) {
    return undefined
  }

  const installID = diEnv.DANGER_OSS_APP_INSTALL_ID || diEnv.DANGER_JS_APP_INSTALL_ID
  if (!installID) {
    throw new Error(`
Danger could not set up an access token for this run. Outside of first setting up danger, this is 
_nearly_ always a case where an OSS repos expects the access token from 'secrets' to show up on fork
PRs. In those cases you need to either:

- Sign your repo up to Danger OSS: https://github.com/apps/danger-oss to get a \`DANGER_OSS_APP_INSTALL_ID\`
- Pass in your own auth token via \`DANGER_GITHUB_API_TOKEN\`
`)
  }

  const custom = env.DANGER_JS_APP_INSTALL_ID ? getAuthWhenUsingDangerJSApp() : getCustomAppAuthFromEnv()
  const appToken = await getAccessTokenForInstallation(custom.appID!, parseInt(custom.installID!), custom.key!)
  return appToken
}
