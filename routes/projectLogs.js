const express = require("express");
const { Op } = require("sequelize");
const { ProjectLog, Certification } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");
const { authenticateToken } = require("../middleware/auth");
const {
  scopeCollectionToOwner,
  authorizeRecordAccess,
  authorizeBodyRelation,
} = require("../middleware/authorization");

const router = express.Router();

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

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
    const { page, limit, offset } = parsePagination(req.query);
    const where = { ...req.accessFilter };

    if (req.query.certificationId) {
      where.certificationId = parseInt(req.query.certificationId, 10);
    }
    if (req.query.metric) {
      where.metric = req.query.metric;
    }
    if (req.query.startDate) {
      where.date = { ...where.date, [Op.gte]: req.query.startDate };
    }
    if (req.query.endDate) {
      where.date = { ...where.date, [Op.lte]: req.query.endDate };
    }

    const { count, rows } = await ProjectLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
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
