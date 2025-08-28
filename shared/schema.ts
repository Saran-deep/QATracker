import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['manager', 'engineer', 'reviewer']);

// Status enum for stories
export const storyStatusEnum = pgEnum('story_status', ['pending', 'in_review', 'reviewed']);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: userRoleEnum("role").notNull().default('engineer'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stories/Tasks table
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().unique(),
  title: text("title").notNull(),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  coverageScore: decimal("coverage_score", { precision: 5, scale: 2 }),
  status: storyStatusEnum("status").notNull().default('pending'),
  comments: text("comments"),
  dateCompleted: timestamp("date_completed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coverage history for audit trail
export const coverageHistory = pgTable("coverage_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id),
  updatedById: varchar("updated_by_id").notNull().references(() => users.id),
  previousScore: decimal("previous_score", { precision: 5, scale: 2 }),
  newScore: decimal("new_score", { precision: 5, scale: 2 }).notNull(),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdStories: many(stories, { relationName: "creator" }),
  reviewingStories: many(stories, { relationName: "reviewer" }),
  coverageHistory: many(coverageHistory),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  creator: one(users, {
    fields: [stories.creatorId],
    references: [users.id],
    relationName: "creator",
  }),
  reviewer: one(users, {
    fields: [stories.reviewerId],
    references: [users.id],
    relationName: "reviewer",
  }),
  coverageHistory: many(coverageHistory),
}));

export const coverageHistoryRelations = relations(coverageHistory, ({ one }) => ({
  story: one(stories, {
    fields: [coverageHistory.storyId],
    references: [stories.id],
  }),
  updatedBy: one(users, {
    fields: [coverageHistory.updatedById],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoverageHistorySchema = createInsertSchema(coverageHistory).omit({
  id: true,
  createdAt: true,
});

// Update schemas
export const updateStorySchema = insertStorySchema.partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type UpdateStory = z.infer<typeof updateStorySchema>;
export type CoverageHistory = typeof coverageHistory.$inferSelect;
export type InsertCoverageHistory = z.infer<typeof insertCoverageHistorySchema>;

// Extended types with relations
export type StoryWithDetails = Story & {
  creator: User;
  reviewer?: User;
};

export type UserWithStats = User & {
  totalStories: number;
  averageCoverage: number;
  status: 'pass' | 'fail';
};
