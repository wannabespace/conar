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
      name: 'Cloud sync',
      description: 'Sync connections across devices',
    },
    {
      name: 'Data management',
      description: 'View and browse data',
    },
    {
      name: 'Limited AI',
      description: 'Use AI to work with your data',
    },
    {
      name: 'Natural Language Queries',
      description: 'Ask questions in natural language and get instant SQL queries',
    },
  ],
}

export const PRO_PLAN: PricingPlan = {
  name: 'Pro',
  price: {
    monthly: 10,
    yearly: 100,
  },
  description: 'Unlock advanced features and priority support for power users',
  icon: RiVipCrownLine,
  features: [
    {
      name: 'Everything in Hobby',
      description: 'All features from the free plan included',
    },
    {
      name: 'Custom AI Models',
      description: 'Choose from multiple AI providers (OpenAI, Anthropic, Gemini, XAI)',
    },
    {
      name: 'Advanced Query Optimization',
      description: 'Get AI-powered suggestions to optimize your SQL queries',
    },
  ],
}
