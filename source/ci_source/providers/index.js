// @flow

import Travis from "./Travis"
import Circle from "./Circle"
import Semaphore from "./Semaphore"
import Jenkins from "./Jenkins"
import Fake from "./Fake"

const providers: Array<any> = [Travis, Circle, Semaphore, Jenkins, Fake]
export default providers
