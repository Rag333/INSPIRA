var express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const upload = require('../multer');
router.get('/profile', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user})
    .populate('posts')
    .populate('savedPosts');
  res.json({ success: true, user: user });
});
router.get('/show/posts', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user}).populate('posts');
  res.json({ success: true, user: user });
});
router.get('/feed', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user}).populate('posts');
  
  // Extract optional search query
  const query = req.query.q;
  let searchCriteria = {};
  if (query && query.trim() !== '') {
    const rawMatch = query.trim();
    searchCriteria = {
      $or: [
        { title: { $regex: rawMatch, $options: 'i' } },
        { description: { $regex: rawMatch, $options: 'i' } }
      ]
    };
  }

  const posts = await postModel.find(searchCriteria).populate('user').sort({ _id: -1 });
  
  // Fallback images if no posts exist
  const unsplashFallbacks = [
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618220179428-22790b46a0eb?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&auto=format&fit=crop"
  ];
  res.json({
    success: true,
    user,
    posts, 
    fallbacks: unsplashFallbacks 
  });
});

// Google Auth Routes
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=1' }),
  function(req, res) {
    // Successful authentication, redirect to the React frontend
    req.session.passport = { user: req.user.username };
    res.redirect('http://localhost:5173/profile');
  });

router.post('/createpost',isLoggedIn, upload.single('postImage') ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user});
  const post = await postModel.create({
    user : user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });
  user.posts.push(post._id);
  await user.save();
  res.json({ success: true, post: post });
});

router.post('/createpost/ai', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({username: req.session.passport.user});
    const { title, description, imageUrl } = req.body;
    
    // Download the image
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    const uniqueFile = uuidv4() + '.jpg'; // pollinations typically returns jpeg
    const imagePath = path.join(__dirname, '../public/images/uploads', uniqueFile);
    
    fs.writeFileSync(imagePath, response.data);

    const post = await postModel.create({
      user: user._id,
      title: title,
      description: description,
      image: uniqueFile
    });
    
    user.posts.push(post._id);
    await user.save();
    
    res.json({ success: true, post: post });
  } catch (error) {
    console.error("Error creating AI post:", error);
    res.status(500).json({ success: false, error: "Failed to download image and create post" });
  }
});


router.post('/save/:postId', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({username: req.session.passport.user});
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const postToSave = req.params.postId;
    
    // Toggle save
    const indexOfPost = user.savedPosts.indexOf(postToSave);
    if (indexOfPost === -1) {
      user.savedPosts.push(postToSave);
    } else {
      user.savedPosts.splice(indexOfPost, 1);
    }
    
    await user.save();
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/uploadfile', isLoggedIn ,upload.single('image') ,async (req,res,next)=>{
  const user = await userModel.findOne({username : req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.json({ success: true, user: user });
})
router.post('/register',function(req,res){
  const{username,email,fullname} = req.body;
  const newUser = new userModel({username,email,fullname});
  userModel.register(newUser,req.body.password).then(function(registeredUser){
    passport.authenticate("local")(req,res,function(){
      res.json({ success: true, user: registeredUser });
    })
  }).catch(function(err){
    res.status(400).json({ success: false, message: err.message });
  })
})


router.post('/login', async function(req, res, next) {
  // Allow users to login with email or username seamlessly
  if (req.body.username && req.body.username.includes('@')) {
    const userLookup = await userModel.findOne({ email: req.body.username });
    if (userLookup) {
      req.body.username = userLookup.username;
    }
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) { return res.status(500).json({ success: false, message: err.message }); }
    if (!user) { return res.status(401).json({ success: false, message: "Invalid credentials" }); }
    req.logIn(user, function(err) {
      if (err) { return res.status(500).json({ success: false, message: err.message }); }
      return res.json({ success: true, user: user });
    });
  })(req, res, next);
});


router.get('/logout',function(req,res,next){
  req.logOut(function(err){
    if(err) return next(err);
    res.json({ success: true, message: "Logged out" });
  })

})


function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.status(401).json({ success: false, message: "Unauthorized" });
}


module.exports = router;
