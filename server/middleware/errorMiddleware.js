const errorHandler = (err, req, res, next) => {
  // Log the error internally for debugging (never exposed to client)
  console.error(`[Error] ${err.name}: ${err.message}`);
  
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errorCode: 'VALIDATION_ERROR',
      errors
    });
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId like /users/undefined)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field: ${err.path}`,
      errorCode: 'INVALID_ID'
    });
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate field value entered for ${field}`,
      errorCode: 'DUPLICATE_KEY_ERROR'
    });
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
      errorCode: 'INVALID_TOKEN'
    });
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
        errorCode: 'LIMIT_FILE_SIZE'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      errorCode: err.code
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your token has expired. Please log in again.',
      errorCode: 'EXPIRED_TOKEN'
    });
  }

  // Default Fallback Server Error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: 'An unexpected error occurred on the server',
    errorCode: 'INTERNAL_SERVER_ERROR',
    // Only include detailed message in development
    ...(process.env.NODE_ENV !== 'production' && { detail: err.message })
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route Not Found: ${req.originalUrl}`,
    errorCode: 'NOT_FOUND'
  });
};

module.exports = { errorHandler, notFoundHandler };
