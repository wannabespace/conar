'use client'

import dynamic from 'next/dynamic'

const App = dynamic(() => import('../../../app/src/renderer/src/App'), { ssr: false })

export default function Page() {
  return <App />
}
