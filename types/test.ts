// TypeScript Version: 2.2

import { danger, markdown } from "danger"

// $ExpectType DangerDSLType
danger

// $ExpectType GitDSL
danger.git

// $ExpectType string[]
danger.git.created_files

// $ExpectType Github
danger.github.api

// $ExpectType GitHubPRDSL
danger.github.pr

// $ExpectType (array: string[]) => string
danger.utils.sentence
