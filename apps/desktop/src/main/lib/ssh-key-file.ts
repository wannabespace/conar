import { homedir } from 'node:os'
import path from 'node:path'

import { pickFile } from './pick-file'

export const pickSshKeyFile = async () => {
  const filePath = await pickFile({
    buttonLabel: 'Choose',
    defaultPath: path.join(homedir(), '.ssh'),
    properties: ['openFile', 'showHiddenFiles'],
  })
  if (!filePath) {
    return null
  }
  return filePath.startsWith(`${homedir()}/`)
    ? `~${filePath.slice(homedir().length)}`
    : filePath
}
