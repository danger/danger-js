import fetch from "node-fetch"

/**
 * Adds logging to every fetch request if a global var for `verbose` is set to true
 *
 * @param {(string | fetch.Request)} url the request
 * @param {fetch.RequestInit} [init] the usual options
 * @returns {Promise<fetch.Response>} network-y promise
 */
export default function api(url: string | fetch.Request, init?: fetch.RequestInit): Promise<fetch.Response> {
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

    console.log(output.join(" "))
  }

  return fetch(url, init)
  .then(response => {
    // Handle failing errors
    if (!response.ok) {
      process.exitCode = 1
      console.error(`Request failed: ${response}`)
      var msg = response.status === 0 ? "Network Error" : response.statusText
      throw new Error(response.status, msg, {response: response})
    }
    return response
  })
}
