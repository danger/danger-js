import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"
/**
 * ### CI Setup
 *
 * <!-- JS --!>
 *  You need to edit your `.travis.yml` to include `[run_command]`. If you already have
 *  a `script:` section then we recommend adding this command at the end of the script step: `- [run_command]`.
 *
 *   Otherwise, add a `before_script` step to the root of the `.travis.yml` with `[run_command]`
 *
 *   ```ruby
 *     before_script:
 *       - yarn danger ci
 *   ```
 *
 *  Adding this to your `.travis.yml` allows Danger to fail your build, both on the TravisCI website and within your Pull Request.
 *  With that set up, you can edit your job to add `[run_command]` at the build action.
 * <!-- !JS --!>
 * <!-- Swift --!>
 *
 *  Here's an example of the optimal travis setup, handling caching correctly:
 *
 *  ```yml
 *   os: osx
 *   osx_image: xcode10.1
 *
 *   cache:
 *     directories:
 *     # General SwiftPM
 *     # Danger Swift plugins, like Yams
 *     - .build
 *     - ~/.danger-swift
 *
 *   install:
 *     # Grab the latest Danger JS from npm
 *     - npm install -g danger
 *     # Compile the Danger runtime
 *     - swift build
 *
 *   script:
 *     # Run the Dangerfile.swift
 *     - swift run danger-swift ci
 *     # Test my app...
 *     - [your other commands]
 *  ```
 *
 * <!-- !Swift --!>
 *
 *  ### Token Setup
 *
 *  You need to add the `DANGER_GITHUB_API_TOKEN` environment variable, to do this,
 *  go to your repo's settings, which should look like: `https://travis-ci.org/[user]/[repo]/settings`.
 *
 *  If you have an open source project, you should ensure "Display value in build log" enabled, so that PRs from forks work.
 */
export class Travis implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Travis CI"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["HAS_JOSH_K_SEAL_OF_APPROVAL"])
  }

  get isPR(): boolean {
    const mustHave = ["HAS_JOSH_K_SEAL_OF_APPROVAL", "TRAVIS_PULL_REQUEST", "TRAVIS_REPO_SLUG"]
    const mustBeInts = ["TRAVIS_PULL_REQUEST"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.TRAVIS_PULL_REQUEST
  }

  get repoSlug(): string {
    return this.env.TRAVIS_REPO_SLUG
  }

  get ciRunURL() {
    // TODO: This only supports travis.org
    return `https://travis-ci.org/${this.env.TRAVIS_REPO_SLUG}/jobs/${this.env.TRAVIS_JOB_ID}`
  }
}

// See end of https://travis-ci.org/danger/danger-js/jobs/317790046
//
//  TRAVIS="true"
//  TRAVIS_ALLOW_FAILURE="false"
//  TRAVIS_BRANCH="env_improve"
//  TRAVIS_BUILD_DIR="/home/travis/build/danger/danger-js"
//  TRAVIS_BUILD_ID="317790044"
//  TRAVIS_BUILD_NUMBER="1840"
//  TRAVIS_COMMIT="b8a4f70062810274ee8ae155b2bbe4d0b4e0ddf4"
//  TRAVIS_COMMIT_MESSAGE="[Env] Start work on improving the status message"
//  TRAVIS_COMMIT_RANGE="1469195a5f86...b8a4f7006281"
//  TRAVIS_EVENT_TYPE="push"
//  TRAVIS_JOB_ID="317790046"
//  TRAVIS_JOB_NUMBER="1840.2"
//  TRAVIS_LANGUAGE="node_js"
//  TRAVIS_NODE_VERSION="8"
//  TRAVIS_OS_NAME="linux"
//  TRAVIS_PRE_CHEF_BOOTSTRAP_TIME="2017-12-05T19:33:30"
//  TRAVIS_PULL_REQUEST="false"
//  TRAVIS_PULL_REQUEST_BRANCH=""
//  TRAVIS_PULL_REQUEST_SHA=""
//  TRAVIS_PULL_REQUEST_SLUG=""
//  TRAVIS_REPO_SLUG="danger/danger-js"
//  TRAVIS_SECURE_ENV_VARS="false"
//  TRAVIS_STACK_FEATURES="basic cassandra chromium couchdb disabled-ipv6 docker docker-compose elasticsearch firefox go-toolchain google-chrome jdk //  neo4j nodejs_interpreter perl_interpreter perlbrew phantomjs postgresql python_interpreter rabbitmq redis riak ruby_interpreter sqlite //  TRAVIS_STACK_JOB_BOARD_REGISTER="/.job-board-register.yml"
//  TRAVIS_STACK_LANGUAGES="__garnet__ c c++ clojure cplusplus cpp default go groovy java node_js php pure_java python ruby scala"
//  TRAVIS_STACK_NAME="garnet"
//  TRAVIS_STACK_NODE_ATTRIBUTES="/.node-attributes.yml"
//  TRAVIS_STACK_TIMESTAMP="2017-12-05 19:33:46 UTC"
//  TRAVIS_SUDO="false"
//  TRAVIS_TAG=""
//  TRAVIS_TEST_RESULT="0"
//  TRAVIS_UID="2000"
