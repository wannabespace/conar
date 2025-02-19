import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Sidebar } from './-components/sidebar'

export const Route = createFileRoute('/(protected)/_dashboard')({
  component: LayoutComponent,
})

function LayoutComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex"
    >
      <Sidebar />
      <div className="flex pb-2 flex-1 px-3">
        <Outlet />
      </div>
    </motion.div>
  )
}
