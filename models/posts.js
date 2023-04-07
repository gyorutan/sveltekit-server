const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    writer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: String,
        required: true,
    },
    postNumber: {
        type: Number,
        ref: "Counter",
        required: true
    },
    comments: [
        {
            comment: {
                type: String,
            },
            commentBy: {
                type: String,
                require: true
            },
            commentAt: {
                type: String,
                require: true
            }
        }
    ]
})

const Post = mongoose.model('Post', postSchema);
module.exports = Post;