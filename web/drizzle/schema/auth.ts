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
