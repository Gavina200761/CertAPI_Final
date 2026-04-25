const express = require("express");
const { ProjectLog, Certification } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");
const { authenticateToken } = require("../middleware/auth");
const {
  scopeCollectionToOwner,
  authorizeRecordAccess,
  authorizeBodyRelation,
} = require("../middleware/authorization");

const router = express.Router();

const authorizeProjectLogRead = authorizeRecordAccess({
  loadRecord: (req) => ProjectLog.findByPk(req.params.id),
  getOwnerId: (projectLog) => projectLog.userId,
  attachKey: "projectLog",
  notFoundMessage: "Project log not found",
  allowedRoles: ["instructor", "admin"],
});

const authorizeProjectLogWrite = authorizeRecordAccess({
  loadRecord: (req) => ProjectLog.findByPk(req.params.id),
  getOwnerId: (projectLog) => projectLog.userId,
  attachKey: "projectLog",
  notFoundMessage: "Project log not found",
  allowedRoles: ["admin"],
});

const authorizeProjectLogCertificationTarget = authorizeBodyRelation({
  field: "certificationId",
  loadRecord: (certificationId) => Certification.findByPk(certificationId),
  getOwnerId: (certification) => certification.userId,
  notFoundMessage: "Certification not found",
  allowedRoles: ["admin"],
});

router.use(authenticateToken);
router.use("/:id", validateIdParam);

router.get("/", scopeCollectionToOwner("userId", "instructor", "admin"), async (req, res, next) => {
  try {
    const projectLogs = await ProjectLog.findAll({ where: req.accessFilter });
    return res.status(200).json(projectLogs);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", authorizeProjectLogRead, async (req, res, next) => {
  try {
    return res.status(200).json(req.projectLog);
  } catch (error) {
    return next(error);
  }
});

router.post("/", authorizeProjectLogCertificationTarget, async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (req.auth.role !== "admin") {
      payload.userId = Number(req.auth.sub);
    }

    const projectLog = await ProjectLog.create(payload);
    return res.status(201).json(projectLog);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", authorizeProjectLogWrite, authorizeProjectLogCertificationTarget, async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (req.auth.role !== "admin") {
      delete payload.userId;
    }

    await req.projectLog.update(payload);
    return res.status(200).json(req.projectLog);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", authorizeProjectLogWrite, async (req, res, next) => {
  try {
    await req.projectLog.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
