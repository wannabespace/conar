// import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { useCookie } from 'react-use'
import { authClient } from './auth'

export default function App() {
  const session = authClient.useSession()
  const [, setToken] = useCookie('connnect.session')

  useEffect(() => {
    // onOpenUrl(async (urls) => {
    //   const token = urls[0]?.split('session?session_token=')[1]
    // })

    setToken('dILsyDUnBVWNcJRBudQuFHWKpJdfzbrU.GKTZ5TDq3pbKrbiUkVyBJyny2bM7hJIvhaG%2B6I2XFi4%3D')

    ;(async () => {
      // const session = await authClient.getSession({
      //   query: {
      //     disableCookieCache: true,
      //   },
      // })

      // console.log(session)
    })()
  }, [])

  return (
    <div>
      <div data-tauri-drag-region className="titlebar"></div>
      <header>
        <a href="https://google.com" target="_blank">
          Google
        </a>
        {session.data?.user.email || 'No user'}
      </header>
    </div>
  )
}
