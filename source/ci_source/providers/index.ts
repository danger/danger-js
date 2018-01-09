import { BuddyBuild } from "./BuddyBuild"
import { Buildkite } from "./Buildkite"
import { Circle } from "./Circle"
import { Codeship } from "./Codeship"
import { DockerCloud } from "./DockerCloud"
import { Drone } from "./Drone"
import { FakeCI } from "./Fake"
import { Jenkins } from "./Jenkins"
import { Nevercode } from "./Nevercode"
import { Semaphore } from "./Semaphore"
import { Surf } from "./Surf"
import { Travis } from "./Travis"
import { VSTS } from "./VSTS"

const providers = [
  BuddyBuild,
  Buildkite,
  Circle,
  Codeship,
  DockerCloud,
  Drone,
  FakeCI,
  Jenkins,
  Nevercode,
  Semaphore,
  Surf,
  Travis,
  VSTS,
]

// Mainly used for Dangerfile linting
const realProviders = [
  BuddyBuild,
  Buildkite,
  Circle,
  Codeship,
  DockerCloud,
  Drone,
  Jenkins,
  Nevercode,
  Semaphore,
  Surf,
  Travis,
  VSTS,
]

export { providers, realProviders }
