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
  description:
    'Perfect for discovering the app and exploring the core features',
  features: [
    {
      description: 'Use AI to work with your data',
      name: 'Limited AI',
    },
    {
      description: 'Sync connections across devices',
      name: 'Cloud sync',
    },
    {
      description: 'View and browse data',
      name: 'Data management',
    },
  ],
  icon: CircleIcon,
  name: 'Hobby',
  price: {
    monthly: 0,
    yearly: 0,
  },
}

export const PRO_PLAN: PricingPlan = {
  description: 'Unlock more features to improve your experience',
  features: [
    {
      description: 'All features from the free plan included',
      name: 'Everything in Hobby',
    },
    {
      description: 'More AI features and unlimited queries',
      name: 'Advanced AI',
    },
    {
      description: 'Unlock all data management features',
      name: 'More data management',
    },
  ],
  icon: CrownIcon,
  name: 'Pro',
  price: {
    monthly: 10,
    yearly: 100,
  },
}
