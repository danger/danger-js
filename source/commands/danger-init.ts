import * as chalk from "chalk"
import * as hyperLinker from "hyperlinker"
import * as program from "commander"
import * as readlineSync from "readline-sync"
import * as supportsHyperlinks from "supports-hyperlinks"

import * as fs from "fs"
import { basename } from "path"
import { setTimeout } from "timers"

import { generateDefaultDangerfile } from "./init/default-dangerfile"

program
  .description("Helps you get set up through to your first Danger.")
  .option("-i, --impatient", "Don't add dramatic pauses.")
  .option("-d, --defaults", "Always take the default action.")

interface App {
  impatient: boolean
  defaults: boolean
}

const app: App = program as any

interface InitUI {
  header: (msg: String) => void
  command: (command: string) => void
  say: (msg: String) => void
  pause: (secs: number) => Promise<{}>
  waitForReturn: () => void
  link: (name: string, href: string) => string
  askWithAnswers: (message: string, answers: string[]) => string
}

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
}
const createUI = (state: InitState, app: App): InitUI => {
  const say = (msg: String) => console.log(msg)
  const fancyLink = (name: string, href: string) => hyperLinker(name, href)
  const inlineLink = (_name: string, href: string) => "-> " + href
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

const checkForTypeScript = () => fs.existsSync("node_modules/typescript/package.json")
const checkForBabel = () =>
  fs.existsSync("node_modules/babel-core/package.json") || fs.existsSync("node_modules/@babel/core/package.json")

const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1)
const camelCase = (str: string) => str.split("-").reduce((a, b) => a + b.charAt(0).toUpperCase() + b.slice(1))

const generateInitialState = (osProcess: NodeJS.Process): InitState => {
  const isMac = osProcess.platform === "darwin"
  const isWindows = osProcess.platform === "win32"
  const folderName = capitalizeFirstLetter(camelCase(basename(osProcess.cwd())))
  const isTypeScript = checkForTypeScript()
  const isBabel = checkForBabel()
  return {
    isMac,
    isWindows,
    isTypeScript,
    isBabel,
    isAnOSSRepo: true,
    supportsHLinks: supportsHyperlinks.stdout,
    filename: isTypeScript ? "Dangerfile.ts" : "Dangerfile.js",
    botName: folderName + "Bot",
    hasSetUpAccount: false,
    hasCreatedDangerfile: false,
    hasSetUpAccountToken: false,
  }
}

const go = async (app: App) => {
  const initialState = generateInitialState(process)
  const ui: InitUI = createUI(initialState, app)
  await showTodoState(ui, initialState)
  await setupDangerfile(ui, initialState)
  await setupGitHubAccount(ui, initialState)
  await setupGHAccessToken(ui, initialState)
  await wrapItUp(ui, initialState)
  await thanks(ui, initialState)
}

const highlight = chalk.bold.yellow

const showTodoState = async (ui: InitUI, state: InitState) => {
  ui.say("Welcome to Danger Init - this will take you through setting up Danger for this project.")
  ui.say("There are four main steps we need to do:\n")
  await ui.pause(0.6)
  ui.say(` - [${state.hasCreatedDangerfile ? "x" : " "}] Create a Dangerfile and add a few simple rules.`)
  await ui.pause(0.6)
  ui.say(` - [${state.hasSetUpAccount ? "x" : " "}] Create a GitHub account for Danger to use, for messaging.`)
  await ui.pause(0.6)
  ui.say(` - [${state.hasSetUpAccountToken ? "x" : " "}] Set up an access token for Danger.`)
  await ui.pause(0.6)
  ui.say(" - [ ] Set up Danger to run on your CI.\n")
}

const setupDangerfile = async (ui: InitUI, state: InitState) => {
  ui.header("Step 1: Creating a starter Dangerfile")

  if (!fs.existsSync("dangerfile.js") && fs.existsSync("dangerfile.ts")) {
    ui.say("I've set up an example Dangerfile for you in this folder.\n")
    await ui.pause(1)

    const content = generateDefaultDangerfile(state)
    // File.write("Dangerfile", content)

    ui.command(`cat ${process.cwd()}/${state.filename}`)

    content.split("\n").forEach((l: string) => ui.say(`  ` + chalk.green(l)))
    ui.say("")
    await ui.pause(2)

    ui.say("There's a collection of small, simple rules in here, but Danger is about being able to easily")
    ui.say("iterate. The power comes from you having the ability to codify fixes for some of the problems")
    ui.say("that come up in day to day programming. It can be difficult to try and see those from day 1.")

    ui.say("\nIf you'd like to investigate the file, and make some changes - I'll wait here,")
    ui.say("press return when you're ready to move on...")
    ui.waitForReturn()
  } else {
    ui.say("You already have a Dangerfile, so that simplifies this step!")
  }
}

const setupGitHubAccount = async (ui: InitUI, state: InitState) => {
  ui.header("Step 2: Creating a GitHub account")

  ui.say("In order to get the most out of Danger, I'd recommend giving it the ability to post in")
  ui.say("the code-review comment section.")

  ui.say("\n" + ui.link("GitHub Home", "https://github.com") + "\n")

  await ui.pause(1)

  ui.say(`IMO, it's best to do this by using the private mode of your browser.`)
  ui.say(`Create an account like: ${highlight(state.botName)} and don't forget a cool robot avatar too.\n`)

  await ui.pause(1)
  ui.say("Here are great resources for creative-commons images of robots:\n")
  const flickr = ui.link("flickr", "https://www.flickr.com/search/?text=robot&license=2%2C3%2C4%2C5%2C6%2C9")
  const googImages = ui.link(
    "googleimages",
    "https://www.google.com/search?q=robot&tbs=sur:fmc&tbm=isch&tbo=u&source=univ&sa=X&ved=0ahUKEwjgy8-f95jLAhWI7hoKHV_UD00QsAQIMQ&biw=1265&bih=1359"
  )
  ui.say(" - " + flickr)
  ui.say(" - " + googImages)
  ui.say("")
  await ui.pause(1)

  noteAboutClickingLinks(ui, state)
  await ui.pause(1)

  if (state.isAnOSSRepo) {
    ui.say(`${state.botName} does not need privileged access to your repo or org. This is because Danger will only`)
    ui.say("be writing comments, and you do not need special access for that.")
  } else {
    ui.say(`${state.botName} will need access to your repo. Simply because the code is not available for the public`)
    ui.say("to read and comment on.")
  }

  await ui.pause(1)
  ui.say("\nCool, please press return when you have your account ready (and you've verified the email...)")
  ui.waitForReturn()
}

const setupGHAccessToken = async (ui: InitUI, state: InitState) => {
  ui.header("Step 3: Configuring a GitHub Personal Access Token")

  ui.say("Here's the link, you should open this in the private session where you just created the new GitHub account")
  ui.say("\n" + ui.link("New GitHub Token", "https://github.com/settings/tokens/new"))
  await ui.pause(1)

  ui.say("For token access rights, I need to know if this is for an Open Source or private project\n")
  // TODO: Check for this via the API instead!
  state.isAnOSSRepo = ui.askWithAnswers("", ["Open Source", "Private Repo"]) === "Open Source"

  if (state.isAnOSSRepo) {
    ui.say("\n\nFor Open Source projects, I'd recommend giving the token the smallest scope possible.")
    ui.say("This means only providing access to " + highlight("public_repo") + " in the token.\n")
    await ui.pause(1)
    ui.say(
      "This token limits Danger's abilities to " +
        chalk.bold("just") +
        " writing comments on OSS projects. We recommend"
    )
    ui.say("this because the token can quite easily be extracted from the environment via pull requests.")

    ui.say("\nIt is important that you do not store this token in your repository, as GitHub will")
    ui.say("automatically revoke your token when pushed.\n")
  } else {
    ui.say("\n\nFor private projects, I'd recommend giving the token access to the whole repo scope.")
    ui.say("This means only providing access to " + highlight("repo") + ", and its children in the token.\n\n")
    await ui.pause(1)
    ui.say("It's worth noting that you " + chalk.bold.red("should not") + " re-use this token for OSS repos.")
    ui.say("Make a new one for those repos with just " + highlight("public_repo") + ".")
    await ui.pause(1)
    ui.say("Additionally, don't forget to add your new GitHub account as a collaborator to your private project.")
  }

  ui.say("\n👍, please press return when you have your token set up...")
  ui.waitForReturn()
}

const noteAboutClickingLinks = (ui: InitUI, state: InitState) => {
  const modifier_key = state.isMac ? "cmd ( ⌘ )" : "ctrl"
  const clicks = state.isWindows || state.supportsHLinks ? "clicking" : "double clicking"
  const sidenote = chalk.italic.bold("Sidenote: ")
  ui.say(`${sidenote} Holding ${modifier_key} and ${clicks} a link will open it in your browser.\n`)
}

const wrapItUp = async (ui: InitUI, _state: InitState) => {
  ui.header("Useful info")
  ui.say(
    "- One of the best ways to test out new rules as you build them is via " + highlight("bundle exec danger pr") + "."
  )
  await ui.pause(0.6)
  ui.say("- You can have Danger output a lot of info via the " + highlight("--verbose") + " option.")
  await ui.pause(0.6)
  ui.say("- You can look at the following Dangerfiles to get some more ideas:\n")
  await ui.pause(0.6)

  const link = (name: string, url: string) => ui.say("  * " + ui.link(name, url))
  link("artsy/Emission#dangerfile.ts", "https://github.com/artsy/emission/blob/master/dangerfile.ts")
  link(
    "facebook/react-native#danger/dangerfile.js",
    "https://github.com/facebook/react-native/blob/master/danger/dangerfile.js"
  )
  link(
    "apollographql/apollo-client#dangerfile.ts",
    "https://github.com/apollographql/apollo-client/blob/master/dangerfile.ts"
  )
  link(
    "styled-components/styled-components#dangerfile.js",
    "https://github.com/styled-components/styled-components/blob/master/dangerfile.js"
  )
  link(
    "styleguidist/react-styleguidist#dangerfile.js",
    "https://github.com/styleguidist/react-styleguidist/blob/master/dangerfile.js"
  )
  link("storybooks/storybook#dangerfle.js", "https://github.com/storybooks/storybook/blob/master/dangerfile.js")
  link("ReactiveX/rxjs#dangerfle.js", "https://github.com/ReactiveX/rxjs/blob/master/dangerfile.js")

  await ui.pause(1)
}

const thanks = async (ui: InitUI, _state: InitState) => {
  ui.say("\n\n🎉\n")
  await ui.pause(0.6)

  ui.say("And you're good to go. Danger is a collaboration between Orta Therox, Gem 'Danger' Maslen,")
  ui.say("and every who has sent PRs.\n")
  ui.say(
    "If you like Danger, let others know. If you want to know more, follow " +
      chalk.yellow("@orta") +
      " and " +
      chalk.yellow("@DangerSystems") +
      " on Twitter."
  )
  ui.say("If you don't like something about Danger, help us improve the project - it's all volunteer time! xxx")
}

go(app)
