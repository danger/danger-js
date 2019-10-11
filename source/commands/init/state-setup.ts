import readlineSync from "readline-sync"
import supportsHyperlinks from "supports-hyperlinks"
import hyperLinker from "hyperlinker"
import chalk from "chalk"

import { basename } from "path"
import { setTimeout } from "timers"
import * as fs from "fs"

import { getRepoSlug, getRepoInfo } from "./get-repo-slug"
import { InitState, InitUI } from "./interfaces"

export const createUI = (state: InitState, app: any): InitUI => {
  const say = (msg: String) => console.log(msg)
  const fancyLink = (name: string, href: string) => hyperLinker(name, href)
  const inlineLink = (_name: string, href: string) => chalk.underline(href)
  const linkToUse = state.supportsHLinks ? fancyLink : inlineLink

  return {
    say,
    header: (msg: String) => say(chalk.bold("\n## " + msg + "\n")),
    command: (command: string) => say("> " + chalk.white.bold(command) + " \n"),
    link: (name: string, href: string) => linkToUse(name, href),
    pause: async (secs: number) => new Promise(done => setTimeout(done, secs * 1000)),
    waitForReturn: () => (app.impatient ? Promise.resolve() : readlineSync.question("\n↵ ")),
    askWithAnswers: (_message: string, answers: string[]) => {
      const a = readlineSync.keyInSelect(answers, "", { defaultInput: answers[0] })
      return answers[a]
    },
  }
}

export const generateInitialState = (osProcess: NodeJS.Process): InitState => {
  const isMac = osProcess.platform === "darwin"
  const isWindows = osProcess.platform === "win32"
  const folderName = capitalizeFirstLetter(camelCase(basename(osProcess.cwd())))
  const isTypeScript = checkForTypeScript()
  const isBabel = checkForBabel()
  const hasTravis = fs.existsSync(".travis.yml")
  const hasCircle = fs.existsSync("circle.yml")
  const hasAzureDevops = fs.existsSync("azure-pipelines.yml")
  //TODO - conditional statement won't scale
  const ciType = hasTravis ? "travis" : hasCircle ? "circle" : hasAzureDevops ? "azureDevops" : "unknown"
  const repoSlug = getRepoSlug()
  const repoType = getRepoInfo()

  return {
    isMac,
    isWindows,
    isTypeScript,
    isBabel,
    isAnOSSRepo: true,
    supportsHLinks: supportsHyperlinks.stdout,
    filename: isTypeScript ? "dangerfile.ts" : "dangerfile.js",
    botName: folderName + "Bot",
    hasSetUpAccount: false,
    hasCreatedDangerfile: false,
    hasSetUpAccountToken: false,
    repoSlug,
    repoType,
    ciType,
  }
}

const checkForTypeScript = () => fs.existsSync("node_modules/typescript/package.json")
const checkForBabel = () =>
  fs.existsSync("node_modules/babel-core/package.json") || fs.existsSync("node_modules/@babel/core/package.json")

const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1)
const camelCase = (str: string) => str.split("-").reduce((a, b) => a + b.charAt(0).toUpperCase() + b.slice(1))
