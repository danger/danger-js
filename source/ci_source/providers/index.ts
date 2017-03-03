import {Travis} from "./Travis"
import {Circle} from "./Circle"
import {Semaphore} from "./Semaphore"
import {Jenkins} from "./Jenkins"
import {FakeCI} from "./Fake"
import {Surf} from "./Surf"
import {DockerCloud} from "./DockerCloud"
import {Codeship} from "./Codeship"
import {BuddyBuild} from "./BuddyBuild"

const providers: Array<any> = [Travis, Circle, Semaphore, Jenkins, FakeCI, Surf, DockerCloud, Codeship, BuddyBuild]
export {
  providers
};
