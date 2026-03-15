const User = require('../models/User');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('savedPosts')
      .populate('posts');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const editProfile = async (req, res, next) => {
  try {
    const { fullname, email, bio } = req.body;
    
    const updateFields = {};
    if (fullname !== undefined) updateFields.fullname = fullname;
    if (email !== undefined) updateFields.email = email;
    if (bio !== undefined) updateFields.bio = bio;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('savedPosts').populate('posts');

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: req.file.filename },
      { new: true }
    ).populate('savedPosts').populate('posts');

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('posts');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const Notification = require('../models/Notification');

const toggleSave = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const postId = req.params.id;

    if (!user) return res.status(404).json({ success: false });

    const isSaved = user.savedPosts.includes(postId);

    if (isSaved) {
      user.savedPosts.pull(postId);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();
    await user.populate('savedPosts');
    await user.populate('posts');

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);
      
    const unread = notifications.filter(n => !n.read).length;
    res.status(200).json({ success: true, notifications, unread });
  } catch (error) {
    next(error);
  }
};

const markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  editProfile,
  uploadProfileImage,
  getUserProfile,
  toggleSave,
  getNotifications,
  markNotificationsRead
};
