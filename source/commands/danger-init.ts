#! /usr/bin/env node

import chalk from "chalk"
import * as program from "commander"

import * as fs from "fs"

import { generateDefaultDangerfile } from "./init/default-dangerfile"
import { travis, circle, unsure } from "./init/add-to-ci"
import { generateInitialState, createUI } from "./init/state-setup"
import { InitUI, InitState, highlight } from "./init/interfaces"

program
  .description("Helps you get set up through to your first Dangerfile.")
  .option("-i, --impatient", "Don't add dramatic pauses.")

  .on("--help", () => {
    console.log("\n")
    console.log("  Docs:")
    console.log("")
    console.log("    -> Getting started:")
    console.log("       http://danger.systems/js/guides/getting_started.html")
  })

program.parse(process.argv)

interface App {
  impatient: boolean
}

const app: App = program as any

const go = async (app: App) => {
  const state = generateInitialState(process)
  const ui: InitUI = createUI(state, app)

  if (!state.isGitHub) {
    return showNonGitHubWarning(ui)
  }

  const { isOSS } = await showTodoState(ui)
  state.isAnOSSRepo = isOSS

  await setupDangerfile(ui, state)
  await setupGitHubAccount(ui, state)
  await setupGHAccessToken(ui, state)
  await addToCI(ui, state)
  await wrapItUp(ui, state)
  await thanks(ui, state)
}

const showNonGitHubWarning = (ui: InitUI) => {
  ui.say("Hi, welcome to Danger Init - I'm afraid at the moment this command only works for GitHub projects.")
  ui.say("\nWe're definitely open to PRs improving this. You can find the code at:")
  const link = ui.link(
    "danger/danger-js#/source/commands/danger-init.ts",
    "https://github.com/danger/danger-js/blob/master/source/commands/danger-init.ts"
  )
  ui.say("\n > " + link + "\n")
}

const showTodoState = async (ui: InitUI) => {
  ui.say("Welcome to Danger Init - this will take you through setting up Danger for this project.")
  ui.say("There are four main steps we need to do:\n")
  await ui.pause(0.6)
  ui.say(` - [ ] Create a Dangerfile and add a few simple rules.`)
  await ui.pause(0.6)
  ui.say(` - [ ] Create a GitHub account for Danger to use, for messaging.`)
  await ui.pause(0.6)
  ui.say(` - [ ] Set up an access token for Danger.`)
  await ui.pause(0.6)
  ui.say(" - [ ] Set up Danger to run on your CI.\n")

  await ui.pause(2)
  ui.say(`But before we start, we need one bit of information from you.`)
  ui.say("Is this is for an Open Source or private project?")

  // TODO: Check for this via the API instead?
  const isOSS = ui.askWithAnswers("", ["Open Source", "Private Repo"]) === "Open Source"
  return { isOSS }
}

const setupDangerfile = async (ui: InitUI, state: InitState) => {
  ui.header("Step 1: Creating a starter Dangerfile")

  if (!fs.existsSync("dangerfile.js") && !fs.existsSync("dangerfile.ts")) {
    ui.say("\nI've set up an example Dangerfile for you in this folder.\n")
    await ui.pause(1)

    const content = generateDefaultDangerfile(state)
    fs.writeFileSync(state.filename, content, "utf8")

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

  if (state.isAnOSSRepo) {
    ui.say("\nFor Open Source projects, I'd recommend giving the token the smallest scope possible.")
    ui.say("This means only providing access to " + highlight("public_repo") + " in the token.")
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
    ui.say("\nFor private projects, I'd recommend giving the token access to the whole repo scope.")
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

const addToCI = async (ui: InitUI, state: InitState) => {
  ui.header("Add to CI")

  await ui.pause(0.6)
  if (state.ciType === "travis") {
    await travis(ui, state)
  } else if (state.ciType === "circle") {
    await circle(ui, state)
  } else {
    await unsure(ui, state)
  }
}

const thanks = async (ui: InitUI, _state: InitState) => {
  ui.say("\n\n🎉\n")
  await ui.pause(0.6)

  ui.say("And you're good to go. Danger is a collaboration between Orta Therox, Gem 'Danger' Maslen,")
  ui.say("and every who has sent PRs.\n")
  ui.say(
    "If you like Danger, let others know. If you want to know more, follow " +
      highlight("@orta") +
      " and " +
      highlight("@DangerSystems") +
      " on Twitter."
  )
  ui.say("If you don't like something about Danger, help us improve the project - it's all done on volunteer time! xxx")
  ui.say("Remember: it's nice to be nice.\n")
}

go(app)
