// Nock does not support native fetch until 4.0.0 release which at the time of writing is in beta.
// Furthermore it is currently unsure if 4.0.0 will contain support for recording fixtures.
// Until nock is updated >= 4.0.0 the polyfill is needed when testing against frameworks leveraging native fetch.

import fetch from "node-fetch"

let global = globalThis as any
global.fetch = fetch
