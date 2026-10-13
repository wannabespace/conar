import { AppLogo } from '@tamery/ui/components/brand/app-logo'
import { MeshBackground } from '@tamery/ui/components/custom/mesh-background'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

const SHADER_MOUNT_DELAY = 500

export const AuthSidePanel = () => {
  const [isShaderMounted, setIsShaderMounted] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(
      () => setIsShaderMounted(true),
      SHADER_MOUNT_DELAY
    )

    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="bg-body traffic-lights:mt-0 relative m-2 hidden flex-col overflow-hidden rounded-2xl p-10 text-white lg:flex">
      {isShaderMounted && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <MeshBackground />
        </motion.div>
      )}
      <div className="relative mt-auto mb-4 flex items-center gap-2 text-lg font-medium">
        <AppLogo className="size-6" aria-hidden="true" />
        Tamery
      </div>
      <p className="relative max-w-md leading-normal text-balance">
        Write queries, explore data, and manage your databases with AI doing the
        heavy lifting.
      </p>
    </div>
  )
}
