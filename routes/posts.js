const mongoose = require('mongoose');


const postSchema = mongoose.Schema({
    image: String,
    title: String,
    description: String,
    likesCount: { type: Number, default: 0 },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})



module.exports= mongoose.model('Post',postSchema);