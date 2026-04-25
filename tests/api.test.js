const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../index");
const { User, Certification, ProjectLog, sequelize } = require("../database/models");

const SALT_ROUNDS = 10;

describe("API Auth + CRUD Operations", () => {
  beforeEach(async () => {
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

  async function createRoleUser(role, seed = Date.now()) {
    const password = "StrongPass123!";
    const user = await User.create({
      name: `${role} user`,
      email: `${role}-${seed}@example.com`,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
      role,
      primaryGoal: `${role} goal`,
    });

    const loginRes = await request(app).post("/api/users/login").send({
      email: user.email,
      password,
    });

    return {
      user,
      token: loginRes.body.token,
      loginRes,
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

    it("should block a student from listing all users", async () => {
      const { token } = await registerAndLogin(Date.now() + 10);

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should allow an instructor to list users but not delete another user", async () => {
      const { token: instructorToken } = await createRoleUser("instructor", Date.now() + 11);
      const { user: studentUser } = await createRoleUser("student", Date.now() + 12);

      const listRes = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${instructorToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);

      const deleteRes = await request(app)
        .delete(`/api/users/${studentUser.id}`)
        .set("Authorization", `Bearer ${instructorToken}`);

      expect(deleteRes.status).toBe(403);
    });

    it("should allow an admin to create another user with a privileged role", async () => {
      const { token: adminToken } = await createRoleUser("admin", Date.now() + 13);

      const res = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "New Instructor",
          email: `new-instructor-${Date.now()}@example.com`,
          password: "StrongPass123!",
          role: "instructor",
          primaryGoal: "Teach students",
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("role", "instructor");
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

  describe("Role-Based Authorization", () => {
    it("should enforce certification ownership for students while allowing instructor read access", async () => {
      const { token: ownerToken } = await registerAndLogin(Date.now() + 20);
      const { token: otherStudentToken } = await registerAndLogin(Date.now() + 21);
      const { token: instructorToken } = await createRoleUser("instructor", Date.now() + 22);

      const certRes = await request(app)
        .post("/api/certifications")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          title: "AWS Security",
          provider: "Amazon",
          difficultyLevel: "intermediate",
          status: "planned",
        });

      const deniedRes = await request(app)
        .get(`/api/certifications/${certRes.body.id}`)
        .set("Authorization", `Bearer ${otherStudentToken}`);

      expect(deniedRes.status).toBe(403);

      const instructorRes = await request(app)
        .get(`/api/certifications/${certRes.body.id}`)
        .set("Authorization", `Bearer ${instructorToken}`);

      expect(instructorRes.status).toBe(200);
      expect(instructorRes.body).toHaveProperty("id", certRes.body.id);
    });

    it("should scope project log collections to owners unless the user is instructor or admin", async () => {
      const { token: ownerToken, userId: ownerId } = await registerAndLogin(Date.now() + 23);
      const { token: otherStudentToken } = await registerAndLogin(Date.now() + 24);
      const { token: instructorToken } = await createRoleUser("instructor", Date.now() + 25);

      const certRes = await request(app)
        .post("/api/certifications")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          title: "Azure Admin",
          provider: "Microsoft",
          difficultyLevel: "beginner",
          status: "in_progress",
        });

      await ProjectLog.create({
        userId: ownerId,
        certificationId: certRes.body.id,
        metric: "study_minutes",
        value: "90",
        date: "2026-04-20",
      });

      const otherStudentLogsRes = await request(app)
        .get("/api/project-logs")
        .set("Authorization", `Bearer ${otherStudentToken}`);

      expect(otherStudentLogsRes.status).toBe(200);
      expect(otherStudentLogsRes.body).toHaveLength(0);

      const instructorLogsRes = await request(app)
        .get("/api/project-logs")
        .set("Authorization", `Bearer ${instructorToken}`);

      expect(instructorLogsRes.status).toBe(200);
      expect(instructorLogsRes.body.length).toBeGreaterThanOrEqual(1);
    });

    it("should allow admin access to another user’s certification management", async () => {
      const { token: ownerToken } = await registerAndLogin(Date.now() + 26);
      const { token: adminToken } = await createRoleUser("admin", Date.now() + 27);

      const certRes = await request(app)
        .post("/api/certifications")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          title: "CCNA",
          provider: "Cisco",
          difficultyLevel: "advanced",
          status: "planned",
        });

      const deleteRes = await request(app)
        .delete(`/api/certifications/${certRes.body.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(204);

      const fetchRes = await request(app)
        .get(`/api/certifications/${certRes.body.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(fetchRes.status).toBe(404);
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
