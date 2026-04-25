const express = require("express");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const { User, Certification } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");
const { requireRole, requireSelfOrRole } = require("../middleware/authorization");
const {
  JWT_EXPIRES_IN,
  generateAuthToken,
  authenticateToken,
  revokeToken,
} = require("../middleware/auth");

const router = express.Router();
const SALT_ROUNDS = 10;

function sanitizeUser(userInstance) {
  const user = userInstance.toJSON();
  delete user.passwordHash;
  return user;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, primaryGoal } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });

    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const createdUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "student",
      primaryGoal,
    });

    return res.status(201).json(sanitizeUser(createdUser));
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateAuthToken(user);

    return res.status(200).json({
      token,
      tokenType: "Bearer",
      expiresIn: JWT_EXPIRES_IN,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.use(authenticateToken);

router.post("/logout", async (req, res) => {
  revokeToken(req.token, req.auth.exp);
  return res.status(200).json({ message: "Logged out successfully" });
});

router.get("/validate-token", async (req, res) => {
  const user = await User.findByPk(Number(req.auth.sub));

  if (!user) {
    return res.status(401).json({ error: "Token user no longer exists" });
  }

  return res.status(200).json({ valid: true, user: sanitizeUser(user) });
});

router.use("/:id", validateIdParam);

router.get("/", requireRole("instructor", "admin"), async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = {};

    if (req.query.role) {
      where.role = req.query.role;
    }
    if (req.query.search) {
      const term = `%${req.query.search}%`;
      where[Op.or] = [
        { name: { [Op.like]: term } },
        { email: { [Op.like]: term } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      data: rows.map((u) => sanitizeUser(u)),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", requireSelfOrRole("id", "instructor", "admin"), async (req, res, next) => {
  try {
    const user = await User.findByPk(Number(req.params.id));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/certifications", requireSelfOrRole("id", "instructor", "admin"), async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = { userId: Number(req.params.id) };

    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.difficultyLevel) {
      where.difficultyLevel = req.query.difficultyLevel;
    }

    const { count, rows } = await Certification.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireRole("admin"), async (req, res, next) => {
  try {
    const { name, email, password, role, primaryGoal } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const createdUser = await User.create({
      name,
      email: normalizeEmail(email),
      passwordHash,
      role,
      primaryGoal,
    });

    return res.status(201).json(sanitizeUser(createdUser));
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", requireSelfOrRole("id", "admin"), async (req, res, next) => {
  try {
    const user = await User.findByPk(Number(req.params.id));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = { ...req.body };

    if (updates.password) {
      if (String(updates.password).length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      updates.passwordHash = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }

    delete updates.password;

    if (updates.email) {
      updates.email = normalizeEmail(updates.email);
    }

    if (req.auth.role !== "admin") {
      delete updates.role;
    }

    await user.update(updates);
    return res.status(200).json(sanitizeUser(user));
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", requireSelfOrRole("id", "admin"), async (req, res, next) => {
  try {
    const user = await User.findByPk(Number(req.params.id));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
