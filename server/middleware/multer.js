const multer = require('multer');
const { storage } = require('../config/cloudinary');

// Initialize multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB LIMIT
  },
});

module.exports = upload;

module.exports = upload;
