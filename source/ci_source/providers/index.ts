import { AppCenter } from "./AppCenter"
import { Bamboo } from "./Bamboo"
import { BitbucketPipelines } from "./BitbucketPipelines"
import { Bitrise } from "./Bitrise"
import { BuddyBuild } from "./BuddyBuild"
import { BuddyWorks } from "./BuddyWorks"
import { Buildkite } from "./Buildkite"
import { Circle } from "./Circle"
import { Cirrus } from "./Cirrus"
import { CodeBuild } from "./CodeBuild"
import { Codefresh } from "./Codefresh"
import { Codeship } from "./Codeship"
import { Codemagic } from "./Codemagic"
import { Concourse } from "./Concourse"
import { DockerCloud } from "./DockerCloud"
import { Drone } from "./Drone"
import { FakeCI } from "./Fake"
import { GitHubActions } from "./GitHubActions"
import { GitLabCI } from "./GitLabCI"
import { Jenkins } from "./Jenkins"
import { Netlify } from "./Netlify"
import { Nevercode } from "./Nevercode"
import { Screwdriver } from "./Screwdriver"
import { Semaphore } from "./Semaphore"
import { Surf } from "./Surf"
import { TeamCity } from "./TeamCity"
import { Travis } from "./Travis"
import { VSTS } from "./VSTS"
import { XcodeCloud } from "./XcodeCloud"

const providers = [
  FakeCI,
  GitHubActions,
  GitLabCI,
  Travis,
  Circle,
  Semaphore,
  Nevercode,
  Jenkins,
  Surf,
  DockerCloud,
  Codeship,
  Drone,
  Buildkite,
  BuddyBuild,
  BuddyWorks,
  VSTS,
  Bitrise,
  TeamCity,
  Screwdriver,
  Concourse,
  Netlify,
  CodeBuild,
  Codefresh,
  AppCenter,
  BitbucketPipelines,
  Cirrus,
  Bamboo,
  Codemagic,
  XcodeCloud,
]

// Mainly used for Dangerfile linting
const realProviders = [
  GitHubActions,
  GitLabCI,
  Travis,
  Circle,
  Semaphore,
  Nevercode,
  Jenkins,
  Surf,
  DockerCloud,
  Codeship,
  Drone,
  Buildkite,
  BuddyBuild,
  BuddyWorks,
  VSTS,
  TeamCity,
  Screwdriver,
  Concourse,
  Netlify,
  CodeBuild,
  Codefresh,
  AppCenter,
  Cirrus,
  Bamboo,
  Codemagic,
  XcodeCloud,
]

export { providers, realProviders }
