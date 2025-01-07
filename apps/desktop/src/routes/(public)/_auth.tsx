import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-between p-8 lg:p-12">
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="size-6 rounded bg-primary" />
            <span className="text-xl font-semibold">Justd</span>
          </div>
          <Outlet />
        </div>
      </div>
      <div className="hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Justd</h2>
            <p className="text-lg">
              made integrating accessible React components into my project
              effortless. The Tailwind CSS support meant I could achieve a
              polished design without breaking a sweat.
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <img
              src="/placeholder.svg?height=40&width=40"
              alt="Avatar"
              className="rounded-full"
              width={40}
              height={40}
            />
            <div className="text-left">
              <div className="text-sm font-medium">Kurt Cobain</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-4">123</div>
      </div>
    </div>
  )
}
