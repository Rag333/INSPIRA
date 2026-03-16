require('dotenv').config();
const express = require('express');
const path = require('path');
const dns = require('dns');
const fs = require('fs');

// Force Node to prefer IPv4 over IPv6. 
// This fixes ENETUNREACH errors when connecting to Gmail/SMTP on cloud providers like Render.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const passport = require('passport');
require('./config/passport');

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

// Middleware Setup
// 1. CORS (Must be first to handle preflights and ensure headers on error/blocks)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow if in whitelist OR if it's a Vercel preview subdomain for this project
    const isVercelPreview = origin.endsWith('.vercel.app') && origin.includes('inspira');
    if (allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, origin);
    } else {
      console.log(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// 2. Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// 3. Rate Limiting (Moved after CORS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, // Increased limit for testing phase
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 4. Performance
app.use(compression());

// Logging based on environment
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(logger(logFormat));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.get('/images/uploads/:filename', (req, res, next) => {
  const filePath = path.join(__dirname, 'public', 'images', 'uploads', req.params.filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist, redirect to aesthetic placeholder
      return res.redirect('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80');
    }
    next(); // Continue to static middleware
  });
});

app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'inspira-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Robust Health Check (Directly on app to avoid router mounting issues)
app.get('/health', (req, res) => res.json({ status: 'ok', environment: process.env.NODE_ENV }));
app.get('/', (req, res) => res.json({ message: 'Inspira Backend is running!' }));

// Google OAuth Routes (Moved here for better isolation)
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login` 
  }),
  (req, res) => {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/feed`);
  }
);

// Mount Routes
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
