const express = require("express");
const { Certification } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);
router.use("/:id", validateIdParam);

router.get("/", async (req, res, next) => {
  try {
    const where = req.auth.role === "admin" ? {} : { userId: Number(req.auth.sub) };
    const certifications = await Certification.findAll({ where });
    return res.status(200).json(certifications);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const certification = await Certification.findByPk(req.params.id);

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    if (req.auth.role !== "admin" && certification.userId !== Number(req.auth.sub)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(200).json(certification);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (req.auth.role !== "admin") {
      payload.userId = Number(req.auth.sub);
    }

    const certification = await Certification.create(payload);
    return res.status(201).json(certification);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const certification = await Certification.findByPk(req.params.id);

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    if (req.auth.role !== "admin" && certification.userId !== Number(req.auth.sub)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const payload = { ...req.body };

    if (req.auth.role !== "admin") {
      delete payload.userId;
    }

    await certification.update(payload);
    return res.status(200).json(certification);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const certification = await Certification.findByPk(req.params.id);

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    if (req.auth.role !== "admin" && certification.userId !== Number(req.auth.sub)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await certification.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
