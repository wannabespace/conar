import type { Rules } from 'permix'

// oxlint-disable-next-line typescript/consistent-type-definitions -- permix's Definition needs an index signature, which an interface lacks
export type Permissions = {
  ai: {
    chat: ['use']
    filter: ['use', 'unlimited']
    sql: ['use']
  }
  connection: [{ name: 'create'; type: { count: number } }, 'syncString']
  database: ['edit']
  seed: ['unlimited']
  tab: ['multiple']
  workspace: ['create']
}

export const permissionsOf = ({
  hasSubscription,
  isAnonymous,
}: {
  hasSubscription: boolean
  isAnonymous: boolean
}): Rules<Permissions> => {
  const member = !isAnonymous
  const pro = member && hasSubscription

  return {
    ai: {
      chat: { use: pro },
      filter: { unlimited: pro, use: member },
      sql: { use: pro },
    },
    connection: {
      create: member || ((connections) => connections?.count === 0),
      syncString: member,
    },
    database: { edit: member },
    seed: { unlimited: pro },
    tab: { multiple: member },
    workspace: { create: pro },
  }
}
