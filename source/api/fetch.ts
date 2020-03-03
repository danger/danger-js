import { debug } from "../debug"
import * as node_fetch from "node-fetch"

import HttpProxyAgent from "http-proxy-agent"
import HttpsProxyAgent from "https-proxy-agent"

import AsyncRetry from "async-retry"

const d = debug("networking")
declare const global: any

const isJest = typeof jest !== "undefined"
const warn = isJest ? () => "" : console.warn

const shouldRetryRequest = (res: node_fetch.Response) => {
  // Don't retry 4xx errors other than 401. All 4xx errors can probably be ignored once
  // the Github API issue causing https://github.com/danger/peril/issues/440 is fixed
  return res.status === 401 || (res.status >= 500 && res.status <= 599)
}

/**
 * Adds retry handling to fetch requests
 *
 * @param {(string | fetch.Request)} url the request
 * @param {fetch.RequestInit} [init] the usual options
 * @returns {Promise<fetch.Response>} network-y promise
 */
export async function retryableFetch(
  url: string | node_fetch.Request,
  init: node_fetch.RequestInit
): Promise<node_fetch.Response> {
  const retries = isJest ? 1 : 3
  return AsyncRetry(
    async (_, attempt) => {
      const originalFetch = node_fetch.default
      const res = await originalFetch(url, init)

      // Throwing an error will trigger a retry
      if (attempt <= retries && shouldRetryRequest(res)) {
        throw new Error(`Request failed [${res.status}]: ${res.url}. Attempting retry.`)
      }

      return res
    },
    {
      retries: retries,
      onRetry: (error, attempt) => {
        warn(error.message)
        warn(`Retry ${attempt} of ${retries}.`)
      },
    }
  )
}

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
  suppressErrorReporting?: boolean,
  provessEnv: NodeJS.ProcessEnv = process.env
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

    const showToken = provessEnv["DANGER_VERBOSE_SHOW_TOKEN"]
    const token = provessEnv["DANGER_GITHUB_API_TOKEN"] || provessEnv["GITHUB_TOKEN"]

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

  let agent = init.agent
  const proxy =
    provessEnv["HTTPS_PROXY"] || provessEnv["https_proxy"] || provessEnv["HTTP_PROXY"] || provessEnv["http_proxy"]

  if (!agent && proxy) {
    let secure = url.toString().startsWith("https")
    init.agent = secure ? new HttpsProxyAgent(proxy) : new HttpProxyAgent(proxy)
  }

  return retryableFetch(url, init).then(async (response: node_fetch.Response) => {
    // Handle failing errors
    if (!suppressErrorReporting && !response.ok) {
      // we should not modify the response when an error occur to allow body stream to be read again if needed
      let clonedResponse = response.clone()
      warn(`Request failed [${clonedResponse.status}]: ${clonedResponse.url}`)
      let responseBody = await clonedResponse.text()
      try {
        // tries to pretty print the JSON response when possible
        const responseJSON = await JSON.parse(responseBody.toString())
        warn(`Response: ${JSON.stringify(responseJSON, null, "  ")}`)
      } catch (e) {
        warn(`Response: ${responseBody}`)
      }
    }

    return response
  })
}
