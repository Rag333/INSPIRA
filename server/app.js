require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Global Route Import
const routes = require('./routes/index');

// Error Handler
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy for Render/Vercel (needed for rate limiting and secure cookies)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests or specific routes
// For now, applying to all to be safe for production
app.use(limiter);

// Performance
app.use(compression());

// Middleware Setup
// CORS configuration to allow credentials (cookies) to be sent from frontend


// Logging based on environment
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(logger(logFormat));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Mount Routes directly on root to match client requests
app.use('/', routes);


// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found ' + req.originalUrl);
  err.status = 404;
  next(err);
});

// Custom Error Handler Middleware
app.use(errorHandler);

module.exports = app;
