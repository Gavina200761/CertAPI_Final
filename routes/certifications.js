const express = require("express");
const { Certification } = require("../database/models");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const certifications = await Certification.findAll();
    return res.status(200).json(certifications);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const certification = await Certification.findByPk(req.params.id);

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    return res.status(200).json(certification);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const certification = await Certification.create(req.body);
    return res.status(201).json(certification);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const certification = await Certification.findByPk(req.params.id);

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    await certification.update(req.body);
    return res.status(200).json(certification);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const certification = await Certification.findByPk(req.params.id);

    if (!certification) {
      return res.status(404).json({ error: "Certification not found" });
    }

    await certification.destroy();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
