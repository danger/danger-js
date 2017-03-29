import {Travis} from "./Travis"
import {Circle} from "./Circle"
import {Semaphore} from "./Semaphore"
import {Jenkins} from "./Jenkins"
import {FakeCI} from "./Fake"
import {Surf} from "./Surf"
import {DockerCloud} from "./DockerCloud"
import {Codeship} from "./Codeship"
import {Drone} from "./Drone"

const providers = [Travis, Circle, Semaphore, Jenkins, FakeCI, Surf, DockerCloud, Codeship, Drone]

// Mainly used for Dangerfile linting
const realProviders = [Travis, Circle, Semaphore, Jenkins, Surf, DockerCloud, Codeship, Drone]

export {
  providers,
  realProviders
}
