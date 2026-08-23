import { createSign } from "crypto"
import { fetch } from "undici"

// Step 1

const base64url = (input: string | Buffer) => Buffer.from(input).toString("base64url")

/** App ID + Signing Key = initial JWT to start auth process */
const jwtForGitHubAuth = (appID: string, key: string) => {
  const now = Math.round(new Date().getTime() / 1000)
  const expires: number = now + 300
  const header: object = {
    alg: "RS256",
    typ: "JWT",
  }
  const payload: object = {
    exp: expires,
    iat: now,
    iss: appID,
  }

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
  const signature = createSign("RSA-SHA256").update(signingInput).sign(key)
  return `${signingInput}.${base64url(signature)}`
}

// Step 2 - Use App signed JWT to grab a per-installation

const requestAccessTokenForInstallation = (appID: string, installationID: number, key: string) => {
  const apiUrl = process.env["DANGER_GITHUB_API_BASE_URL"]
    ? process.env["DANGER_GITHUB_API_BASE_URL"]
    : "https://api.github.com"
  const url = `${apiUrl}/app/installations/${installationID}/access_tokens`
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

const isInstallationAccessToken = (credentials: unknown): credentials is { token: string } =>
  typeof credentials === "object" &&
  credentials !== null &&
  "token" in credentials &&
  typeof credentials.token === "string"

/** Generates a temporary access token for an app's installation, 5m long */
export const getAccessTokenForInstallation = async (appID: string, installationID: number, key: string) => {
  const newToken = await requestAccessTokenForInstallation(appID, installationID, key)
  const credentials = await newToken.json()
  if (!newToken.ok) {
    console.error(`Could not get an access token for ${installationID}`)
    console.error(`GitHub returned: ${JSON.stringify(credentials)}`)
  }
  if (!isInstallationAccessToken(credentials)) {
    throw new Error(`GitHub did not return an installation access token for ${installationID}`)
  }
  return credentials.token
}
