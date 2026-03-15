server
│
├── config
│ ├── db.js
│ ├── passport.js
│ └── otp.js
│
├── controllers
│ ├── authController.js
│ ├── postController.js
│ └── userController.js
│
├── models
│ ├── User.js
│ ├── Post.js
│ └── OTP.js
│
├── routes
│ ├── authRoutes.js
│ ├── postRoutes.js
│ └── userRoutes.js
│
├── middleware
│ ├── isLoggedIn.js
│ ├── multer.js
│ └── errorHandler.js
│
├── services
│ ├── aiService.js
│ └── mailService.js
│
├── utils
│ └── generateOTP.js
│
├── app.js
├── bin/www
└── .env
