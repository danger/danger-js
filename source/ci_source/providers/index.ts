import { AppCenter } from "./AppCenter"
import { Bitrise } from "./Bitrise"
import { BuddyBuild } from "./BuddyBuild"
import { BuddyWorks } from "./BuddyWorks"
import { Buildkite } from "./Buildkite"
import { Circle } from "./Circle"
import { CodeBuild } from "./CodeBuild"
import { Codefresh } from "./Codefresh"
import { Codeship } from "./Codeship"
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
import { BitbucketPipelines } from "./BitbucketPipelines"
import { Cirrus } from "./Cirrus"

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
  Cirrus
]

export { providers, realProviders }
