import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  authenticateToken,
  hashPassword,
  comparePassword,
  generateToken,
  type AuthRequest,
} from "./auth";
import {
  insertStorySchema,
  updateStorySchema,
  loginSchema,
  registerSchema,
} from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = generateToken(user);

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByUsername(username);
      console.log(user);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      console.log(isValidPassword);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.get(
    "/api/auth/user",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "User not found" });
        }

        // Return user without password
        const { password, ...userWithoutPassword } = req.user;

        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    }
  );

  // Story routes
  app.post("/api/stories", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user || (user.role !== "manager" && user.role !== "engineer")) {
        return res
          .status(403)
          .json({ message: "Not authorized to create stories" });
      }

      const storyData = insertStorySchema.parse({
        ...req.body,
        creatorId: userId,
      });

      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(400).json({ message: "Failed to create story" });
    }
  });

  app.get("/api/stories", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let stories;
      if (user.role === "manager") {
        stories = await storage.getAllStories();
      } else if (user.role === "reviewer") {
        stories = await storage.getStoriesByReviewer(userId);
      } else {
        stories = await storage.getStoriesByCreator(userId);
      }

      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.get(
    "/api/stories/my-reviews",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user!.id;
        const stories = await storage.getStoriesByReviewer(userId);
        res.json(stories);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Failed to fetch reviews" });
      }
    }
  );

  app.patch(
    "/api/stories/:id/reviewer",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user!.id;
        const user = await storage.getUser(userId);

        if (!user || user.role !== "manager") {
          return res
            .status(403)
            .json({ message: "Not authorized to assign reviewers" });
        }

        const { reviewerId } = req.body;
        const story = await storage.assignReviewer(req.params.id, reviewerId);
        res.json(story);
      } catch (error) {
        console.error("Error assigning reviewer:", error);
        res.status(400).json({ message: "Failed to assign reviewer" });
      }
    }
  );

  app.patch(
    "/api/stories/:id/coverage",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user!.id;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const { score, comments } = req.body;
        const storyId = req.params.id;

        // Get story to check permissions
        const story = await storage.getStory(storyId);
        if (!story) {
          return res.status(404).json({ message: "Story not found" });
        }

        // Permission check
        const canEdit =
          user.role === "manager" ||
          (user.role === "reviewer" && story.reviewerId === userId);

        if (!canEdit) {
          return res
            .status(403)
            .json({ message: "Not authorized to update coverage" });
        }

        // Validate score
        if (typeof score !== "number" || score < 0 || score > 100) {
          return res
            .status(400)
            .json({ message: "Score must be between 0 and 100" });
        }

        const updatedStory = await storage.updateCoverage(
          storyId,
          score,
          userId,
          comments
        );
        res.json(updatedStory);
      } catch (error) {
        console.error("Error updating coverage:", error);
        res.status(400).json({ message: "Failed to update coverage" });
      }
    }
  );

  // Analytics routes
  app.get(
    "/api/analytics/team",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user!.id;
        const user = await storage.getUser(userId);

        if (!user || user.role !== "manager") {
          return res
            .status(403)
            .json({ message: "Not authorized to view team analytics" });
        }

        const stats = await storage.getTeamStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching team stats:", error);
        res.status(500).json({ message: "Failed to fetch team stats" });
      }
    }
  );

  app.get(
    "/api/analytics/users",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user!.id;
        const user = await storage.getUser(userId);

        if (!user || user.role !== "manager") {
          return res
            .status(403)
            .json({ message: "Not authorized to view user analytics" });
        }

        const users = await storage.getAllUsersWithStats();
        res.json(users);
      } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ message: "Failed to fetch user stats" });
      }
    }
  );

  app.get(
    "/api/analytics/personal",
    authenticateToken,
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user!.id;
        const stats = await storage.getUserStats(userId);
        res.json(stats);
      } catch (error) {
        console.error("Error fetching personal stats:", error);
        res.status(500).json({ message: "Failed to fetch personal stats" });
      }
    }
  );

  // Get all users for reviewer assignment
  app.get("/api/users", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log("------------------Comes here");
      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user || user.role !== "manager") {
        return res
          .status(403)
          .json({ message: "Not authorized to view users" });
      }

      const users = await storage.getAllUsersWithStats();
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
