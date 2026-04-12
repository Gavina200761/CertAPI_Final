const request = require("supertest");
const app = require("../index");
const { User, Certification, LearningResource, ProjectLog, sequelize } = require("../database/models");

describe("API CRUD Operations - MVP Tests", () => {
  beforeAll(async () => {
    process.env.DB_STORAGE = ":memory://";
    await sequelize.sync();
  });

  describe("Users - Create", () => {
    it("should create a new user", async () => {
      const res = await request(app).post("/api/users").send({
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        passwordHash: "$2b$10$1234567890123456789012345678901234567890123456789012",
        role: "student",
        primaryGoal: "Learn",
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("id");
    });
  });

  describe("Certifications - Create", () => {
    it("should create a certification", async () => {
      const user = await User.create({
        name: "User",
        email: `cert-test-${Date.now()}@example.com`,
        passwordHash: "$2b$10$1234567890123456789012345678901234567890123456789012",
        role: "student",
      });
      const res = await request(app)
        .post("/api/certifications")
        .send({
          userId: user.id,
          title: "AWS",
          provider: "Amazon",
          difficultyLevel: "intermediate",
          status: "in_progress",
        });
      expect(res.status).toBe(201);
    });
  });

  describe("Resources - Create", () => {
    it("should create a resource", async () => {
      const user = await User.create({
        name: "User",
        email: `res-test-${Date.now()}@example.com`,
        passwordHash: "$2b$10$1234567890123456789012345678901234567890123456789012",
        role: "student",
      });
      const cert = await Certification.create({
        userId: user.id,
        title: "Test",
        provider: "Provider",
        difficultyLevel: "beginner",
        status: "planned",
      });
      const res = await request(app)
        .post("/api/resources")
        .send({
          certificationId: cert.id,
          type: "course",
          title: "Course",
          url: "https://example.com",
          estimatedTimeMinutes: 120,
        });
      expect(res.status).toBe(201);
    });
  });

  describe("Project Logs - Create", () => {
    it("should create a project log", async () => {
      const user = await User.create({
        name: "User",
        email: `log-test-${Date.now()}@example.com`,
        passwordHash: "$2b$10$1234567890123456789012345678901234567890123456789012",
        role: "student",
      });
      const cert = await Certification.create({
        userId: user.id,
        title: "Test",
        provider: "Provider",
        difficultyLevel: "intermediate",
        status: "in_progress",
      });
      const res = await request(app)
        .post("/api/project-logs")
        .send({
          userId: user.id,
          certificationId: cert.id,
          metric: "score",
          value: "85",
          date: "2026-04-12",
        });
      expect(res.status).toBe(201);
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid ID", async () => {
      const res = await request(app).get("/api/users/abc");
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Invalid id parameter");
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app).get("/api/users/9999");
      expect(res.status).toBe(404);
    });
  });
});
