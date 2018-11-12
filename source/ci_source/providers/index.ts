import { Bitrise } from "./Bitrise"
import { BuddyBuild } from "./BuddyBuild"
import { Buildkite } from "./Buildkite"
import { Circle } from "./Circle"
import { Codeship } from "./Codeship"
import { Concourse } from "./Concourse"
import { DockerCloud } from "./DockerCloud"
import { Drone } from "./Drone"
import { FakeCI } from "./Fake"
import { GitHubActions } from "./GitHubActions"
import { Jenkins } from "./Jenkins"
import { Netlify } from "./Netlify"
import { Nevercode } from "./Nevercode"
import { Screwdriver } from "./Screwdriver"
import { Semaphore } from "./Semaphore"
import { Surf } from "./Surf"
import { TeamCity } from "./TeamCity"
import { Travis } from "./Travis"
import { VSTS } from "./VSTS"

const providers = [
  GitHubActions,
  Travis,
  Circle,
  Semaphore,
  Nevercode,
  Jenkins,
  FakeCI,
  Surf,
  DockerCloud,
  Codeship,
  Drone,
  Buildkite,
  BuddyBuild,
  VSTS,
  Bitrise,
  TeamCity,
  Screwdriver,
  Concourse,
  Netlify,
]

// Mainly used for Dangerfile linting
const realProviders = [
  GitHubActions,
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
  VSTS,
  TeamCity,
  Screwdriver,
  Concourse,
  Netlify,
]

export { providers, realProviders }
