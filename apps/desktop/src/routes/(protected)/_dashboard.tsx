import { createFileRoute, Outlet } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { fetchConnections } from '~/entities/connection'
import { Navbar } from './-components/navbar'

export const Route = createFileRoute('/(protected)/_dashboard')({
  component: LayoutComponent,
})

function LayoutComponent() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConnections()
    }, 1000 * 60 * 5)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      <Navbar />
      <motion.div
        className="flex flex-1 px-3"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.div>
    </motion.div>
  )
}
