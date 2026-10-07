import { useHotkey } from '@tanstack/react-hotkeys'
import { getRouteApi } from '@tanstack/react-router'

import { toggleLogger } from './logger-open'

const { useParams } = getRouteApi('/_protected/connection/$resourceId')

export const QueryLoggerHotkey = () => {
  const { resourceId } = useParams()

  useHotkey('Mod+J', (e) => {
    e.preventDefault()
    toggleLogger(resourceId)
  })

  return null
}
