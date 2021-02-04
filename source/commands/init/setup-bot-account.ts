import { InitUI, InitState, highlight } from "./interfaces"
import { noteAboutClickingLinks } from "./common-setup"

export const setupUnknownRepoProvider = async (ui: InitUI) => {
  ui.say("In order to get the most out of Danger, I'd recommend giving it the ability to post in")
  ui.say("the code-review comment section.")

  ui.say("Unfortunately we are unable to tell what type of repo provider this is.")
}

export const setupAzureDevopsAccount = async (ui: InitUI, state: InitState) => {
  ui.header("Step 2: Give Azure Devops to update")

  ui.say("In order to get the most out of Danger, I'd recommend giving it the ability to post in")
  ui.say("the code-review comment section.")
  ui.say("Unfortunately, these types of users required directly go into your pricing.")
  ui.say(
    "\n" +
      ui.link(
        "Azure Devops Services pricing",
        "https://azure.microsoft.com/en-us/pricing/details/devops/azure-devops-services/"
      ) +
      "\n"
  )

  await ui.pause(1)

  noteAboutClickingLinks(ui, state)
  await ui.pause(1)

  ui.say("Here are your current options to accomodate these pricing constraints")
  ui.say("1. (pricing friendly) Use an existing user with a provisioned PAT token to post in PRs")
  ui.say("2. (ideal) Create a new basic user with a provisioned PAT token o post in PRs")
  ui.say("3. Use OAuth access via Azure Devops to handle PRs")
  ui.say("Regardless you need to setup a PAT token")
}

export const setupGithubAccount = async (ui: InitUI, state: InitState) => {
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
