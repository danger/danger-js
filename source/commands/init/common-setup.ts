import { InitUI, InitState } from "./interfaces"
import chalk from "chalk"

export const noteAboutClickingLinks = (ui: InitUI, state: InitState) => {
  const modifier_key = state.isMac ? "cmd ( ⌘ )" : "ctrl"
  const clicks = state.isWindows || state.supportsHLinks ? "clicking" : "double clicking"
  const sidenote = chalk.italic.bold("Sidenote: ")
  ui.say(`${sidenote} Holding ${modifier_key} and ${clicks} a link will open it in your browser.\n`)
}
