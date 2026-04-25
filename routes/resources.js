const express = require("express");
const { LearningResource, Certification } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);
router.use("/:id", validateIdParam);

router.get("/", async (req, res, next) => {
  try {
    const query = {
      include: [{
        model: Certification,
        as: "certification",
        attributes: ["id", "userId"],
        required: true,
      }],
    };

    if (req.auth.role !== "admin") {
      query.include[0].where = { userId: Number(req.auth.sub) };
    }

    const resources = await LearningResource.findAll(query);
    return res.status(200).json(resources);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id, {
      include: [{
        model: Certification,
        as: "certification",
        attributes: ["id", "userId"],
      }],
    });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (req.auth.role !== "admin" && resource.certification.userId !== Number(req.auth.sub)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.status(200).json(resource);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (req.auth.role !== "admin") {
      const certification = await Certification.findByPk(req.body.certificationId);

      if (!certification || certification.userId !== Number(req.auth.sub)) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const resource = await LearningResource.create(req.body);
    return res.status(201).json(resource);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id, {
      include: [{
        model: Certification,
        as: "certification",
        attributes: ["id", "userId"],
      }],
    });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (req.auth.role !== "admin" && resource.certification.userId !== Number(req.auth.sub)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.auth.role !== "admin" && req.body.certificationId) {
      const certification = await Certification.findByPk(req.body.certificationId);

      if (!certification || certification.userId !== Number(req.auth.sub)) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    await resource.update(req.body);
    return res.status(200).json(resource);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const resource = await LearningResource.findByPk(req.params.id, {
      include: [{
        model: Certification,
        as: "certification",
        attributes: ["id", "userId"],
      }],
    });

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (req.auth.role !== "admin" && resource.certification.userId !== Number(req.auth.sub)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await resource.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
