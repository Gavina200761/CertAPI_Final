const express = require("express");
const { Op } = require("sequelize");
const { Certification, LearningResource, ProjectLog } = require("../database/models");
const validateIdParam = require("../middleware/validateIdParam");
const { authenticateToken } = require("../middleware/auth");
const {
  scopeCollectionToOwner,
  authorizeRecordAccess,
} = require("../middleware/authorization");

const router = express.Router();

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

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
    const { page, limit, offset } = parsePagination(req.query);
    const where = { ...req.accessFilter };

    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.difficultyLevel) {
      where.difficultyLevel = req.query.difficultyLevel;
    }
    if (req.query.search) {
      const term = `%${req.query.search}%`;
      where[Op.or] = [
        { title: { [Op.like]: term } },
        { provider: { [Op.like]: term } },
        { description: { [Op.like]: term } },
      ];
    }

    const { count, rows } = await Certification.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
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

router.get("/:id/resources", authorizeCertificationRead, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = { certificationId: req.certification.id };

    if (req.query.type) {
      where.type = req.query.type;
    }
    if (req.query.isCompleted !== undefined) {
      where.isCompleted = req.query.isCompleted === "true";
    }

    const { count, rows } = await LearningResource.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      data: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/project-logs", authorizeCertificationRead, async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const where = { certificationId: req.certification.id };

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

router.get("/:id/progress", authorizeCertificationRead, async (req, res, next) => {
  try {
    const certId = req.certification.id;

    const [resources, logs] = await Promise.all([
      LearningResource.findAll({ where: { certificationId: certId } }),
      ProjectLog.findAll({
        where: { certificationId: certId },
        order: [["date", "ASC"]],
      }),
    ]);

    const totalResources = resources.length;
    const completedResources = resources.filter((r) => r.isCompleted).length;
    const totalMinutes = resources.reduce((sum, r) => sum + r.estimatedTimeMinutes, 0);
    const completedMinutes = resources
      .filter((r) => r.isCompleted)
      .reduce((sum, r) => sum + r.estimatedTimeMinutes, 0);

    return res.status(200).json({
      certificationId: req.certification.id,
      title: req.certification.title,
      status: req.certification.status,
      difficultyLevel: req.certification.difficultyLevel,
      resources: {
        total: totalResources,
        completed: completedResources,
        completionPercent:
          totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0,
        totalEstimatedMinutes: totalMinutes,
        completedEstimatedMinutes: completedMinutes,
      },
      projectLogs: {
        total: logs.length,
        firstLogDate: logs.length > 0 ? logs[0].date : null,
        lastLogDate: logs.length > 0 ? logs[logs.length - 1].date : null,
      },
    });
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
