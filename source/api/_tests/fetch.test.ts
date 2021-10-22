import * as http from "http"

import { api } from "../fetch"

interface ResponseMock {
  body?: any
  statusCode?: number
  contentType?: string
}

class TestServer {
  private port = 30001
  private hostname = "localhost"
  private response: ResponseMock = null as any
  private router = (_req: any, res: any) => {
    res.statusCode = this.response && this.response.statusCode ? this.response.statusCode : 200
    res.setHeader(
      "Content-Type",
      this.response && this.response.contentType ? this.response.contentType : "application/json"
    )
    res.end(this.response ? this.response.body : null)
  }
  private server = http.createServer(this.router)

  start = async (response: ResponseMock): Promise<void> => {
    this.response = response
    return new Promise<void>((resolve, reject) => {
      this.server.listen(this.port, this.hostname, (err: any) => (err ? reject(err) : resolve()))
    })
  }
  stop = async (): Promise<void> => {
    this.response = null as any
    return new Promise<void>((resolve, reject) => {
      this.server.close((err: any) => (err ? reject(err) : resolve()))
    })
  }
}

class TestProxy {
  isRunning = false
  private port = 30002
  private hostname = "localhost"
  private router = (_req: any, res: any) => {
    res.statusCode = 200
    res.end(null)
  }
  private server = http.createServer(this.router)

  start = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      this.isRunning = true
      this.server.listen(this.port, this.hostname, (err: any) => (err ? reject(err) : resolve()))
    })
  }
  stop = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      this.isRunning = false
      this.server.close((err: any) => (err ? reject(err) : resolve()))
    })
  }
}

describe("fetch", () => {
  let url: string
  let server = new TestServer()
  let proxy = new TestProxy()

  beforeEach(() => {
    url = "http://localhost:30001/"
  })

  afterEach(async () => {
    await server.stop()

    if (proxy.isRunning) {
      await proxy.stop()
    }
  })

  it("handles json success", async () => {
    let body = { key: "valid json" }
    await server.start({
      body: JSON.stringify(body),
    })

    let response = await api(url, {})
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject(body)
  })

  it("handles json error", async () => {
    let body = { key: "valid json" }
    await server.start({
      body: JSON.stringify(body),
      statusCode: 500,
    })

    let response = await api(url, {})
    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject(body)
  })

  it("handles plain text error", async () => {
    let body = "any plain text response"
    await server.start({
      body: body,
      statusCode: 500,
      contentType: "text/plain",
    })

    let response = await api(url, {})
    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
    expect(await response.text()).toBe(body)
  })
})
