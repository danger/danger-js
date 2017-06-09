import * as debug from "debug"
import * as node_fetch from "node-fetch"

const d = debug("danger:networking")
declare const global: any
/**
 * Adds logging to every fetch request if a global var for `verbose` is set to true
 *
 * @param {(string | fetch.Request)} url the request
 * @param {fetch.RequestInit} [init] the usual options
 * @returns {Promise<fetch.Response>} network-y promise
 */
export function api(url: string | node_fetch.Request, init: node_fetch.RequestInit): Promise<node_fetch.Response> {
  if (global.verbose && global.verbose === true) {
    const output = ["curl", "-i"]

    if (init.method) {
      output.push(`-X ${init.method}`)
    }

    const showToken = process.env["DANGER_VERBOSE_SHOW_TOKEN"]
    const token = process.env["DANGER_GITHUB_API_TOKEN"]

    if (init.headers) {
      for (const prop in init.headers) {
        if (init.headers.hasOwnProperty(prop)) {
          // Don't show the token for normal verbose usage
          if (init.headers[prop].includes(token) && !showToken) {
            output.push("-H", `"${prop}: [API TOKEN]"`)
            continue
          }
          output.push("-H", `"${prop}: ${init.headers[prop]}"`)
        }
      }
    }

    if (init.method === "POST") {
      // const body:string = init.body
      // output.concat([init.body])
    }

    if (typeof url === "string") {
      output.push(url)
    }

    d(output.join(" "))
  }
  const originalFetch: any = node_fetch
  return originalFetch(url, init).then(async (response: node_fetch.Response) => {
    // Handle failing errors
    if (!response.ok) {
      const responseJSON = await response.json()
      console.warn(`Request failed [${response.status}]: ${response.url}`)
      console.warn(`Response: ${JSON.stringify(responseJSON, null, "  ")}`)
    }

    return response
  })
}
