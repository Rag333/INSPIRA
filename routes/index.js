var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const upload = require('../multer');
const posts = require('./posts');

router.get('/profile', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user}).populate('posts');
  res.render('profile',{user});
});
router.get('/show/posts', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user}).populate('posts');
  res.render('show',{user});
});
router.get('/feed', isLoggedIn ,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user}).populate('posts');
  const posts = await postModel.find({}).populate('user');
  res.render('feed',{user,posts});
});
router.get('/edit',isLoggedIn ,function(req, res, next) {
  res.render('edit');
});
router.get('/home', function(req, res, next) {
  res.render('home');
});
router.get('/register', function(req, res) {
  res.render('register');
});
router.get('/', function(req, res, next) {
  res.render('home');
});
router.get('/login', function(req, res, next) {
  res.render('login');
});
router.get('/add',isLoggedIn,function(req, res, next) {
  res.render('add');
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
  res.redirect('/profile');
});


router.post('/uploadfile', isLoggedIn ,upload.single('image') ,async (req,res,next)=>{
  const user = await userModel.findOne({username : req.session.passport.user});
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect("/profile");
})
router.post('/register',function(req,res){
  const{username,email,fullname} = req.body;
  const newUser = new userModel({username,email,fullname});
  userModel.register(newUser,req.body.password).then(function(registeredUser){
    passport.authenticate("local")(req,res,function(){
      res.redirect('/profile');
    })
  })
})


router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/home'
}), function(req, res) {});


router.get('/logout',function(req,res,next){
  req.logOut(function(err){
    if(err) return next(err);
    res.redirect("/home");
  })

})


function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/home")
}


module.exports = router;
