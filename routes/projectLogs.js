const express = require("express");
const { ProjectLog } = require("../database/models");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const projectLogs = await ProjectLog.findAll();
    return res.status(200).json(projectLogs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const projectLog = await ProjectLog.findByPk(req.params.id);

    if (!projectLog) {
      return res.status(404).json({ error: "Project log not found" });
    }

    return res.status(200).json(projectLog);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const projectLog = await ProjectLog.create(req.body);
    return res.status(201).json(projectLog);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const projectLog = await ProjectLog.findByPk(req.params.id);

    if (!projectLog) {
      return res.status(404).json({ error: "Project log not found" });
    }

    await projectLog.update(req.body);
    return res.status(200).json(projectLog);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const projectLog = await ProjectLog.findByPk(req.params.id);

    if (!projectLog) {
      return res.status(404).json({ error: "Project log not found" });
    }

    await projectLog.destroy();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
