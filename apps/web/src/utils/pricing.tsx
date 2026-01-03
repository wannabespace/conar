import type { RemixiconComponentType } from '@remixicon/react'
import { RiCircleLine, RiVipCrownLine } from '@remixicon/react'

interface Feature {
  name: string
  description: string
  included: boolean
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
  description: 'Perfect for discover the app and explore the core features',
  icon: RiCircleLine,
  features: [
    {
      name: 'AI-Powered Data Filtering',
      description: 'Ask AI to create filters for you instead of entering them manually',
      included: true,
    },
    {
      name: 'Natural Language Queries',
      description: 'Ask questions in natural language and get instant SQL queries',
      included: true,
    },
    {
      name: 'Basic Data Management',
      description: 'View and browse data with basic filtering capabilities',
      included: true,
    },
    {
      name: 'Cloud Synchronization',
      description: 'Sync your connections with the cloud for backup',
      included: true,
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
      name: 'Everything in Free',
      description: 'All features from the free plan included',
      included: true,
    },
    // {
    //   name: 'Priority Support',
    //   description: '24/7 priority email and chat support',
    //   included: true,
    // },
  ],
}
