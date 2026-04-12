function notFoundHandler(req, res, next) {
  res.status(404).json({ error: "Route not found" });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
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
