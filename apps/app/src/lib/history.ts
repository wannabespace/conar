import { createBrowserHistory, createHashHistory } from '@tanstack/react-router'

export const history =
  import.meta.env.VITE_TEST || !window.electron
    ? createBrowserHistory()
    : createHashHistory()

export const isAuthLocation = () =>
  history.location.pathname.startsWith('/auth')
