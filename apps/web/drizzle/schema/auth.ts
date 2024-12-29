import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { baseTable } from '../base-table'

export const users = pgTable('users', {
  ...baseTable,
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text(),
  normalizedEmail: text('normalized_email').unique(),
}).enableRLS()

export const sessions = pgTable('sessions', {
  ...baseTable,
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id').notNull().references(() => users.id),
}).enableRLS()

export const accounts = pgTable('accounts', {
  ...baseTable,
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
    withTimezone: true,
  }),
  scope: text(),
  password: text(),
}).enableRLS()

export const verifications = pgTable('verifications', {
  ...baseTable,
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
}).enableRLS()

export const twoFactors = pgTable('two_factors', {
  ...baseTable,
  secret: text('secret').notNull(),
  backupCodes: text('backup_codes').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
}).enableRLS()

export const organizations = pgTable('organizations', {
  ...baseTable,
  name: text('name').notNull(),
  slug: text('slug').unique(),
  logo: text('logo'),
  metadata: text('metadata'),
}).enableRLS()

export const members = pgTable('members', {
  ...baseTable,
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: text('role').notNull(),
}).enableRLS()

export const invitations = pgTable('invitations', {
  ...baseTable,
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: uuid('inviter_id').notNull().references(() => users.id),
}).enableRLS()
