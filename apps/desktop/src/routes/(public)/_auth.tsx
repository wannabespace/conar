import { AppLogoSquare } from '@conar/ui/components/brand/app-logo-square'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/(public)/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className={`
      flex h-screen min-h-[inherit] items-center justify-center bg-background
      px-3
    `}
    >
      <div className={`
        relative z-10 mx-auto flex w-full max-w-md flex-col gap-8 py-6
      `}
      >
        <div className="flex items-center gap-3">
          <AppLogoSquare className="size-12" />
        </div>
        <Outlet />
      </div>
    </div>
  )
}
