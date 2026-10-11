import { CircleIcon, CrownIcon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'

interface Feature {
  name: string
  description: string
}

export interface PricingPlan {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  icon: IconSvgElement
}

export const HOBBY_PLAN: PricingPlan = {
  description: 'Every database feature, with a taste of AI',
  features: [
    {
      description: 'Browse, filter and edit rows, run queries, map your schema',
      name: 'Table browser, SQL editor and visualizer',
    },
    {
      description: 'Across devices, with or without the password',
      name: 'Unlimited synced connections',
    },
    {
      description: 'Natural-language filters, reset every Monday',
      name: '20 AI filters a week',
    },
    {
      description: 'For Claude Code, Cursor and other agents',
      name: '100 MCP agent queries a week',
    },
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
    {
      description: 'Every feature of the free plan',
      name: 'Everything in Free',
    },
    {
      description: 'Schema-aware answers, SQL writing and fixing, data seeding',
      name: 'AI assistant',
    },
    {
      description: 'No weekly limits on filters or agent queries',
      name: 'Unlimited AI filters and MCP',
    },
    {
      description: 'Included AI credits and extra workspaces',
      name: 'Credits and workspaces',
    },
  ],
  icon: CrownIcon,
  name: 'Pro',
  price: {
    monthly: 15,
    yearly: 150,
  },
}
