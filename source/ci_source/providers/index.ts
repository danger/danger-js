import { Bitrise } from "./Bitrise"
import { BuddyBuild } from "./BuddyBuild"
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
  FakeCI,
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
  Bitrise,
  TeamCity,
  Screwdriver,
  Concourse,
  Netlify,
  CodeBuild,
  Codefresh,
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
  CodeBuild,
  Codefresh,
]

export { providers, realProviders }
