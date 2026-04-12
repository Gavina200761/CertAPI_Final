function notFoundHandler(req, res, next) {
  res.status(404).json({ error: "Route not found" });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: "Malformed JSON body",
      details: "Request body must contain valid JSON",
    });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors.map((issue) => ({
        field: issue.path,
        message: issue.message,
      })),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      error: "Unique constraint error",
      details: err.errors.map((issue) => ({
        field: issue.path,
        message: issue.message,
      })),
    });
  }

  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      error: "Invalid reference",
      details: "Referenced related record does not exist",
    });
  }

  if (err.name && err.name.startsWith("SequelizeConnection")) {
    return res.status(500).json({
      error: "Database connection error",
      details: "Unable to reach the database",
    });
  }

  return res.status(500).json({
    error: "Internal server error",
    details: err.message,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
