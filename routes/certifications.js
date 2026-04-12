const express = require("express");
const { Certification } = require("../database/models");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const certifications = await Certification.findAll();
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

    return res.status(200).json(certification);
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const certification = await Certification.create(req.body);
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

    await certification.update(req.body);
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

    await certification.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
