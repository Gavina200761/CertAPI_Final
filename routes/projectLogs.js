const express = require("express");
const { ProjectLog } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");

const router = express.Router();

router.use("/:id", validateIdParam);

router.get("/", async (req, res, next) => {
  try {
    const projectLogs = await ProjectLog.findAll();
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

    return res.status(200).json(projectLog);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const projectLog = await ProjectLog.create(req.body);
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

    await projectLog.update(req.body);
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

    await projectLog.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
