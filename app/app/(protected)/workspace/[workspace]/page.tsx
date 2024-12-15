'use client'
import { useEffect } from 'react'

export async function getStaticPaths() {
  return { paths: [], fallback: true }
}

export default function WorkspacePage() {
  useEffect(() => {
    console.log('WorkspacePage')
  }, [])
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  )
}
