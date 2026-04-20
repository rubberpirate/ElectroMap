const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: null,
    timestamp: new Date().toISOString(),
  });
};

const errorResponse = (res, message = 'Request failed', statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  successResponse,
  errorResponse,
};
