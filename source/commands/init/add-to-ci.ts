import { InitState, InitUI, highlight } from "../danger-init"

export const travis = async (ui: InitUI, state: InitState) => {
  // https://travis-ci.org/artsy/eigen/settings

  if (state.repoSlug) {
    const travisLink = ui.link(
      `Travis Settings for ${state.repoSlug}`,
      `https://travis-ci.org/${state.repoSlug}/settings`
    )
    ui.say("In order to add the environment variable, go to: " + travisLink)
  } else {
    const travisLink = ui.link("Travis Account profile", "https://travis-ci.org/profile/")
    ui.say("In order to add the environment variable, go to: " + travisLink)
    ui.say("And find the project for this repo, click the settings cog.")
  }

  ui.say(
    "The variable name is " +
      highlight("DANGER_GITHUB_API_TOKEN") +
      " and the value is the GitHub Personal Access Token you just created."
  )
  if (state.isAnOSSRepo) {
    ui.say('As you have an OSS repo - make sure to have "Display value in build log" enabled.')
  }
}

export const circle = async (ui: InitUI, state: InitState) => {
  // https://circleci.com/gh/artsy/eigen/edit#env-vars
  const repo = state.repoSlug || "[Your_Repo]"
  if (state.isAnOSSRepo) {
    ui.say(
      "Before we start, it's important to be up-front. CircleCI only really has one option to support running Danger"
    )
    ui.say(
      "for forks on OSS repos. It is quite a drastic option, and I want to let you know the best place to understand"
    )
    ui.say("the ramifications of turning on a setting I'm about to advise.\n")
    ui.link("Circle CI: Fork PR builds", "https://circleci.com/docs/fork-pr-builds")
    ui.say(
      "TLDR: If you have anything other than Danger config settings in CircleCI, then you should not turn on this setting."
    )
    ui.say("I'll give you a minute to read it...")
    ui.waitForReturn()

    ui.say(
      "On danger/danger we turn on " +
        highlight("Permissive building of fork pull requests") +
        " this exposes the token to Danger"
    )
    const circleSettings = ui.link("Circle Settings", `https://circleci.com/gh/${repo}/edit#advanced-settings`)
    ui.say(`You can find this setting at: ${circleSettings}.`)
    ui.say("I'll hold...")
    ui.waitForReturn()
  }

  const circleSettings = ui.link("Circle Env Settings", `https://circleci.com/gh/${repo}/edit#env-vars`)
  ui.say(`In order to expose the environment variable, go to: ${circleSettings}`)

  ui.say("The name is " + highlight("DANGER_GITHUB_API_TOKEN") + " and the value is the GitHub Personal Access Token.")
}

export const unsure = async (ui: InitUI, _state: InitState) => {
  ui.say(
    "You need to expose a token called " +
      highlight("DANGER_GITHUB_API_TOKEN") +
      " and the value is the GitHub Personal Access Token."
  )
  ui.say(
    "Depending on the CI system, this may need to be done on the machine (in the " +
      highlight("~/.bashprofile") +
      ") or in a web UI somewhere."
  )
  ui.say("We have a guide for all supported CI systems on danger.systems:")
  ui.say(
    ui.link(
      "Danger Systems - Getting Started",
      "http://danger.systems/js/guides/getting_started.html#setting-up-danger-to-run-on-your-ci"
    )
  )
}
