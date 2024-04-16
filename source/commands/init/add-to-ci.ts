import { InitUI, InitState, highlight } from "./interfaces"
import chalk from "chalk"

export const githubActions = async (ui: InitUI, state: InitState) => {
  if (!state.isAnOSSRepo) {
    ui.say("For your closed-source project, we can use the default GitHub Auth token for posting.")
    ui.pause(0.5)

    ui.say("You will want to add a new step in an existing workflow yaml file.")
    ui.pause(0.2)

    ui.say("The step should look like this:")
    ui.say("")
    ui.say("```yaml")
    ui.say(chalk.bold("    - name: Run Danger"))
    ui.say(chalk.bold("      run: yarn danger ci"))
    ui.say(chalk.bold("      env:"))
    ui.say(chalk.bold("        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}`"))
    ui.say("```")
    ui.say("")
    ui.pause(1)

    ui.say("This will run Danger on every PR, press return when you have added this to one of your workflows.")
    ui.waitForReturn()
    return
  }

  const link = ui.link("issue #918.", "https://github.com/danger/danger-js/issues/918")
  ui.say(
    `For your OSS project, there are a few options you can find in ${link}. We will continue with using the new GitHub user account here.`
  )
  ui.pause(0.5)

  ui.say("For your OSS project, you need to add a new secret to your workflow in a way that is slightly obfuscated.")
  ui.say("This is because GitHub Actions doesn't allow you to use the default GITHUB_TOKEN to update its own comments.")
  ui.pause(0.5)
  ui.say("This would make Danger very spammy on a Pull Request.")

  ui.pause(0.1)
  ui.say("To get started, add a new step in an existing workflow file.")
  ui.say("The step should look like this:")
  ui.say("")
  ui.say("```yaml")
  ui.say(
    chalk.bold(`)
    - name: Run Danger
      run: |
      # Exposing this token is safe because the user of it has no other public repositories
      # and has no permission to modify this repository.
      TOKEN='ghp_On3bHOkcV2AmVY6'
      TOKEN+='56186c3b09b4f86b1c65136769'
      DANGER_GITHUB_API_TOKEN=$TOKEN yarn danger ci`)
  )
  ui.say("```")
  ui.say("")
  ui.pause(1)

  ui.say("This will run Danger on every PR, press return when you have added this to one of your workflows.")
  ui.waitForReturn()
}

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

  ui.say("Next, you need to edit your `.travis.yml` to include `yarn danger ci`. If you already have")
  ui.say(
    "a `script:` section then we recommend adding this command at the end of the script step: `- yarn danger ci`.\n"
  )
  ui.say("Otherwise, add a `before_script` step to the root of the `.travis.yml` with `yarn danger ci`\n")

  ui.say(" ```yaml")
  ui.say("   before_script:")
  ui.say("     - yarn danger ci")
  ui.say(" ```\n")

  ui.say("Adding this to your `.travis.yml` allows Danger to fail your build.")
  ui.say("With that set up, you can edit your job to add `yarn danger ci` at the build action.")
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

  ui.say("With that set up, you can you add `yarn danger ci` to your `circle.yml`. If you override the default")
  ui.say("`test:` section, then add danger as an extra step. \nOtherwise add a new `pre` section to the test:\n")
  ui.say("  ``` ruby")
  ui.say("  test:")
  ui.say("    override:")
  ui.say("        - yarn danger ci")
  ui.say("  ```")
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
