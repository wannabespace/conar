import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@connnect/ui/components/card'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { AppLogo } from '~/components/app-logo'

export const Route = createFileRoute('/_auth')({
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen items-center justify-center"
    >
      <Card className="m-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-5">
            <AppLogo className="size-16" />
            <h1 className="text-2xl font-semibold">Login to Connnect</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Outlet />
        </CardContent>
      </Card>
    </motion.div>
  )
}
