import { providers } from "./providers"
import * as fs from "fs"
import { resolve } from "path"
import { Env, CISource } from "./ci_source"

/**
 * Gets a CI Source from the current environment, by asking all known
 * sources if they can be represented in this environment.
 * @param {Env} env The environment.
 * @returns {?CISource} a CI source if it's OK, otherwise Danger can't run.
 */
export function getCISourceForEnv(env: Env): CISource | undefined {
  const availableProviders = [...(providers as any)].map(Provider => new Provider(env)).filter(x => x.isCI)
  return availableProviders && availableProviders.length > 0 ? availableProviders[0] : undefined
}

/**
 * Gets a CI Source from externally provided provider module.
 * Module must implement CISource interface, and should export it as default
 * @export
 * @param {Env} env The environment.
 * @param {string} modulePath relative path to CI provider
 * @returns {Promise<?CISource>} a CI source if module loaded successfully, undefined otherwise
 */
export async function getCISourceForExternal(env: Env, modulePath: string): Promise<CISource | undefined> {
  const path = resolve(process.cwd(), modulePath)
  return new Promise<CISource | undefined>(resolve => {
    fs.stat(path, (error, stat) => {
      if (error) {
        console.error(`could not load CI provider at ${modulePath} due to ${error}`)
      }
      if (stat && stat.isFile()) {
        const externalModule = require(path) //tslint:disable-line:no-require-imports
        const moduleConstructor = externalModule.default || externalModule
        resolve(new moduleConstructor(env))
      }
      resolve(undefined)
    })
  })
}

/**
 * Gets a CI Source.
 * @export
 * @param {Env} env The environment.
 * @param {string} modulePath relative path to CI provider
 * @returns {Promise<?CISource>} a CI source if module loaded successfully, undefined otherwise
 */
export async function getCISource(env: Env, modulePath: string | undefined): Promise<CISource | undefined> {
  if (modulePath) {
    const external = await getCISourceForExternal(env, modulePath)
    if (external) {
      return external
    }
  }

  return getCISourceForEnv(env)
}
