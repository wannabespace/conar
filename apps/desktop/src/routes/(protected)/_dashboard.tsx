import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Navbar } from './-components/navbar'

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
      className="h-screen flex flex-col"
    >
      <Navbar />
      <div className="flex pb-2 flex-1">
        <Outlet />
      </div>
    </motion.div>
  )
}
