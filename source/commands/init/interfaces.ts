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
  ciType: "gh-actions" | "travis" | "circle" | "unknown"
  isGitHub: boolean
}

export interface InitUI {
  header: (msg: string) => void
  command: (command: string) => void
  say: (msg: string) => void
  pause: (secs: number) => Promise<unknown>
  waitForReturn: () => void
  link: (name: string, href: string) => string
  askWithAnswers: (message: string, answers: string[]) => string
}

export const highlight = chalk.bold.yellow as any
