require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const userModel = require('./routes/users');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cors = require('cors');

var app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  resave : false,
  saveUninitialized : false,
  secret : " mahipal singh"
}))
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {
  done(null, user.username);
});
passport.deserializeUser(async function(username, done) {
  try {
    const user = await userModel.findOne({ username: username });
    done(null, user);
  } catch(err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      let user = await userModel.findOne({ googleId: profile.id });
      if (user) {
        return cb(null, user);
      } else {
        const newUser = await userModel.create({
          googleId: profile.id,
          username: profile.emails[0].value.split('@')[0],
          email: profile.emails[0].value,
          fullname: profile.displayName,
          profileImage: profile.photos[0].value
        });
        return cb(null, newUser);
      }
    } catch (err) {
      return cb(err, null);
    }
  }
));
app.use(flash());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // json the error
  res.status(err.status || 500);
  res.json({ error: err.message, status: err.status });
});

module.exports = app;
