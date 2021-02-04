import chalk from "chalk"

export interface InitState {
  filename: string
  botName: string

  isWindows: boolean
  isMac: boolean
  isBabel: boolean
  isTypeScript: boolean
  supportsHLinks: boolean

  isAnOSSRepo: boolean

  hasCreatedDangerfile: boolean
  hasSetUpAccount: boolean
  hasSetUpAccountToken: boolean

  repoSlug: string | null
  repoType: "github" | "azureDevops" | "bitbucket" | "unknown"
  ciType: "travis" | "circle" | "azureDevops" | "unknown"
}

export interface InitUI {
  header: (msg: String) => void
  command: (command: string) => void
  say: (msg: String) => void
  pause: (secs: number) => Promise<{}>
  waitForReturn: () => void
  link: (name: string, href: string) => string
  askWithAnswers: (message: string, answers: string[]) => string
}

export const highlight = chalk.bold.yellow as any
