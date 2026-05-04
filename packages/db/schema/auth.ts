import { defineRelations } from 'drizzle-orm'
import * as d from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'

export const users = d.snakeCase.table('users', {
  ...baseTable,
  name: d.text().notNull(),
  email: d.text().notNull().unique(),
  emailVerified: d.boolean().default(false).notNull(),
  image: d.text(),
  twoFactorEnabled: d.boolean().default(false),
  normalizedEmail: d.text().unique(),
  isAnonymous: d.boolean().default(false),
  secret: d.text().notNull(),
  stripeCustomerId: d.text(),
  desktopVersion: d.text(),
})

export const sessions = d.snakeCase.table('sessions', {
  ...baseTable,
  expiresAt: d.timestamp('expires_at', { withTimezone: true }).notNull(),
  token: d.text().notNull().unique(),
  ipAddress: d.text(),
  userAgent: d.text(),
  userId: d.uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  activeWorkspaceId: d.text(),
}, table => [d.index('sessions_userId_idx').on(table.userId)])

export const accounts = d.snakeCase.table('accounts', {
  ...baseTable,
  accountId: d.text().notNull(),
  providerId: d.text().notNull(),
  userId: d.uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: d.text(),
  refreshToken: d.text(),
  idToken: d.text(),
  accessTokenExpiresAt: d.timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: d.timestamp({ withTimezone: true }),
  scope: d.text(),
  password: d.text(),
}, table => [d.index('accounts_userId_idx').on(table.userId)])

export const verifications = d.snakeCase.table('verifications', {
  ...baseTable,
  identifier: d.text().notNull(),
  value: d.text().notNull(),
  expiresAt: d.timestamp({ withTimezone: true }).notNull(),
}, table => [d.index('verifications_identifier_idx').on(table.identifier)])

export const twoFactors = d.snakeCase.table('two_factors', {
  ...baseTable,
  secret: d.text().notNull(),
  backupCodes: d.text().notNull(),
  userId: d.uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
}, table => [
  d.index('twoFactors_secret_idx').on(table.secret),
  d.index('twoFactors_userId_idx').on(table.userId),
])

export const workspaces = d.snakeCase.table('workspaces', {
  ...baseTable,
  name: d.text().notNull(),
  slug: d.text().notNull().unique(),
  logo: d.text(),
  metadata: d.text(),
}, table => [d.uniqueIndex('workspaces_slug_uidx').on(table.slug)])

export const members = d.snakeCase.table('members', {
  ...baseTable,
  workspaceId: d.uuid().notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: d.uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: d.text().default('member').notNull(),
}, table => [
  d.index('members_workspaceId_idx').on(table.workspaceId),
  d.index('members_userId_idx').on(table.userId),
])

export const invitations = d.snakeCase.table('invitations', {
  ...baseTable,
  workspaceId: d.uuid().notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  email: d.text().notNull(),
  role: d.text(),
  status: d.text().default('pending').notNull(),
  expiresAt: d.timestamp({ withTimezone: true }).notNull(),
  inviterId: d.uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
}, table => [
  d.index('invitations_workspaceId_idx').on(table.workspaceId),
  d.index('invitations_email_idx').on(table.email),
])

export const authRelations = defineRelations(
  { users, sessions, accounts, twoFactors, workspaces, members, invitations },
  r => ({
    users: {
      sessions: r.many.sessions(),
      accounts: r.many.accounts(),
      twoFactors: r.many.twoFactors(),
      members: r.many.members(),
      invitations: r.many.invitations(),
    },
    sessions: {
      user: r.one.users({
        from: r.sessions.userId,
        to: r.users.id,
      }),
    },
    accounts: {
      user: r.one.users({
        from: r.accounts.userId,
        to: r.users.id,
      }),
    },
    twoFactors: {
      user: r.one.users({
        from: r.twoFactors.userId,
        to: r.users.id,
      }),
    },
    workspaces: {
      members: r.many.members(),
      invitations: r.many.invitations(),
    },
    members: {
      workspace: r.one.workspaces({
        from: r.members.workspaceId,
        to: r.workspaces.id,
      }),
      user: r.one.users({
        from: r.members.userId,
        to: r.users.id,
      }),
    },
    invitations: {
      workspace: r.one.workspaces({
        from: r.invitations.workspaceId,
        to: r.workspaces.id,
      }),
      inviter: r.one.users({
        from: r.invitations.inviterId,
        to: r.users.id,
      }),
    },
  }),
)
