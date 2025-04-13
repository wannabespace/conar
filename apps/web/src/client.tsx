/// <reference types="vinxi/types/client" />

import { StartClient } from '@tanstack/react-start'
import { hydrateRoot } from 'react-dom/client'
import { createRouter } from './router'

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => {
    scan({
      enabled: true,
    })
  })
}

const router = createRouter()

hydrateRoot(document, <StartClient router={router} />)
