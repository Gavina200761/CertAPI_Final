function hasAnyRole(req, roles) {
  return Boolean(req.auth && roles.includes(req.auth.role));
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!hasAnyRole(req, roles)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
}

function requireSelfOrRole(paramName, ...roles) {
  return (req, res, next) => {
    const requestedId = Number(req.params[paramName]);

    if (Number(req.auth.sub) === requestedId || hasAnyRole(req, roles)) {
      return next();
    }

    return res.status(403).json({ error: "Forbidden" });
  };
}

function scopeCollectionToOwner(ownerField, ...roles) {
  return (req, res, next) => {
    req.accessFilter = hasAnyRole(req, roles)
      ? {}
      : { [ownerField]: Number(req.auth.sub) };

    return next();
  };
}

function authorizeRecordAccess({ loadRecord, getOwnerId, attachKey, notFoundMessage, allowedRoles = [] }) {
  return async (req, res, next) => {
    try {
      const record = await loadRecord(req);

      if (!record) {
        return res.status(404).json({ error: notFoundMessage });
      }

      req[attachKey] = record;

      if (hasAnyRole(req, allowedRoles) || Number(getOwnerId(record, req)) === Number(req.auth.sub)) {
        return next();
      }

      return res.status(403).json({ error: "Forbidden" });
    } catch (error) {
      return next(error);
    }
  };
}

function authorizeBodyRelation({
  field,
  loadRecord,
  getOwnerId,
  notFoundMessage,
  allowedRoles = [],
}) {
  return async (req, res, next) => {
    try {
      if (hasAnyRole(req, allowedRoles) || !req.body[field]) {
        return next();
      }

      const record = await loadRecord(req.body[field], req);

      if (!record) {
        return res.status(404).json({ error: notFoundMessage });
      }

      if (Number(getOwnerId(record, req)) !== Number(req.auth.sub)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  requireRole,
  requireSelfOrRole,
  scopeCollectionToOwner,
  authorizeRecordAccess,
  authorizeBodyRelation,
};