import {Travis} from "./Travis"
import {Circle} from "./Circle"
import {Semaphore} from "./Semaphore"
import {Jenkins} from "./Jenkins"
import {FakeCI} from "./Fake"
import {Surf} from "./Surf"

const providers: Array<any> = [Travis, Circle, Semaphore, Jenkins, FakeCI, Surf]
export {
  providers
};
