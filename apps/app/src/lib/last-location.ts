import { createBrowserHistory, createHashHistory } from '@tanstack/react-router'
import { type } from 'arktype'
import { createWebStorageValue } from 'seitu/web'

import { LAST_LOCATION_KEY } from './constants'

export const history =
  import.meta.env.VITE_TEST || !window.electron
    ? createBrowserHistory()
    : createHashHistory()

export const isAuthLocation = () =>
  history.location.pathname.startsWith('/auth')

export const lastLocationStorageValue = createWebStorageValue({
  defaultValue: null,
  key: LAST_LOCATION_KEY,
  schema: type('string | null'),
  type: 'localStorage',
})
