import * as fs from "fs"

import * as program from "commander"
import * as chalk from "chalk"
import * as readlineSync from "readline-sync"
import { setTimeout } from "timers"
import { generateDefaultDangerfile } from "./init/default-dangerfile"

program
  .description("Helps you get set up through to your first Danger.")
  .option("-i, --impatient", "Don't add dramatic pauses.")
  .option("-d, --defaults", "Always take the default action.")

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
  isAnOSSRepo: boolean
  isWindows: boolean
  isMac: boolean
  supportsHLinks: boolean

  hasCreatedDangerfile: boolean
  hasSetUpAccount: boolean
  hasSetUpAccountToken: boolean
}

class UI {
  say = (msg: String) => {
    console.log(msg)
  }
  header = (msg: String) => this.say(chalk.bold("## " + msg))
  command = (command: string) => this.say("> " + chalk.gray.bold(command) + " \n")

  link = (_name: string, href: string) => "-> " + href

  pause = async (secs: number) => new Promise(done => setTimeout(done, secs * 1000))
  waitForReturn = () => readlineSync.question()
  askWithAnswers = (_message: string, answers: string[]) => {
    const a = readlineSync.keyInSelect(answers)
    return answers[a]
  }
}

// re: link
// echo -e '\e]8;;http://example.com\aThis is a link\e]8;;\a'
//

const checkForTypeScript = () => fs.readFileSync("node_modules/typescript/package.json")
// const _checkForBabel = () =>
// fs.readFileSync("node_modules/babel-core/package.json") || fs.readFileSync("node_modules/@babel/core/package.json")

const generateInitialState = (osProcess: NodeJS.Process): InitState => {
  const isMac = osProcess.platform === "darwin"
  const isWindows = osProcess.platform === "win32"
  const isIterm = osProcess.env["ITERM_SESSION_ID"] !== undefined
  const isVTE = false
  return {
    isMac,
    isWindows,
    supportsHLinks: isIterm || isVTE,
    isAnOSSRepo: false, // Not asked yet
    filename: checkForTypeScript() ? "Dangerfile.ts" : "Dangerfile.js",
    botName: "",
    hasSetUpAccount: false,
    hasCreatedDangerfile: false,
    hasSetUpAccountToken: false,
  }
}

const go = async () => {
  const initialState = generateInitialState(process)
  const ui: InitUI = new UI()
  await showTodoState(ui, initialState)
  await setupDangerfile(ui, initialState)
  await setupGitHubAccount(ui, initialState)
  await setupGHAccessToken(ui, initialState)
  await wrapItUp(ui, initialState)
  await thanks(ui, initialState)
}

const showTodoState = async (ui: InitUI, state: InitState) => {
  ui.say("We need to do the following:\n")
  await ui.pause(0.6)
  ui.say(` - [${state.hasCreatedDangerfile ? "x" : " "}] Create a Dangerfile and add a few simple rules.`)
  await ui.pause(0.6)
  ui.say(` - [${state.hasSetUpAccount ? "x" : " "}] Create a GitHub account for Danger to use, for messaging.`)
  await ui.pause(0.6)
  ui.say(` - [${state.hasSetUpAccountToken ? "x" : " "}] Set up an access token for Danger.`)
  await ui.pause(0.6)
  ui.say(" - [ ] Set up Danger to run on your CI.\n\n")
}

const setupDangerfile = async (ui: InitUI, state: InitState) => {
  ui.header("Step 1: Creating a starter Dangerfile")
  ui.say("I've set up an example Dangerfile for you in this folder.\n")
  await ui.pause(1)

  const content = generateDefaultDangerfile(state)
  // File.write("Dangerfile", content)

  ui.header("Step 1: Creating a starter Dangerfile")
  ui.say("I've set up an example Dangerfile for you in this folder.\n")
  await ui.pause(1)

  ui.command(`cat ${process.cwd()}/${state.filename}`)

  content.split("\n").forEach(l => ui.say(`  ` + chalk.green(l)))
  ui.say("")
  await ui.pause(2)

  ui.say("There's a collection of small, simple ideas in here, but Danger is about being able to easily")
  ui.say("iterate. The power comes from you having the ability to codify fixes for some of the problems")
  ui.say("that come up in day to day programming. It can be difficult to try and see those from day 1.")

  ui.say("\nIf you'd like to investigate the file, and make some changes - I'll wait here,")
  ui.say("press return when you're ready to move on...")
  ui.waitForReturn()
}

const setupGitHubAccount = async (ui: InitUI, state: InitState) => {
  ui.header("Step 2: Creating a GitHub account")

  ui.say("In order to get the most out of Danger, I'd recommend giving it the ability to post in")
  ui.say("the code-review comment section.\n\n")
  await ui.pause(1)

  ui.say("IMO, it's best to do this by using the private mode of your browser. Create an account like")
  ui.say(`${state.botName}, and don't forget a cool robot avatar.\n\n`)
  await ui.pause(1)
  ui.say("Here are great resources for creative commons images of robots:")
  const flickr = ui.link("flickr", "https://www.flickr.com/search/?text=robot&license=2%2C3%2C4%2C5%2C6%2C9")
  const googImages = ui.link(
    "googleimages",
    "https://www.google.com/search?q=robot&tbs=sur:fmc&tbm=isch&tbo=u&source=univ&sa=X&ved=0ahUKEwjgy8-f95jLAhWI7hoKHV_UD00QsAQIMQ&biw=1265&bih=1359"
  )
  ui.say(" - " + flickr)
  ui.say(" - " + googImages)
  ui.say("")
  await ui.pause(1)

  if (state.isAnOSSRepo) {
    ui.say(`${state.botName} does not need privileged access to your repo or org. This is because Danger will only`)
    ui.say("be writing comments, and you do not need special access for that.")
  } else {
    ui.say(`${state.botName} will need access to your repo. Simply because the code is not available for the public`)
    ui.say("to read and comment on.")
  }

  ui.say("")
  // note_about_clicking_links
  await ui.pause(1)
  ui.say("\nCool, please press return when you have your account ready (and you've verified the email...)")
  ui.waitForReturn()
}

const setupGHAccessToken = async (ui: InitUI, state: InitState) => {
  ui.header("Step 3: Configuring a GitHub Personal Access Token")

  ui.say("Here's the link, you should open this in the private session where you just created the new GitHub account")
  ui.link("New GitHub Token", "https://github.com/settings/tokens/new")
  await ui.pause(1)

  state.isAnOSSRepo =
    ui.askWithAnswers(
      "For token access rights, I need to know if this is for an Open Source or Closed Source project\n",
      ["Open", "Closed"]
    ) === "Open"

  if (state.isAnOSSRepo) {
    ui.say("For Open Source projects, I'd recommend giving the token the smallest scope possible.")
    ui.say("This means only providing access to " + chalk.yellow("public_repo") + " in the token.\n\n")
    await ui.pause(1)
    ui.say("This token limits Danger's abilities to just writing comments on OSS projects. I recommend")
    ui.say("this because the token can quite easily be extracted from the environment via pull requests.")

    ui.say(
      "\nIt is important that you do not store this token in your repository, as GitHub will automatically revoke it when pushed.\n"
    )
  } else {
    ui.say("For Closed Source projects, I'd recommend giving the token access to the whole repo scope.")
    ui.say("This means only providing access to " + chalk.yellow("repo") + ", and its children in the token.\n\n")
    await ui.pause(1)
    ui.say("It's worth noting that you " + chalk.bold.white("should not") + " re-use this token for OSS repos.")
    ui.say("Make a new one for those repos with just " + chalk.yellow("public_repo") + ".")
    await ui.pause(1)
    ui.say("Additionally, don't forget to add your new GitHub account as a collaborator to your Closed Source project.")
  }

  ui.say("\n👍, please press return when you have your token set up...")
  ui.waitForReturn()
}

// const noteAboutClickingLinks = (ui: InitUI, state: State) => {
//   const modifier_key = state.isMac ? "cmd ( ⌘ )" : "ctrl"
//   const clicks = state.isWindows ? "clicking" : "double clicking"

//   ui.say(`Note: Holding ${modifier_key} and ${clicks} a link will open it in your browser.`)
// }

const wrapItUp = async (ui: InitUI, _state: InitState) => {
  ui.header("Useful info")
  ui.say("- One of the best ways to test out new rules locally is via " + chalk.yellow("bundle exec danger pr") + ".")
  await ui.pause(0.6)
  ui.say(
    "- You can have Danger output all of the variables to the console via the " + chalk.yellow("--verbose") + " option."
  )
  await ui.pause(0.6)
  ui.say("- You can look at the following Dangerfiles to get some more ideas:")
  await ui.pause(0.6)
  // ui.link("https://github.com/danger/danger/blob/master/Dangerfile")
  // ui.link("https://github.com/artsy/eigen/blob/master/Dangerfile")
  await ui.pause(1)
}

const thanks = async (ui: InitUI, _state: InitState) => {
  ui.say("\n\n🎉")
  await ui.pause(0.6)

  ui.say(
    "And you're good to go. Danger is a collaboration between Orta Therox, Gem 'Danger' Maslen, and all the people."
  )
  ui.say(
    "If you like Danger, let others know. If you want to know more, follow " +
      chalk.yellow("@orta") +
      " and " +
      chalk.yellow("@DangerSystems") +
      " on Twitter."
  )
  ui.say("If you don't like something about Danger, help us improve the project - it's all volunteer time! xxx")
}

go()
