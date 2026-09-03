const AppError = require("../utils/AppError");

const validateRequest = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return next(
      new AppError("Invalid request data.", 400, parsed.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })))
    );
  }

  req.body = parsed.data;
  return next();
};

module.exports = validateRequest;
