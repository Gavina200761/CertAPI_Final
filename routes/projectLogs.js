const express = require("express");
const { ProjectLog, Certification } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);
router.use("/:id", validateIdParam);

router.get("/", async (req, res, next) => {
  try {
    const where = req.auth.role === "admin" ? {} : { userId: Number(req.auth.sub) };
    const projectLogs = await ProjectLog.findAll({ where });
    return res.status(200).json(projectLogs);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const projectLog = await ProjectLog.findByPk(req.params.id);

    if (!projectLog) {
      return res.status(404).json({ error: "Project log not found" });
    }

    if (req.auth.role !== "admin" && projectLog.userId !== Number(req.auth.sub)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(200).json(projectLog);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (req.auth.role !== "admin") {
      payload.userId = Number(req.auth.sub);

      if (payload.certificationId) {
        const certification = await Certification.findByPk(payload.certificationId);

        if (!certification || certification.userId !== payload.userId) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }
    }

    const projectLog = await ProjectLog.create(payload);
    return res.status(201).json(projectLog);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const projectLog = await ProjectLog.findByPk(req.params.id);

    if (!projectLog) {
      return res.status(404).json({ error: "Project log not found" });
    }

    if (req.auth.role !== "admin" && projectLog.userId !== Number(req.auth.sub)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const payload = { ...req.body };

    if (req.auth.role !== "admin") {
      delete payload.userId;

      if (payload.certificationId) {
        const certification = await Certification.findByPk(payload.certificationId);

        if (!certification || certification.userId !== Number(req.auth.sub)) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }
    }

    await projectLog.update(payload);
    return res.status(200).json(projectLog);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const projectLog = await ProjectLog.findByPk(req.params.id);

    if (!projectLog) {
      return res.status(404).json({ error: "Project log not found" });
    }

    if (req.auth.role !== "admin" && projectLog.userId !== Number(req.auth.sub)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await projectLog.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
