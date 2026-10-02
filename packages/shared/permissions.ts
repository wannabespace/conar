import type { Rules } from 'permix'

export type Plan = 'free' | 'guest' | 'pro'

export const GUEST_ROW_LIMIT = 10

// oxlint-disable-next-line typescript/consistent-type-definitions -- permix's Definition needs an index signature, which an interface lacks
export type Permissions = {
  ai: ['chat', 'filters', 'sql', 'unlimited']
  connection: [{ name: 'create'; type: { count: number } }, 'syncString']
  database: ['edit']
  seed: ['unlimited']
  tab: ['multiple']
  table: ['allRows']
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
    ai: { chat: pro, filters: member, sql: pro, unlimited: pro },
    connection: {
      create: member || ((connections) => connections?.count === 0),
      syncString: member,
    },
    database: { edit: member },
    seed: { unlimited: pro },
    tab: { multiple: member },
    table: { allRows: member },
    workspace: { create: pro },
  }
}
