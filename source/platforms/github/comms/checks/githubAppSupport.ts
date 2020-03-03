import * as jwt from "jsonwebtoken"
import fetch from "node-fetch"

// Step 1

/** App ID + Signing Key = initial JWT to start auth process */
const jwtForGitHubAuth = (appID: string, key: string) => {
  const now = Math.round(new Date().getTime() / 1000)
  const expires: number = now + 300
  const keyContent = key
  const payload: object = {
    exp: expires,
    iat: now,
    iss: appID,
  }

  return jwt.sign(payload, keyContent, { algorithm: "RS256" })
}

// Step 2 - Use App signed JWT to grab a per-installation

const requestAccessTokenForInstallation = (appID: string, installationID: number, key: string) => {
  const apiUrl = process.env["DANGER_GITHUB_API_BASE_URL"]
    ? process.env["DANGER_GITHUB_API_BASE_URL"]
    : "https://api.github.com"
  const url = `${apiUrl}/installations/${installationID}/access_tokens`
  const headers = {
    Accept: "application/vnd.github.machine-man-preview+json",
    Authorization: `Bearer ${jwtForGitHubAuth(appID, key)}`,
  }
  return fetch(url, {
    body: JSON.stringify({}),
    headers,
    method: "POST",
  })
}

/** Generates a temporary access token for an app's installation, 5m long */
export const getAccessTokenForInstallation = async (appID: string, installationID: number, key: string) => {
  const newToken = await requestAccessTokenForInstallation(appID, installationID, key)
  const credentials = await newToken.json()
  if (!newToken.ok) {
    console.error(`Could not get an access token for ${installationID}`)
    console.error(`GitHub returned: ${JSON.stringify(credentials)}`)
  }
  return credentials.token as string
}
