const express = require('express');
const router = express.Router();

const auth = require('../controllers/authController');
const user = require('../controllers/userController');
const post = require('../controllers/postController');
const isLoggedIn = require('../middleware/isLoggedIn');
const upload = require('../middleware/multer');


// Standard Authentication
router.post('/register', auth.registerUser);
router.post('/login', auth.loginUser);
router.get('/logout', auth.logoutUser);
router.post('/send-otp', auth.sendOTP);
router.post('/verify-otp', auth.verifyOTP);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

// Profile and User
router.get('/profile', isLoggedIn, user.getProfile);
router.post('/profile/edit', isLoggedIn, user.editProfile);
router.post('/uploadfile', isLoggedIn, upload.single('image'), user.uploadProfileImage);
router.get('/user/:username', user.getUserProfile);
router.post('/save/:id', isLoggedIn, user.toggleSave);

// Feed and Posts
router.get('/feed', isLoggedIn, post.getFeed);
router.post('/createpost', isLoggedIn, upload.single('image'), post.createPost);
router.post('/createpost/ai', isLoggedIn, post.createAIPost);
router.post('/like/:id', isLoggedIn, post.toggleLike);
router.delete('/post/:id', isLoggedIn, post.deletePost);

// Notifications
router.get('/notifications', isLoggedIn, user.getNotifications);
router.post('/notifications/read', isLoggedIn, user.markNotificationsRead);

module.exports = router;
