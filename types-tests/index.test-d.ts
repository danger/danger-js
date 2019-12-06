import { expectType, expectError } from "tsd"

// Make sure that yarn declarations has ran

import { danger } from "./."

expectType<string>(danger.github.pr.body)

expectError((danger.git.commits = ""))
