const express = require("express");
const { LearningResource } = require("../database/models");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const resources = await LearningResource.findAll();
    return res.status(200).json(resources);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.status(200).json(resource);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const resource = await LearningResource.create(req.body);
    return res.status(201).json(resource);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    await resource.update(req.body);
    return res.status(200).json(resource);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    await resource.destroy();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
