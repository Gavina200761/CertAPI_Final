const express = require("express");
const { Op } = require("sequelize");
const { LearningResource, Certification } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");
const { authenticateToken } = require("../middleware/auth");
const {
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

function buildResourceQuery() {
  return {
    include: [{
      model: Certification,
      as: "certification",
      attributes: ["id", "userId"],
      required: true,
    }],
  };
}

const authorizeResourceRead = authorizeRecordAccess({
  loadRecord: (req) => LearningResource.findByPk(req.params.id, buildResourceQuery()),
  getOwnerId: (resource) => resource.certification.userId,
  attachKey: "resource",
  notFoundMessage: "Resource not found",
  allowedRoles: ["instructor", "admin"],
});

const authorizeResourceWrite = authorizeRecordAccess({
  loadRecord: (req) => LearningResource.findByPk(req.params.id, buildResourceQuery()),
  getOwnerId: (resource) => resource.certification.userId,
  attachKey: "resource",
  notFoundMessage: "Resource not found",
  allowedRoles: ["admin"],
});

const authorizeResourceCertificationTarget = authorizeBodyRelation({
  field: "certificationId",
  loadRecord: (certificationId) => Certification.findByPk(certificationId),
  getOwnerId: (certification) => certification.userId,
  notFoundMessage: "Certification not found",
  allowedRoles: ["admin"],
});

router.use(authenticateToken);
router.use("/:id", validateIdParam);

router.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const query = buildResourceQuery();

    if (!["instructor", "admin"].includes(req.auth.role)) {
      query.include[0].where = { userId: Number(req.auth.sub) };
    }

    const where = {};
    if (req.query.type) {
      where.type = req.query.type;
    }
    if (req.query.isCompleted !== undefined) {
      where.isCompleted = req.query.isCompleted === "true";
    }
    if (req.query.certificationId) {
      where.certificationId = parseInt(req.query.certificationId, 10);
    }
    if (req.query.search) {
      where.title = { [Op.like]: `%${req.query.search}%` };
    }

    query.where = where;
    query.limit = limit;
    query.offset = offset;
    query.order = [["createdAt", "DESC"]];

    const { count, rows } = await LearningResource.findAndCountAll(query);
    return res.status(200).json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", authorizeResourceRead, async (req, res, next) => {
  try {
    return res.status(200).json(req.resource);
  } catch (error) {
    return next(error);
  }
});

router.post("/", authorizeResourceCertificationTarget, async (req, res, next) => {
  try {
    const resource = await LearningResource.create(req.body);
    return res.status(201).json(resource);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", authorizeResourceWrite, authorizeResourceCertificationTarget, async (req, res, next) => {
  try {
    await req.resource.update(req.body);
    return res.status(200).json(req.resource);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", authorizeResourceWrite, async (req, res, next) => {
  try {
    await req.resource.destroy();
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/toggle-complete", authorizeResourceWrite, async (req, res, next) => {
  try {
    await req.resource.update({ isCompleted: !req.resource.isCompleted });
    return res.status(200).json(req.resource);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
