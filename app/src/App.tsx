import { onOpenUrl } from '@tauri-apps/plugin-deep-link'
import { useEffect, useState } from 'react'
import { clerk } from './clerk'

export default function App() {
  const [user, setUser] = useState<string>()

  useEffect(() => {
    clerk.load()
    clerk.addListener((event) => {
      setUser(JSON.stringify(event.user))
    })
  }, [])

  useEffect(() => {
    onOpenUrl((urls) => {
      const session = urls[0]?.split('?session_id=')[1]

      if (session) {
        clerk.setActive({ session })
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
        {user}
      </header>
    </div>
  )
}
