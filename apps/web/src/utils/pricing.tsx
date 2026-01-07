import type { RemixiconComponentType } from '@remixicon/react'
import { RiCircleLine, RiVipCrownLine } from '@remixicon/react'

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
  icon: RemixiconComponentType
}

export const HOBBY_PLAN: PricingPlan = {
  name: 'Hobby',
  price: {
    monthly: 0,
    yearly: 0,
  },
  description: 'Perfect for discovering the app and exploring the core features',
  icon: RiCircleLine,
  features: [
    {
      name: 'Limited AI',
      description: 'Use AI to work with your data',
    },
    {
      name: 'Cloud sync',
      description: 'Sync connections across devices',
    },
    {
      name: 'Data management',
      description: 'View and browse data',
    },
  ],
}

export const PRO_PLAN: PricingPlan = {
  name: 'Pro',
  price: {
    monthly: 10,
    yearly: 100,
  },
  description: 'Unlock more features to improve your experience',
  icon: RiVipCrownLine,
  features: [
    {
      name: 'Everything in Hobby',
      description: 'All features from the free plan included',
    },
    {
      name: 'Advanced AI',
      description: 'More AI features and unlimited queries',
    },
    {
      name: 'More data management',
      description: 'Unlock all data management features',
    },
  ],
}
