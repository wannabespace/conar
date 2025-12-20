import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'

export const users = pgTable('users', {
  ...baseTable,
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  normalizedEmail: text('normalized_email').unique(),
  isAnonymous: boolean('is_anonymous').default(false),
  stripeCustomerId: text('stripe_customer_id'),
  secret: text('secret').notNull(),
})

export const sessions = pgTable(
  'sessions',
  {
    ...baseTable,
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activeWorkspaceId: text('active_workspace_id'),
  },
  (table) => [index('sessions_userId_idx').on(table.userId)]
)

export const accounts = pgTable(
  'accounts',
  {
    ...baseTable,
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
  },
  (table) => [index('accounts_userId_idx').on(table.userId)]
)

export const verifications = pgTable(
  'verifications',
  {
    ...baseTable,
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)]
)

export const twoFactors = pgTable(
  'two_factors',
  {
    ...baseTable,
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('twoFactors_secret_idx').on(table.secret),
    index('twoFactors_userId_idx').on(table.userId),
  ]
)

export const workspaces = pgTable(
  'workspaces',
  {
    ...baseTable,
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    metadata: text('metadata'),
  },
  (table) => [uniqueIndex('workspaces_slug_uidx').on(table.slug)]
)

export const members = pgTable(
  'members',
  {
    ...baseTable,
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').default('member').notNull(),
  },
  (table) => [
    index('members_workspaceId_idx').on(table.workspaceId),
    index('members_userId_idx').on(table.userId),
  ]
)

export const invitations = pgTable(
  'invitations',
  {
    ...baseTable,
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role'),
    status: text('status').default('pending').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    inviterId: uuid('inviter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('invitations_workspaceId_idx').on(table.workspaceId),
    index('invitations_email_idx').on(table.email),
  ]
)

export const subscriptions = pgTable('subscriptions', {
  ...baseTable,
  plan: text('plan').notNull(),
  referenceId: text('reference_id').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  status: text('status').default('incomplete'),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  seats: integer('seats'),
})

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  twoFactors: many(twoFactors),
  members: many(members),
  invitations: many(invitations),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  users: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const twoFactorsRelations = relations(twoFactors, ({ one }) => ({
  users: one(users, {
    fields: [twoFactors.userId],
    references: [users.id],
  }),
}))

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(members),
  invitations: many(invitations),
}))

export const membersRelations = relations(members, ({ one }) => ({
  workspaces: one(workspaces, {
    fields: [members.workspaceId],
    references: [workspaces.id],
  }),
  users: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}))

export const invitationsRelations = relations(invitations, ({ one }) => ({
  workspaces: one(workspaces, {
    fields: [invitations.workspaceId],
    references: [workspaces.id],
  }),
  users: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}))
