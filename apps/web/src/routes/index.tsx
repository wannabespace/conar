import { RiGithubFill } from '@remixicon/react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-4xl font-bold">Connnect.app</h1>
      <p className="text-lg text-muted-foreground max-w-[600px]">
        Your all-in-one application for managing your connections
      </p>
      <a
        href="https://github.com/wannabespace/connnect"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-foreground"
      >
        <RiGithubFill className="h-5 w-5" />
        View on GitHub
      </a>
    </div>
  )
}
