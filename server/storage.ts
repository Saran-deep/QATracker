import {
  users,
  stories,
  coverageHistory,
  type User,
  type InsertUser,
  type Story,
  type InsertStory,
  type UpdateStory,
  type StoryWithDetails,
  type UserWithStats,
  type InsertCoverageHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, avg, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Story operations
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: string, updates: UpdateStory): Promise<Story>;
  getStory(id: string): Promise<StoryWithDetails | undefined>;
  getStoriesByCreator(creatorId: string): Promise<StoryWithDetails[]>;
  getStoriesByReviewer(reviewerId: string): Promise<StoryWithDetails[]>;
  getAllStories(): Promise<StoryWithDetails[]>;
  assignReviewer(storyId: string, reviewerId: string): Promise<Story>;

  // Coverage operations
  updateCoverage(
    storyId: string,
    score: number,
    updatedById: string,
    comments?: string
  ): Promise<Story>;
  getCoverageHistory(storyId: string): Promise<any[]>;

  // Analytics operations
  getUserStats(userId: string): Promise<UserWithStats>;
  getTeamStats(): Promise<{
    totalStories: number;
    averageCoverage: number;
    usersBelow90: number;
    pendingReviews: number;
  }>;
  getAllUsersWithStats(): Promise<UserWithStats[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Story operations
  async createStory(story: InsertStory): Promise<Story> {
    const [newStory] = await db.insert(stories).values(story).returning();
    return newStory;
  }

  async updateStory(id: string, updates: UpdateStory): Promise<Story> {
    const [updatedStory] = await db
      .update(stories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stories.id, id))
      .returning();
    return updatedStory;
  }

  async getStory(id: string): Promise<StoryWithDetails | undefined> {
    const [story] = await db
      .select({
        id: stories.id,
        ticketId: stories.ticketId,
        title: stories.title,
        creatorId: stories.creatorId,
        reviewerId: stories.reviewerId,
        coverageScore: stories.coverageScore,
        status: stories.status,
        comments: stories.comments,
        dateCompleted: stories.dateCompleted,
        createdAt: stories.createdAt,
        updatedAt: stories.updatedAt,
        creator: users,
        reviewer: sql`reviewer_user`,
      })
      .from(stories)
      .innerJoin(users, eq(stories.creatorId, users.id))
      .leftJoin(
        sql`${users} as reviewer_user`,
        eq(stories.reviewerId, sql`reviewer_user.id`)
      )
      .where(eq(stories.id, id));

    return story as any;
  }

  async getStoriesByCreator(creatorId: string): Promise<StoryWithDetails[]> {
    const result = await db
      .select({
        story: stories,
        creator: users,
        reviewer: sql`reviewer_user`,
      })
      .from(stories)
      .innerJoin(users, eq(stories.creatorId, users.id))
      .leftJoin(
        sql`${users} as reviewer_user`,
        eq(stories.reviewerId, sql`reviewer_user.id`)
      )
      .where(eq(stories.creatorId, creatorId))
      .orderBy(desc(stories.createdAt));

    return result.map((r) => ({
      ...r.story,
      creator: r.creator,
      reviewer: r.reviewer,
    })) as any;
  }

  async getStoriesByReviewer(reviewerId: string): Promise<StoryWithDetails[]> {
    const result = await db
      .select({
        story: stories,
        creator: users,
        reviewer: sql`reviewer_user`,
      })
      .from(stories)
      .innerJoin(users, eq(stories.creatorId, users.id))
      .leftJoin(
        sql`${users} as reviewer_user`,
        eq(stories.reviewerId, sql`reviewer_user.id`)
      )
      .where(eq(stories.reviewerId, reviewerId))
      .orderBy(desc(stories.createdAt));

    return result.map((r) => ({
      ...r.story,
      creator: r.creator,
      reviewer: r.reviewer,
    })) as any;
  }

  async getAllStories(): Promise<StoryWithDetails[]> {
    const result = await db
      .select({
        story: stories,
        creator: users,
        reviewer: sql`reviewer_user`,
      })
      .from(stories)
      .innerJoin(users, eq(stories.creatorId, users.id))
      .leftJoin(
        sql`${users} as reviewer_user`,
        eq(stories.reviewerId, sql`reviewer_user.id`)
      )
      .orderBy(desc(stories.createdAt));

    return result.map((r) => ({
      ...r.story,
      creator: r.creator,
      reviewer: r.reviewer,
    })) as any;
  }

  async assignReviewer(storyId: string, reviewerId: string): Promise<Story> {
    return this.updateStory(storyId, { reviewerId, status: "in_review" });
  }

  // Coverage operations
  async updateCoverage(
    storyId: string,
    score: number,
    updatedById: string,
    comments?: string
  ): Promise<Story> {
    // Get current story for history
    const currentStory = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);

    if (currentStory.length === 0) {
      throw new Error("Story not found");
    }

    const previousScore = currentStory[0].coverageScore;

    // Create history record
    await db.insert(coverageHistory).values({
      storyId,
      updatedById,
      previousScore: previousScore ? previousScore : null,
      newScore: score.toString(),
      comments,
    });

    // Update story
    const status = score >= 90 ? "reviewed" : "reviewed";
    return this.updateStory(storyId, {
      coverageScore: score.toString(),
      status,
      comments,
      dateCompleted: new Date(),
    });
  }

  async getCoverageHistory(storyId: string): Promise<any[]> {
    return db
      .select({
        id: coverageHistory.id,
        previousScore: coverageHistory.previousScore,
        newScore: coverageHistory.newScore,
        comments: coverageHistory.comments,
        createdAt: coverageHistory.createdAt,
        updatedBy: users,
      })
      .from(coverageHistory)
      .innerJoin(users, eq(coverageHistory.updatedById, users.id))
      .where(eq(coverageHistory.storyId, storyId))
      .orderBy(desc(coverageHistory.createdAt));
  }

  // Analytics operations
  async getUserStats(userId: string): Promise<UserWithStats> {
    const [userResult] = await db
      .select({
        user: users,
        totalStories: count(stories.id),
        averageCoverage: avg(stories.coverageScore),
      })
      .from(users)
      .leftJoin(stories, eq(users.id, stories.creatorId))
      .where(eq(users.id, userId))
      .groupBy(users.id);

    const totalStories = userResult.totalStories || 0;
    const averageCoverage = userResult.averageCoverage
      ? parseFloat(userResult.averageCoverage)
      : 0;
    const status = averageCoverage >= 90 ? "pass" : "fail";

    return {
      ...userResult.user,
      totalStories,
      averageCoverage,
      status,
    };
  }

  async getTeamStats(): Promise<{
    totalStories: number;
    averageCoverage: number;
    usersBelow90: number;
    pendingReviews: number;
  }> {
    const [statsResult] = await db
      .select({
        totalStories: count(stories.id),
        averageCoverage: avg(stories.coverageScore),
      })
      .from(stories);

    const [pendingResult] = await db
      .select({
        pendingReviews: count(stories.id),
      })
      .from(stories)
      .where(eq(stories.status, "pending"));

    // Get users below 90%
    const userStats = await this.getAllUsersWithStats();
    const usersBelow90 = userStats.filter(
      (user) => user.averageCoverage < 90
    ).length;

    return {
      totalStories: statsResult.totalStories || 0,
      averageCoverage: statsResult.averageCoverage
        ? parseFloat(statsResult.averageCoverage)
        : 0,
      usersBelow90,
      pendingReviews: pendingResult.pendingReviews || 0,
    };
  }

  async getAllUsersWithStats(): Promise<UserWithStats[]> {
    const result = await db
      .select({
        user: users,
        totalStories: count(stories.id),
        averageCoverage: avg(stories.coverageScore),
      })
      .from(users)
      .leftJoin(stories, eq(users.id, stories.creatorId))
      .groupBy(users.id);

    return result.map((r) => ({
      ...r.user,
      totalStories: r.totalStories || 0,
      averageCoverage: r.averageCoverage ? parseFloat(r.averageCoverage) : 0,
      status:
        r.averageCoverage && parseFloat(r.averageCoverage) >= 90
          ? "pass"
          : "fail",
    }));
  }
}

export const storage = new DatabaseStorage();
