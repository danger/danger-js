import * as program from "commander"
import * as chalk from "chalk"

import * as fs from "fs"

program
  .description("Helps you get set up through to your first Danger.")
  .option("-i, --impatient", "Don't add dramatic pauses.")
  .option("-d, --defaults", "Always take the default action.")

interface InitUI {
  header: (msg: String) => void
  say: (msg: String) => void
  pause: (secs: number) => void
  waitForReturn: () => void
  link: (name: string, href: string) => string
  askWithAnswers: (message: string, answers: string[]) => string
}

interface State {
  hasSetUpAccount: boolean
  filename: string
  botName: string
  isAnOSSRepo: boolean
  isWindows: boolean
  isMac: boolean
  supportsHLinks: boolean
}

// const mainUI = {
//   header: (msg: String) => {},
//   say: (msg: String) => {},
//   pause: (secs: number) => {},
// }

// re: link
// echo -e '\e]8;;http://example.com\aThis is a link\e]8;;\a'
//

const checkForTypeScript = () => fs.readFileSync("node_modules/typescript/package.json")
const checkForBabel = () =>
  fs.readFileSync("node_modules/babel-core/package.json") || fs.readFileSync("node_modules/@babel/core/package.json")

const generateInitialState = (): State => {
  const isMac = process.platform === "darwin"
  const isWindows = process.platform === "win32"
  const isIterm = process.env["ITERM_SESSION_ID"] !== undefined
  const isVTE = false
  return {
    isMac,
    isWindows,
    supportsHLinks: isIterm || isVTE,
    isAnOSSRepo: false, // Not asked yet
    filename: checkForTypeScript() ? "Dangerfile.ts" : "Dangerfile.js",
    botName: "",
    hasSetUpAccount: false,
  }
}

const initialState = generateInitialState()

const showTodoState = (ui: InitUI, state: State) => {
  ui.say("We need to do the following:\n")
  ui.pause(0.6)
  ui.say(" - [ ] Create a Dangerfile and add a few simple rules.")
  ui.pause(0.6)
  ui.say(` - [${state.hasSetUpAccount ? "x" : " "}] Create a GitHub account for Danger to use, for messaging.`)
  ui.pause(0.6)
  ui.say(" - [ ] Set up an access token for Danger.")
  ui.pause(0.6)
  ui.say(" - [ ] Set up Danger to run on your CI.\n\n")
}

const setupDangerfile = (ui: InitUI, state: State) => {
  ui.header("Step 1: Creating a starter Dangerfile")
  ui.say("I've set up an example Dangerfile for you in this folder.\n")
  ui.pause(1)

  const content = "default dangerfile"
  // File.write("Dangerfile", content)

  ui.header("Step 1: Creating a starter Dangerfile")
  ui.say("I've set up an example Dangerfile for you in this folder.\n")
  ui.pause(1)

  ui.say(`cat ${process.cwd()}/${state.filename}\n`)
  content.split("\n").forEach(l => ui.say(`  ` + chalk.green(l)))
  ui.say("")
  ui.pause(2)

  ui.say("There's a collection of small, simple ideas in here, but Danger is about being able to easily")
  ui.say("iterate. The power comes from you having the ability to codify fixes for some of the problems")
  ui.say("that come up in day to day programming. It can be difficult to try and see those from day 1.")

  ui.say("\nIf you'd like to investigate the file, and make some changes - I'll wait here,")
  ui.say("press return when you're ready to move on...")
  ui.waitForReturn()
}

const setupGitHubAccount = (ui: InitUI, state: State) => {
  ui.header("Step 2: Creating a GitHub account")

  ui.say("In order to get the most out of Danger, I'd recommend giving her the ability to post in")
  ui.say("the code-review comment section.\n\n")
  ui.pause(1)

  ui.say("IMO, it's best to do this by using the private mode of your browser. Create an account like")
  ui.say(`${state.botName}, and don't forget a cool robot avatar.\n\n`)
  ui.pause(1)
  ui.say("Here are great resources for creative commons images of robots:")
  const flickr = ui.link("flickr", "https://www.flickr.com/search/?text=robot&license=2%2C3%2C4%2C5%2C6%2C9")
  const googImages = ui.link(
    "googleimages",
    "https://www.google.com/search?q=robot&tbs=sur:fmc&tbm=isch&tbo=u&source=univ&sa=X&ved=0ahUKEwjgy8-f95jLAhWI7hoKHV_UD00QsAQIMQ&biw=1265&bih=1359"
  )
  ui.pause(1)

  if (state.isAnOSSRepo) {
    ui.say(`${state.botName} does not need privileged access to your repo or org. This is because Danger will only`)
    ui.say("be writing comments, and you do not need special access for that.")
  } else {
    ui.say(`${state.botName} will need access to your repo. Simply because the code is not available for the public`)
    ui.say("to read and comment on.")
  }

  ui.say("")
  // note_about_clicking_links
  ui.pause(1)
  ui.say("\nCool, please press return when you have your account ready (and you've verified the email...)")
  ui.waitForReturn()
}

const stepThree = (ui: InitUI, state: State) => {
  ui.header("Step 3: Configuring a GitHub Personal Access Token")

  ui.say("Here's the link, you should open this in the private session where you just created the new GitHub account")
  ui.link("New GitHub Token", "https://github.com/settings/tokens/new")
  ui.pause(1)

  state.isAnOSSRepo =
    ui.askWithAnswers(
      "For token access rights, I need to know if this is for an Open Source or Closed Source project\n",
      ["Open", "Closed"]
    ) === "Open"

  if (state.isAnOSSRepo) {
    ui.say("For Open Source projects, I'd recommend giving the token the smallest scope possible.")
    ui.say("This means only providing access to " + "public_repo".yellow + " in the token.\n\n")
    ui.pause(1)
    ui.say("This token limits Danger's abilities to just writing comments on OSS projects. I recommend")
    ui.say("this because the token can quite easily be extracted from the environment via pull requests.")

    ui.say(
      "\nIt is important that you do not store this token in your repository, as GitHub will automatically revoke it when pushed.\n"
    )
  } else {
    ui.say("For Closed Source projects, I'd recommend giving the token access to the whole repo scope.")
    ui.say("This means only providing access to " + "repo".yellow + ", and its children in the token.\n\n")
    ui.pause(1)
    ui.say("It's worth noting that you " + "should not".bold.white + " re-use this token for OSS repos.")
    ui.say("Make a new one for those repos with just " + "public_repo".yellow + ".")
    ui.pause(1)
    ui.say("Additionally, don't forget to add your new GitHub account as a collaborator to your Closed Source project.")
  }

  ui.say("\n👍, please press return when you have your token set up...")
  ui.waitForReturn()
}

const noteAboutClickingLinks = (ui: InitUI, state: State) => {
  const modifier_key = state.isMac ? "cmd ( ⌘ )" : "ctrl"
  const clicks = state.isWindows ? "clicking" : "double clicking"

  ui.say(`Note: Holding ${modifier_key} and ${clicks} a link will open it in your browser.`)
}

const noteAboutClickingLinks = (ui: InitUI, state: State) => {
  ui.header("Useful info")
  ui.say("- One of the best ways to test out new rules locally is via " + "bundle exec danger pr".yellow + ".")
  ui.pause(0.6)
  ui.say("- You can have Danger output all of her variables to the console via the " + "--verbose".yellow + " option.")
  ui.pause(0.6)
  ui.say("- You can look at the following Dangerfiles to get some more ideas:")
  ui.pause(0.6)
  // ui.link("https://github.com/danger/danger/blob/master/Dangerfile")
  // ui.link("https://github.com/artsy/eigen/blob/master/Dangerfile")
  ui.pause(1)
}

const thanks = (ui: InitUI, state: State) => {
  ui.say("\n\n🎉")
  ui.pause(0.6)

  ui.say(
    "And you're good to go. Danger is a collaboration between Orta Therox, Gem 'Danger' Maslen, and all the people."
  )
  ui.say(
    "If you like Danger, let others know. If you want to know more, follow " +
      "@orta".yellow +
      " and " +
      "@KrauseFx".yellow +
      " on Twitter."
  )
  ui.say("If you don't like something about Danger, help us improve the project - it's all volunteer time! xxx")
}
