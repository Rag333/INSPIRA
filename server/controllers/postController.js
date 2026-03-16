const Post = require('../models/Post');
const User = require('../models/User');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../config/cloudinary');
const streamifier = require('streamifier');
const mongoose = require('mongoose');

// @desc    Get feed
// @route   GET /feed
const getFeed = async (req, res, next) => {
  try {
    const userObj = req.user; 
    let likedPostIds = [];

    // 1. Build Base Query - Exclude logged-in user's posts
    let query = { user: { $ne: new mongoose.Types.ObjectId(userObj.id || userObj._id) } };

    // 2. Add search parameters if present
    const q = req.query.q;
    if (q) {
      query = {
        $and: [
          { user: { $ne: new mongoose.Types.ObjectId(userObj.id || userObj._id) } },
          {
            $or: [
              { title: { $regex: q, $options: 'i' } },
              { description: { $regex: q, $options: 'i' } },
              { tags: { $regex: q, $options: 'i' } }
            ]
          }
        ]
      };
    }

    // 3. Execute Query
    const posts = await Post.find(query)
      .populate('user', 'username profileImage')
      .sort({ createdAt: -1 });

    const fallbacks = [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
      'https://images.unsplash.com/photo-1505691938895-1758d7def511?w=600'
    ];

    // 4. Determine Liked Posts
    if (posts.length > 0) {
      const postIds = posts.map(p => p._id);
      const likedPosts = await Post.find({ _id: { $in: postIds }, likes: userObj._id }, '_id');
      likedPostIds = likedPosts.map(p => p._id.toString());
    }

    const formattedPosts = posts.map(p => ({
      ...p.toObject(),
      likesCount: (p.likes || []).length
    }));

    res.status(200).json({
      success: true,
      posts: formattedPosts,
      fallbacks,
      user: { 
        _id: userObj._id, 
        id: userObj._id, 
        username: userObj.username, 
        savedPosts: userObj.savedPosts 
      },
      likedPostIds
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new post with uploaded image
// @route   POST /createpost
const createPost = async (req, res, next) => {
  try {
    console.log('DEBUG: createPost hit. User:', req.user.id);
    if (!req.file) {
      console.log('DEBUG: createPost failed - No file provided');
      return res.status(400).json({ success: false, message: 'Please upload an image' });
    }

    const { title, description } = req.body;
    console.log('DEBUG: req.file.path:', req.file.path);

    const newPost = await Post.create({
      user: req.user.id,
      title,
      description,
      image: req.file.path, // Store the Cloudinary URL
      isAIGenerated: false
    });

    // Add to user posts array using findByIdAndUpdate to bypass other validations
    await User.findByIdAndUpdate(req.user.id, {
      $push: { posts: newPost._id }
    });

    // Get updated user with populated arrays for frontend sync
    const updatedUser = await User.findById(req.user.id)
      .populate('posts')
      .populate('savedPosts');

    res.status(201).json({ success: true, post: newPost, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate AI image (Mock) and save as post
// @route   POST /createpost/ai
const createAIPost = async (req, res, next) => {
  try {
    const { title, description, imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: 'Please provide imageUrl' });
    }

    // For AI images, we upload the external URL to Cloudinary
    let cloudImageUrl = '';
    try {
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: 'inspira_uploads_ai'
      });
      cloudImageUrl = uploadResult.secure_url;
    } catch (uploadErr) {
      console.error("Cloudinary AI upload failed:", uploadErr);
      cloudImageUrl = imageUrl; // Fallback to original URL
    }

    const newPost = await Post.create({
      user: req.user.id,
      title: title || 'AI Image',
      description,
      image: cloudImageUrl,
      isAIGenerated: true
    });

    // Add to user posts array
    await User.findByIdAndUpdate(req.user.id, {
      $push: { posts: newPost._id }
    });

    // Get updated user
    const updatedUser = await User.findById(req.user.id)
      .populate('posts')
      .populate('savedPosts');

    res.status(201).json({ success: true, post: newPost, user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Like / Unlike a post
// @route   POST /like/:id
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const likedIndex = post.likes.indexOf(req.user.id);
    let action = 'unliked';

    const update = (likedIndex > -1) 
      ? { $pull: { likes: req.user.id } } 
      : { $addToSet: { likes: req.user.id } };

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: false }
    );
    
    if (likedIndex === -1) {
      action = 'liked';
    }
    console.log(`DEBUG: toggleLike action: ${action} for post ${req.params.id}`);

    // Create Notification if liked (and not liking own post)
    if (action === 'liked' && post.user.toString() !== req.user.id.toString()) {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: post.user,
        likerProfileImage: req.user.profileImage,
        likerUsername: req.user.username,
        postImage: post.image,
        type: 'like'
      });
    }

    res.status(200).json({ success: true, likesCount: updatedPost.likes.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post
// @route   DELETE /post/:id
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id.toString()) {
       return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Cleanup: Remove from user's posts array
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { posts: req.params.id }
    });

    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete Post Error:', error);
    next(error);
  }
};

module.exports = {
  getFeed,
  createPost,
  createAIPost,
  toggleLike,
  deletePost
};
