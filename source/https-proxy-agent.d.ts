// From: https://github.com/TooTallNate/node-https-proxy-agent/issues/27
declare module "https-proxy-agent" {
  import * as https from "https"

  namespace HttpsProxyAgent {
    interface HttpsProxyAgentOptions {
      host: string
      port: number
      secureProxy?: boolean
      headers?: {
        [key: string]: string
      }
      [key: string]: any
    }
  }

  // HttpsProxyAgent doesnt *actually* extend https.Agent, but for my purposes I want it to pretend that it does
  class HttpsProxyAgent extends https.Agent {
    constructor(opts: string)
    constructor(opts: HttpsProxyAgent.HttpsProxyAgentOptions)
  }

  export = HttpsProxyAgent
}
