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
      console.log('DEBUG: Auth failed - No token found in cookies or headers');
      console.log('DEBUG: Cookies received:', req.cookies);
      return res.status(401).json({ success: false, message: 'Not authorized to access this route. No token provided.' });
    }

    try {
      // Verify token
      const secret = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);

      // Attach user to request
      const user = await User.findById(decoded.id);
      
      if (!user) {
        console.log(`DEBUG: Auth failed - User with ID ${decoded.id} not found`);
        return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
      }

      req.user = user;
      next();
    } catch (err) {
      console.log('DEBUG: Auth failed - JWT verification error:', err.message);
      return res.status(401).json({ success: false, message: 'Not authorized to access this route. Invalid token.' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Server Error in Auth Middleware' });
  }
};

module.exports = isLoggedIn;
