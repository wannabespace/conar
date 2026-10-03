import type { Rules } from 'permix'

export type Plan = 'free' | 'guest' | 'pro'

// oxlint-disable-next-line typescript/consistent-type-definitions -- permix's Definition needs an index signature, which an interface lacks
export type Permissions = {
  ai: ['chat', 'sql']
  connection: [{ name: 'create'; type: { count: number } }, 'syncString']
  database: ['edit']
  filter: ['ai', 'unlimited']
  seed: ['unlimited']
  tab: ['multiple']
  workspace: ['create']
}

export const planOf = (
  user: { isAnonymous?: boolean | null },
  hasSubscription: boolean
): Plan => {
  if (user.isAnonymous) {
    return 'guest'
  }

  return hasSubscription ? 'pro' : 'free'
}

export const permissionsOf = (plan: Plan): Rules<Permissions> => {
  const member = plan !== 'guest'
  const pro = plan === 'pro'

  return {
    ai: { chat: pro, sql: pro },
    connection: {
      create: member || ((connections) => connections?.count === 0),
      syncString: member,
    },
    database: { edit: member },
    filter: { ai: member, unlimited: pro },
    seed: { unlimited: pro },
    tab: { multiple: member },
    workspace: { create: pro },
  }
}
