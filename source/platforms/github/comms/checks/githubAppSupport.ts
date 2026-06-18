import { SignJWT, importPKCS8 } from "jose"
import fetch from "node-fetch"

const ALG = "RS256" as const
// Step 1

/** App ID + Signing Key = initial JWT to start auth process */
export const jwtForGitHubAuth = async (appID: string, privateKeyPEM: string) => {
  const key = await importPKCS8(privateKeyPEM, ALG)
  const now = Math.floor(Date.now() / 1000)

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + 300)
    .setIssuer(appID)
    .sign(key)

  return token
}

// Step 2 - Use App signed JWT to grab a per-installation

const requestAccessTokenForInstallation = async (appID: string, installationID: number, privateKeyPEM: string) => {
  const apiUrl = process.env["DANGER_GITHUB_API_BASE_URL"] ?? "https://api.github.com"
  const url = `${apiUrl}/app/installations/${installationID}/access_tokens`

  const jwt = await jwtForGitHubAuth(appID, privateKeyPEM)

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${jwt}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({}),
  })

  return res
}

/** Generates a temporary access token for an app's installation, 5m long */
export const getAccessTokenForInstallation = async (appID: string, installationID: number, privateKeyPEM: string) => {
  const res = await requestAccessTokenForInstallation(appID, installationID, privateKeyPEM)
  const json = await res.json()
  if (!res.ok) {
    console.error(`Could not get an access token for installation ${installationID}`)
    console.error(`GitHub returned: ${JSON.stringify(json)}`)
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  }
  return json.token as string
}
