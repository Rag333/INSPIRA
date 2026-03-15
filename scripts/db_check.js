const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const Post = require('../server/models/Post');
const User = require('../server/models/User');

async function debug() {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    const posts = await Post.find().populate('user', 'username');
    console.log('Total posts in database:', posts.length);
    
    const userGroups = {};
    posts.forEach(p => {
      const uname = p.user?.username || 'unknown';
      const uid = p.user?._id?.toString() || 'unknown';
      const key = `${uname} (${uid})`;
      if (!userGroups[key]) userGroups[key] = 0;
      userGroups[key]++;
    });
    
    console.log('Posts grouped by user:');
    console.log(JSON.stringify(userGroups, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

debug();
