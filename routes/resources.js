const express = require("express");
const { LearningResource } = require("../database/models");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const resources = await LearningResource.findAll();
    return res.status(200).json(resources);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.status(200).json(resource);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const resource = await LearningResource.create(req.body);
    return res.status(201).json(resource);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    await resource.update(req.body);
    return res.status(200).json(resource);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    await resource.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
