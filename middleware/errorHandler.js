// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  // Mongoose CastError (bad ObjectId)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    return res.status(404).json({
      success: false,
      message: "Resource not found (invalid ID format)",
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for field: ${field}`,
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export { notFound, errorHandler };
