function validateIdParam(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "Invalid id parameter",
      details: "id must be a positive integer",
    });
  }

  return next();
}

module.exports = validateIdParam;
