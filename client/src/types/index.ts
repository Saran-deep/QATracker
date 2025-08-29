export type UserRole = "manager" | "engineer" | "reviewer";

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  ticketId: string;
  title: string;
  creatorId: string;
  reviewerId?: string;
  coverageScore?: string;
  status: "pending" | "in_review" | "reviewed";
  comments?: string;
  dateCompleted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoryWithDetails extends Story {
  creator: User;
  reviewer?: User;
}

export interface UserWithStats extends User {
  totalStories: number;
  averageCoverage: number;
  status: "pass" | "fail";
}

export interface TeamStats {
  totalStories: number;
  averageCoverage: number;
  usersBelow90: number;
  pendingReviews: number;
}
