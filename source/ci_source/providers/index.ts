import {Travis} from "./Travis"
import {Circle} from "./Circle"
import {Semaphore} from "./Semaphore"
import {Jenkins} from "./Jenkins"
import {FakeCI} from "./Fake"
import {Surf} from "./Surf"
import {DockerCloud} from "./DockerCloud"

const providers: Array<any> = [Travis, Circle, Semaphore, Jenkins, FakeCI, Surf, DockerCloud]
export {
  providers
};
