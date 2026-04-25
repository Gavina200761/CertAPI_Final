const request = require("supertest");
const app = require("../index");
const { User, Certification, sequelize } = require("../database/models");

describe("API Auth + CRUD Operations", () => {
  beforeAll(async () => {
    process.env.DB_STORAGE = ":memory://";
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  async function registerAndLogin(seed = Date.now()) {
    const registrationPayload = {
      name: "Test User",
      email: `test-${seed}@example.com`,
      password: "StrongPass123!",
      primaryGoal: "Learn",
    };

    const registerRes = await request(app).post("/api/users/register").send(registrationPayload);
    const loginRes = await request(app).post("/api/users/login").send({
      email: registrationPayload.email,
      password: registrationPayload.password,
    });

    return {
      registerRes,
      loginRes,
      userId: registerRes.body.id,
      token: loginRes.body.token,
    };
  }

  describe("Authentication", () => {
    it("should register, login, validate token, and logout", async () => {
      const { registerRes, loginRes, token } = await registerAndLogin(Date.now());

      expect(registerRes.status).toBe(201);
      expect(registerRes.body).toHaveProperty("id");
      expect(registerRes.body).not.toHaveProperty("passwordHash");

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty("token");
      expect(loginRes.body).toHaveProperty("user");
      expect(loginRes.body.user).not.toHaveProperty("passwordHash");

      const validateRes = await request(app)
        .get("/api/users/validate-token")
        .set("Authorization", `Bearer ${token}`);
      expect(validateRes.status).toBe(200);
      expect(validateRes.body).toHaveProperty("valid", true);

      const logoutRes = await request(app)
        .post("/api/users/logout")
        .set("Authorization", `Bearer ${token}`);
      expect(logoutRes.status).toBe(200);

      const validateAfterLogoutRes = await request(app)
        .get("/api/users/validate-token")
        .set("Authorization", `Bearer ${token}`);
      expect(validateAfterLogoutRes.status).toBe(401);
    });

    it("should reject protected route without token", async () => {
      const res = await request(app).get("/api/certifications");
      expect(res.status).toBe(401);
    });
  });

  describe("Users", () => {
    it("should allow a user to fetch their own profile", async () => {
      const { token, userId } = await registerAndLogin(Date.now() + 1);

      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", userId);
      expect(res.body).not.toHaveProperty("passwordHash");
    });
  });

  describe("Certifications - Create", () => {
    it("should create a certification for the authenticated user", async () => {
      const { token, userId } = await registerAndLogin(Date.now() + 2);

      const res = await request(app)
        .post("/api/certifications")
        .set("Authorization", `Bearer ${token}`)
        .send({
          userId: userId + 999,
          title: "AWS",
          provider: "Amazon",
          difficultyLevel: "intermediate",
          status: "in_progress",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("userId", userId);
    });
  });

  describe("Resources - Create", () => {
    it("should create a resource for a user-owned certification", async () => {
      const { token } = await registerAndLogin(Date.now() + 3);

      const certRes = await request(app)
        .post("/api/certifications")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test",
          provider: "Provider",
          difficultyLevel: "beginner",
          status: "planned",
        });

      const res = await request(app)
        .post("/api/resources")
        .set("Authorization", `Bearer ${token}`)
        .send({
          certificationId: certRes.body.id,
          type: "course",
          title: "Course",
          url: "https://example.com",
          estimatedTimeMinutes: 120,
        });

      expect(res.status).toBe(201);
    });
  });

  describe("Project Logs - Create", () => {
    it("should create a project log for authenticated user", async () => {
      const { token, userId } = await registerAndLogin(Date.now() + 4);

      const certRes = await request(app)
        .post("/api/certifications")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Test",
          provider: "Provider",
          difficultyLevel: "intermediate",
          status: "in_progress",
        });

      const res = await request(app)
        .post("/api/project-logs")
        .set("Authorization", `Bearer ${token}`)
        .send({
          userId: userId + 777,
          certificationId: certRes.body.id,
          metric: "score",
          value: "85",
          date: "2026-04-12",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("userId", userId);
    });
  });

  describe("Error Handling", () => {
    it("should return 400 for invalid ID when authenticated", async () => {
      const { token } = await registerAndLogin(Date.now() + 5);

      const res = await request(app)
        .get("/api/users/abc")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Invalid id parameter");
    });

    it("should return 404 for non-existent user", async () => {
      const { token } = await registerAndLogin(Date.now() + 6);

      const res = await request(app)
        .get("/api/users/9999")
        .set("Authorization", `Bearer ${token}`);

      expect([403, 404]).toContain(res.status);
    });
  });
});
