const express = require("express");
const { Certification } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");
const { authenticateToken } = require("../middleware/auth");
const {
  scopeCollectionToOwner,
  authorizeRecordAccess,
} = require("../middleware/authorization");

const router = express.Router();

const authorizeCertificationRead = authorizeRecordAccess({
  loadRecord: (req) => Certification.findByPk(req.params.id),
  getOwnerId: (certification) => certification.userId,
  attachKey: "certification",
  notFoundMessage: "Certification not found",
  allowedRoles: ["instructor", "admin"],
});

const authorizeCertificationWrite = authorizeRecordAccess({
  loadRecord: (req) => Certification.findByPk(req.params.id),
  getOwnerId: (certification) => certification.userId,
  attachKey: "certification",
  notFoundMessage: "Certification not found",
  allowedRoles: ["admin"],
});

router.use(authenticateToken);
router.use("/:id", validateIdParam);

router.get("/", scopeCollectionToOwner("userId", "instructor", "admin"), async (req, res, next) => {
  try {
    const certifications = await Certification.findAll({ where: req.accessFilter });
    return res.status(200).json(certifications);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", authorizeCertificationRead, async (req, res, next) => {
  try {
    return res.status(200).json(req.certification);
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

router.put("/:id", authorizeCertificationWrite, async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (req.auth.role !== "admin") {
      delete payload.userId;
    }

    await req.certification.update(payload);
    return res.status(200).json(req.certification);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", authorizeCertificationWrite, async (req, res, next) => {
  try {
    await req.certification.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
