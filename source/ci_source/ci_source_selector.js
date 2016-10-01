// @flow
"strict mode"

import type { Env, CISource } from "./ci_source"
import Travis from "./travis"

export function getCISourceForEnv(env: Env) : ?CISource {
  let travis = new Travis(env)
  return travis
}
