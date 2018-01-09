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
]

// Mainly used for Dangerfile linting
const realProviders = [
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
]

export { providers, realProviders }
