import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

export class GitLabCI implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "GitLab CI"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CI_MR_ID"])
  }

  get isPR(): boolean {
    const mustHave = ["CI_MR_ID", "CI_PROJECT_PATH"]
    const mustBeInts = ["CI_MR_ID"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.CI_MR_ID
  }

  get repoSlug(): string {
    return this.env.CI_PROJECT_PATH
  }
}

// See https://docs.gitlab.com/ee/ci/variables/
//
// export CI_JOB_ID="50"
// export CI_COMMIT_SHA="1ecfd275763eff1d6b4844ea3168962458c9f27a"
// export CI_COMMIT_SHORT_SHA="1ecfd275"
// export CI_COMMIT_REF_NAME="master"
// export CI_REPOSITORY_URL="https://gitlab-ci-token:abcde-1234ABCD5678ef@example.com/gitlab-org/gitlab-ce.git"
// export CI_COMMIT_TAG="1.0.0"
// export CI_JOB_NAME="spec:other"
// export CI_JOB_STAGE="test"
// export CI_JOB_MANUAL="true"
// export CI_JOB_TRIGGERED="true"
// export CI_JOB_TOKEN="abcde-1234ABCD5678ef"
// export CI_PIPELINE_ID="1000"
// export CI_PIPELINE_IID="10"
// export CI_PAGES_DOMAIN="gitlab.io"
// export CI_PAGES_URL="https://gitlab-org.gitlab.io/gitlab-ce"
// export CI_PROJECT_ID="34"
// export CI_PROJECT_DIR="/builds/gitlab-org/gitlab-ce"
// export CI_PROJECT_NAME="gitlab-ce"
// export CI_PROJECT_NAMESPACE="gitlab-org"
// export CI_PROJECT_PATH="gitlab-org/gitlab-ce"
// export CI_PROJECT_URL="https://example.com/gitlab-org/gitlab-ce"
// export CI_REGISTRY="registry.example.com"
// export CI_REGISTRY_IMAGE="registry.example.com/gitlab-org/gitlab-ce"
// export CI_RUNNER_ID="10"
// export CI_RUNNER_DESCRIPTION="my runner"
// export CI_RUNNER_TAGS="docker, linux"
// export CI_SERVER="yes"
// export CI_SERVER_NAME="GitLab"
// export CI_SERVER_REVISION="70606bf"
// export CI_SERVER_VERSION="8.9.0"
// export CI_SERVER_VERSION_MAJOR="8"
// export CI_SERVER_VERSION_MINOR="9"
// export CI_SERVER_VERSION_PATCH="0"
// export GITLAB_USER_ID="42"
// export GITLAB_USER_EMAIL="user@example.com"
// export CI_REGISTRY_USER="gitlab-ci-token"
// export CI_REGISTRY_PASSWORD="longalfanumstring"
