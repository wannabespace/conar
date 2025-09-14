import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { baseTable } from '../base-table'

export const users = pgTable('users', {
  ...baseTable,
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  image: text(),
  twoFactorEnabled: boolean().default(false),
  normalizedEmail: text().unique('users_normalized_email_unique'),
  isAnonymous: boolean(),
  secret: text().notNull().$defaultFn(() => nanoid()),
}, t => [
  index().on(t.email),
]).enableRLS()

export const sessions = pgTable('sessions', {
  ...baseTable,
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
}, t => [
  index().on(t.userId),
  index().on(t.token),
]).enableRLS()

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const accounts = pgTable('accounts', {
  ...baseTable,
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: timestamp({ withTimezone: true }),
  scope: text(),
  password: text(),
}, t => [
  index().on(t.userId),
]).enableRLS()

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export const verifications = pgTable('verifications', {
  ...baseTable,
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
}, t => [
  index().on(t.identifier),
]).enableRLS()

export const twoFactors = pgTable('two_factors', {
  ...baseTable,
  secret: text().notNull(),
  backupCodes: text().notNull(),
  userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
}).enableRLS()

export const twoFactorsRelations = relations(twoFactors, ({ one }) => ({
  user: one(users, {
    fields: [twoFactors.userId],
    references: [users.id],
  }),
}))

export const workspaces = pgTable('workspaces', {
  ...baseTable,
  name: text().notNull(),
  slug: text().unique(),
  logo: text(),
  metadata: text(),
}, t => [
  index().on(t.slug),
]).enableRLS()

export const members = pgTable('members', {
  ...baseTable,
  workspaceId: uuid().notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text().default('member').notNull(),
}, t => [
  index().on(t.userId),
  index().on(t.workspaceId),
]).enableRLS()

export const membersRelations = relations(members, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [members.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}))

export const invitations = pgTable('invitations', {
  ...baseTable,
  workspaceId: uuid().notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  email: text().notNull(),
  role: text(),
  status: text().default('pending').notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  inviterId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
}, t => [
  index().on(t.email),
  index().on(t.workspaceId),
]).enableRLS()

export const invitationsRelations = relations(invitations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [invitations.workspaceId],
    references: [workspaces.id],
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}))
