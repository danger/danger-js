import { getCISource } from "../../ci_source/get_ci_source"
import { providers } from "../../ci_source/providers"
import { sentence } from "../../runner/DangerUtils"
import { SharedCLI } from "./sharedDangerfileArgs"
import { CISource } from "../../ci_source/ci_source"

const getRuntimeCISource = async (app: SharedCLI): Promise<CISource | undefined> => {
  const source = getCISource(process.env, app.externalCiProvider || undefined)

  if (!source) {
    console.log("Could not find a CI source for this run. Does Danger support this CI service?")
    console.log(`Danger supports: ${sentence(providers.map(p => p.name))}.`)

    if (!process.env["CI"]) {
      console.log("You may want to consider using `danger pr` to run Danger locally.")
    }

    process.exitCode = 1
  }

  // run the sources setup function, if it exists
  if (source && source.setup) {
    await source.setup()
  }

  return source
}

export default getRuntimeCISource
