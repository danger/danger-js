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

    if (init.headers) {
      for (const prop in init.headers) {
        if (init.headers.hasOwnProperty(prop)) {
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

    console.log(output.join(" "))  // tslint:disable-line
  }

  return fetch(url, init)
}
