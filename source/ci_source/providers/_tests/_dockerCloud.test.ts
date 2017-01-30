import {DockerCloud} from "../DockerCloud"

const correctEnv = {
  "DOCKER_REPO": "someproject",
  "PULL_REQUEST_URL": "https://github.com/artsy/eigen/pull/800",
  "SOURCE_REPOSITORY_URL": "https://github.com/artsy/eigen"
}

describe(".isCI", () => {
  it("validates when all DockerCloud environment vars are set", () => {
    const dockerCloud = new DockerCloud(correctEnv)
    expect(dockerCloud.isCI).toBeTruthy()
  })

  it("does not validate without env", () => {
    const dockerCloud = new DockerCloud({})
    expect(dockerCloud.isCI).toBeFalsy()
  })
})

describe(".isPR", () => {
  it("validates when all dockerCloud environment vars are set", () => {
    const dockerCloud = new DockerCloud(correctEnv)
    expect(dockerCloud.isPR).toBeTruthy()
  })

  it("does not validate outside of dockerCloud", () => {
    const dockerCloud = new DockerCloud({})
    expect(dockerCloud.isPR).toBeFalsy()
  })

  const envs = ["PULL_REQUEST_URL", "SOURCE_REPOSITORY_URL", "DOCKER_REPO"]
  envs.forEach((key: string) => {
    let env = {
      "DOCKER_REPO": "someproject",
      "PULL_REQUEST_URL": "https://github.com/artsy/eigen/pull/800",
      "SOURCE_REPOSITORY_URL": "https://github.com/artsy/eigen"
    }
    env[key] = null

    it(`does not validate when ${key} is missing`, () => {
      const dockerCloud = new DockerCloud({})
      expect(dockerCloud.isPR).toBeFalsy()
    })
  })
})

describe(".pullRequestID", () => {
  it("pulls it out of the env", () => {
    const dockerCloud = new DockerCloud({
      "PULL_REQUEST_URL": "https://github.com/artsy/eigen/pull/800"
    })
    expect(dockerCloud.pullRequestID).toEqual("800")
  })
})

describe(".repoSlug", () => {
  it("derives it from the PR Url", () => {
    const dockerCloud = new DockerCloud(correctEnv)
    expect(dockerCloud.repoSlug).toEqual("artsy/eigen")
  })
})
