const User = require('../models/User');
const jwt = require('jsonwebtoken');

const sendTokenResponse = (user, statusCode, res, message) => {
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ id: user._id }, secret, { expiresIn: '30d' });

  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      message,
      user: {
        _id: user._id, // Provide _id in response payload
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        fullname: user.fullname
      }
    });
};

const registerUser = async (req, res, next) => {
  try {
    const { username, email, password, fullname } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or Username already exists' });
    }

    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      fullname
    });

    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Allow login by either username or email as sent from frontend
    const loginIdentifier = username || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Provide username/email and password' });
    }

    const user = await User.findOne({ 
      $or: [{ email: loginIdentifier.toLowerCase() }, { username: loginIdentifier.toLowerCase() }] 
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const logoutUser = (req, res, next) => {
  try {
    const options = {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production'
    };
    res.cookie('token', 'none', options);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const OTP = require('../models/OTP');
const generateOTP = require('../utils/generateOTP');
const { sendOTPEmail } = require('../services/mailService');

const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    
    const otp = generateOTP();
    await OTP.create({ email, otp });

    const result = await sendOTPEmail(email, otp);
    
    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      previewUrl: result.previewUrl 
    });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    const validOTP = await OTP.findOne({ email, otp });
    
    if (!validOTP) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    await OTP.deleteOne({ _id: validOTP._id });

    await User.findOneAndUpdate({ email: email.toLowerCase() }, { isEmailVerified: true });
    
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success anyway to prevent email enumeration attacks
      return res.status(200).json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
    }

    const otp = generateOTP();
    await OTP.create({ email, otp });

    const result = await sendOTPEmail(email, otp);
    
    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      previewUrl: result.previewUrl 
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, OTP, and new password' });
    }

    const validOTP = await OTP.findOne({ email, otp });
    
    if (!validOTP) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Delete the OTP as it's single use
    await OTP.deleteOne({ _id: validOTP._id });

    // Find user and update password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword; // The pre-save hook will hash this
    await user.save();
    
    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword
};
