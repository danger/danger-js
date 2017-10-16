import { Platform } from "../platforms/platform"
import { DangerDSLJSONType } from "../dsl/DangerDSL"

export const dsLGenerator = async (platform: Platform): Promise<DangerDSLJSONType> => {
  const git = await platform.getPlatformGitRepresentation()
  const platformDSL = await platform.getPlatformDSLRepresentation()
  return {
    git,
    github: platformDSL,
  }
}
