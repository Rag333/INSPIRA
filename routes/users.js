const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/INSPIRA").then(()=>{
  console.log("connected to database");
})

const userSchema = new mongoose.Schema({
  username:{
    type:String,
    required:true,
    unique:true,
  },
  googleId:{
    type:String,
    unique:true,
    sparse:true
  },
  profileImage:{
    type:String
  },
  fullname:String,
  email:String,
  posts:[{
    type : mongoose.Schema.Types.ObjectId,
    ref:'Post'
  }],
  savedPosts:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }]
})
userSchema.plugin(plm);

module.exports = mongoose.model('User',userSchema);