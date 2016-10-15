// @flow
"strict mode"

import type { Env, CISource } from "./ci_source"
import Travis from "./travis"

/** Here is some docs for the function */
export function getCISourceForEnv(env: Env) : ?CISource {
  let travis = new Travis(env)
  return travis
}
