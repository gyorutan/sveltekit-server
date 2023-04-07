const mongoose = require('mongoose');

const counterSchema = mongoose.Schema({
    count: {
        type: Number,
        required: true,
    }
})

const Counter = mongoose.model('Counter', counterSchema);
module.exports = Counter;