const { ZodError } = require('zod');

const { errorResponse } = require('../utils/apiResponse');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));

        return errorResponse(res, 'Validation failed', 400, validationErrors);
      }

      return next(error);
    }
  };
};

module.exports = {
  validate,
};
