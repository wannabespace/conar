import { CircleIcon, CrownIcon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

export interface PricingPlan {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: string[]
  icon: IconSvgElement
}

export const HOBBY_PLAN: PricingPlan = {
  description: 'Every database feature, with a taste of AI',
  features: [
    'Table browser, SQL editor and visualizer',
    'Unlimited synced connections',
    '20 AI filters a week',
    '100 MCP agent queries a week',
  ],
  icon: CircleIcon,
  name: 'Free',
  price: {
    monthly: 0,
    yearly: 0,
  },
}

export const PRO_PLAN: PricingPlan = {
  description: 'The full AI assistant, without limits',
  features: [
    'Schema-aware AI assistant',
    'Unlimited AI filters and MCP queries',
    'Included AI credits',
    'Extra workspaces',
  ],
  icon: CrownIcon,
  name: 'Pro',
  price: {
    monthly: 15,
    yearly: 150,
  },
}
