import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { authClient } from './auth'
// import { getRecord } from './stronghold'

// setTimeout(async () => {
//   console.log(await getRecord('connnect.bearer_token'))
// }, 2000)

export default function App() {
  const { isPending, data } = authClient.useSession()

  useEffect(() => {
    onOpenUrl(async ([url]) => {
      const [, token] = url?.split('session?token=')

      if (token) {
        localStorage.setItem('connnect.bearer_token', token)
        location.reload()
      }
    })
  }, [])

  return (
    <div>
      <div data-tauri-drag-region className="titlebar"></div>
      <header>
        {isPending ? 'Loading...' : data?.user.email || 'No user'}
      </header>
      <button onClick={() => {
        localStorage.removeItem('connnect.bearer_token')
        location.reload()
      }}
      >
        Remove
      </button>
    </div>
  )
}
