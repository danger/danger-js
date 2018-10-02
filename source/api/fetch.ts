import { debug } from "../debug"
import * as node_fetch from "node-fetch"

const d = debug("networking")
declare const global: any

/**
 * Adds logging to every fetch request if a global var for `verbose` is set to true
 *
 * @param {(string | fetch.Request)} url the request
 * @param {fetch.RequestInit} [init] the usual options
 * @returns {Promise<fetch.Response>} network-y promise
 */
export function api(
  url: string | node_fetch.Request,
  init: node_fetch.RequestInit,
  suppressErrorReporting?: boolean
): Promise<node_fetch.Response> {
  const isTests = typeof jest !== "undefined"
  if (isTests && !url.toString().includes("localhost")) {
    const message = `No API calls in tests please: ${url}`
    debugger // tslint:disable-line
    throw new Error(message)
  }

  if (global.verbose && global.verbose === true) {
    const output = ["curl", "-i"]

    if (init.method) {
      output.push(`-X ${init.method}`)
    }

    const showToken = process.env["DANGER_VERBOSE_SHOW_TOKEN"]
    const token = process.env["DANGER_GITHUB_API_TOKEN"] || process.env["GITHUB_TOKEN"]

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
  const originalFetch = node_fetch.default
  return originalFetch(url, init).then(async (response: node_fetch.Response) => {
    // Handle failing errors
    if (!suppressErrorReporting && !response.ok) {
      // we should not modify the response when an error occur to allow body stream to be read again if needed
      let clonedResponse = response.clone()
      console.warn(`Request failed [${clonedResponse.status}]: ${clonedResponse.url}`)
      let responseBody = await clonedResponse.text()
      try {
        // tries to pretty print the JSON response when possible
        const responseJSON = await JSON.parse(responseBody.toString())
        console.warn(`Response: ${JSON.stringify(responseJSON, null, "  ")}`)
      } catch (e) {
        console.warn(`Response: ${responseBody}`)
      }
    }

    return response
  })
}
