const { validationResult } = require('express-validator');

/**
 * Middleware to check for validation errors from express-validator.
 * If errors exist, returns a 400 response with error details.
 * Otherwise, passes control to the next middleware.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

module.exports = validate;
