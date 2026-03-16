/**
 * Global Error Handling Middleware
 * Placed at the very end of the express middleware stack
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.stack); // Log the error stack to console

  // Default status code and message
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Specific error handling logic
  // e.g., Mongoose Validation errors, duplicate key errors, etc.
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(val => val.message)
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate Field Value Entered',
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found. Invalid: ${err.path}`,
    });
  }
  
  // Multer specific errors
  if (err.name === 'MulterError') {
     return res.status(400).json({
       success: false,
       message: `Upload Error: ${err.message}`
     })
  }

  // Cloudinary/Storage Errors
  const isCloudinaryError = (err.message && (
    err.message.includes('cloudinary') || 
    err.message.includes('CLOUDINARY') || 
    err.message.includes('Must provide cloud_name') ||
    err.message.includes('Must provide api_key')
  ));

  if (isCloudinaryError) {
    return res.status(500).json({
      success: false,
      message: 'Infrastructure Error: Cloudinary is not configured correctly.',
      error: 'Your Cloudinary API credentials (CLOUD_NAME, API_KEY, API_SECRET) are missing from your Render Environment Variables. Please add them to your Render dashboard to enable image uploads.'
    });
  }

  // Generic fallback
  res.status(statusCode).json({
    success: false,
    message: message,
    error: err.message, 
    details: err,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
