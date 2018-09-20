import debugModule from "debug"

export const debug = (value: string) => {
  const d = debugModule(`danger:${value}`)
  // In Peril, when running inside Hyper, we don't get access to stderr
  // so bind debug to use stdout
  if (process.env.x_hyper_content_sha256) {
    d.log = console.log.bind(console)
  }
  return d
}
