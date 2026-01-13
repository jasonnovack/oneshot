import { pgTable, text, timestamp, uuid, integer, primaryKey } from 'drizzle-orm/pg-core'

// Users table for GitHub OAuth
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  githubId: text('github_id').notNull().unique(),
  username: text('username').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  email: text('email'),
  xUsername: text('x_username'), // Twitter/X handle (without @)
  bio: text('bio'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const shots = pgTable('shots', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Owner (optional for now, will be required after migration)
  userId: uuid('user_id').references(() => users.id),

  // Metadata
  title: text('title').notNull(),
  type: text('type').notNull(), // feature | fix | refactor | ui | test | docs | other
  tags: text('tags').array(),

  // Git state
  repoUrl: text('repo_url').notNull(),
  beforeCommitHash: text('before_commit_hash').notNull(),
  afterCommitHash: text('after_commit_hash').notNull(),
  diff: text('diff').notNull(),

  // Diff stats (pre-computed to avoid loading full diff)
  diffFilesChanged: integer('diff_files_changed'),
  diffAdditions: integer('diff_additions'),
  diffDeletions: integer('diff_deletions'),

  // Preview URLs (optional - for hosted live demos)
  beforePreviewUrl: text('before_preview_url'),
  afterPreviewUrl: text('after_preview_url'),

  // AI action
  harness: text('harness').notNull(), // claude_code | cursor | codex
  model: text('model').notNull(),
  prompt: text('prompt').notNull(),

  // Session data (full JSON blob for future expansion)
  sessionData: text('session_data'),
  sessionHash: text('session_hash'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),

  // Stats (denormalized for performance)
  viewCount: integer('view_count').default(0),
  starCount: integer('star_count').default(0),
  commentCount: integer('comment_count').default(0),
})

// Comments on shots
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  shotId: uuid('shot_id').references(() => shots.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Stars (favorites) - composite primary key prevents duplicates
export const stars = pgTable('stars', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  shotId: uuid('shot_id').references(() => shots.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.shotId] }),
}))

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Shot = typeof shots.$inferSelect
export type NewShot = typeof shots.$inferInsert
export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type Star = typeof stars.$inferSelect
export type NewStar = typeof stars.$inferInsert

// Device codes for CLI authentication
export const deviceCodes = pgTable('device_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceCode: text('device_code').notNull().unique(),
  userCode: text('user_code').notNull().unique(),
  userId: uuid('user_id').references(() => users.id),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type DeviceCode = typeof deviceCodes.$inferSelect
export type NewDeviceCode = typeof deviceCodes.$inferInsert

// Feature requests from the community
export const requests = pgTable('requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Request details
  type: text('type').notNull(), // model | harness | hosting | plugin | other
  title: text('title').notNull(),
  description: text('description').notNull(),
  link: text('link'), // Optional URL for reference

  // Status
  status: text('status').default('open').notNull(), // open | planned | completed | declined

  // Denormalized counts
  upvoteCount: integer('upvote_count').default(0),
  commentCount: integer('comment_count').default(0),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Upvotes on requests (same pattern as stars)
export const requestUpvotes = pgTable('request_upvotes', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  requestId: uuid('request_id').references(() => requests.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.requestId] }),
}))

// Comments on requests
export const requestComments = pgTable('request_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: uuid('request_id').references(() => requests.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Request = typeof requests.$inferSelect
export type NewRequest = typeof requests.$inferInsert
export type RequestUpvote = typeof requestUpvotes.$inferSelect
export type NewRequestUpvote = typeof requestUpvotes.$inferInsert
export type RequestComment = typeof requestComments.$inferSelect
export type NewRequestComment = typeof requestComments.$inferInsert
