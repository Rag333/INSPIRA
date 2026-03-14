const express = require("express");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const userModel = require("./users");
const postModel = require("./posts");
const upload = require("../multer");

passport.use(new LocalStrategy(userModel.authenticate()));

// =========================
// UTILITIES
// =========================

// async wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// escape regex
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

// =========================
// AUTH MIDDLEWARE
// =========================

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ success: false, message: "Unauthorized" });
}

// attach logged user
async function getUser(req, res, next) {
  req.currentUser = await userModel.findOne({
    username: req.session.passport.user,
  });
  next();
}

// =========================
// PROFILE
// =========================

router.get(
  "/profile",
  isLoggedIn,
  getUser,
  asyncHandler(async (req, res) => {
    const user = await userModel
      .findById(req.currentUser._id)
      .populate("posts savedPosts");

    res.json({ success: true, user });
  }),
);

// =========================
// PUBLIC USER PROFILE
// =========================

router.get(
  "/user/:username",
  isLoggedIn,
  asyncHandler(async (req, res) => {
    const user = await userModel
      .findOne({ username: req.params.username })
      .populate("posts");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      user: {
        username: user.username,
        fullname: user.fullname,
        profileImage: user.profileImage,
        posts: user.posts,
      },
    });
  }),
);

// =========================
// FEED
// =========================

router.get(
  "/feed",
  isLoggedIn,
  getUser,
  asyncHandler(async (req, res) => {
    let searchCriteria = {};
    if (req.query.q) {
      const safeQuery = escapeRegex(req.query.q.trim());
      searchCriteria = {
        $or: [
          { title: { $regex: safeQuery, $options: "i" } },
          { description: { $regex: safeQuery, $options: "i" } },
        ],
      };
    }

    const posts = await postModel
      .find({
        ...searchCriteria,
        user: { $ne: req.currentUser._id },
      })
      .populate("user")
      .sort({ _id: -1 });

    res.json({
      success: true,
      posts,
      likedPostIds: (req.currentUser.likedPosts || []).map((id) =>
        id.toString(),
      ),
    });
  }),
);

// =========================
// CREATE POST
// =========================

router.post(
  "/createpost",
  isLoggedIn,
  getUser,
  upload.single("postImage"),
  asyncHandler(async (req, res) => {
    const post = await postModel.create({
      user: req.currentUser._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    });

    req.currentUser.posts.push(post._id);
    await req.currentUser.save();

    res.json({ success: true, post });
  }),
);

// =========================
// AI POST
// =========================

router.post(
  "/createpost/ai",
  isLoggedIn,
  getUser,
  asyncHandler(async (req, res) => {
    const { title, description, imageUrl } = req.body;

    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "arraybuffer",
    });

    const fileName = uuidv4() + ".jpg";
    const filePath = path.join(__dirname, "../public/images/uploads", fileName);

    await fs.writeFile(filePath, response.data);

    const post = await postModel.create({
      user: req.currentUser._id,
      title,
      description,
      image: fileName,
    });

    req.currentUser.posts.push(post._id);
    await req.currentUser.save();

    res.json({ success: true, post });
  }),
);

// =========================
// LIKE POST
// =========================

router.post(
  "/like/:postId",
  isLoggedIn,
  getUser,
  asyncHandler(async (req, res) => {
    const post = await postModel.findById(req.params.postId);

    const liked = req.currentUser.likedPosts.includes(post._id);

    if (liked) {
      req.currentUser.likedPosts.pull(post._id);
      post.likesCount--;
    } else {
      req.currentUser.likedPosts.push(post._id);
      post.likesCount++;
    }

    await req.currentUser.save();
    await post.save();

    res.json({
      success: true,
      liked: !liked,
      likesCount: post.likesCount,
    });
  }),
);

// =========================
// DELETE POST
// =========================

router.delete(
  "/post/:postId",
  isLoggedIn,
  getUser,
  asyncHandler(async (req, res) => {
    const post = await postModel.findById(req.params.postId);

    if (!post) return res.status(404).json({ success: false });

    if (post.user.toString() !== req.currentUser._id.toString())
      return res.status(403).json({ success: false });

    const imagePath = path.join(
      __dirname,
      "../public/images/uploads",
      post.image,
    );

    await fs.unlink(imagePath).catch(() => {});

    req.currentUser.posts.pull(post._id);

    await req.currentUser.save();
    await post.deleteOne();

    res.json({ success: true });
  }),
);

// =========================
// AUTH
// =========================

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, email, fullname, password } = req.body;

    const newUser = new userModel({
      username,
      email,
      fullname,
    });

    const registeredUser = await userModel.register(newUser, password);

    req.login(registeredUser, () => {
      res.json({ success: true, user: registeredUser });
    });
  }),
);

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res, next) => {
    passport.authenticate("local", (err, user) => {
      if (!user) return res.status(401).json({ success: false });

      req.login(user, () => {
        res.json({ success: true, user });
      });
    })(req, res, next);
  }),
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    res.json({ success: true });
  });
});

module.exports = router;
