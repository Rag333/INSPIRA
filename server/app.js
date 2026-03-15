require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

// Connect to Database
const connectDB = require('./config/db');
connectDB();

// Global Route Import
const routes = require('./routes/index');

// Error Handler
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware Setup
// CORS configuration to allow credentials (cookies) to be sent from frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(logger('dev'));
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
