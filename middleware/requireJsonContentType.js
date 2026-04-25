function requireJsonContentType(req, res, next) {
  const methodsToValidate = ["POST", "PUT", "PATCH"];

  if (!methodsToValidate.includes(req.method)) {
    return next();
  }

  const hasBody = req.headers["content-length"] && Number(req.headers["content-length"]) > 0;
  if (!hasBody) {
    return next();
  }

  if (!req.is("application/json")) {
    return res.status(415).json({
      error: "Content-Type must be application/json",
    });
  }

  return next();
}

module.exports = requireJsonContentType;
