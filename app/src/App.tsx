import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect } from 'react'
import { authClient } from './auth'

export default function App() {
  const { isPending, data } = authClient.useSession()

  useEffect(() => {
    onOpenUrl(async (urls) => {
      const token = urls[0]?.split('session?token=')[1]

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
        <a href="https://google.com" target="_blank">
          Google
        </a>
        {isPending ? 'Loading...' : data?.user.email || 'No user'}
      </header>
    </div>
  )
}
