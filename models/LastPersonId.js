const mongoose = require('mongoose');

const LastPersonIdSchema = new mongoose.Schema({
    lastPersonId: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('LastPersonId', LastPersonIdSchema);
