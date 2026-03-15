const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isLoggedIn = async (req, res, next) => {
  try {
    let token;

    // Check cookies for token
    if (req.cookies.token) {
      token = req.cookies.token;
    } 
    // Fallback to checking Authorization header Support (Bearer token)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route. No token provided.' });
    }

    try {
      // Verify token
      const secret = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);

      // Attach user to request
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this route. Invalid token.' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Server Error in Auth Middleware' });
  }
};

module.exports = isLoggedIn;
