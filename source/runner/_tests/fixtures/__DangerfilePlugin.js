import { checkForTypesInDeps } from "danger-plugin-yarn"
const deps = {
  dependencies: {
    added: ["@types/danger"],
  },
}
checkForTypesInDeps(deps)
