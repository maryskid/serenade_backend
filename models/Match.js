const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    content: String,
    date: Date,
});

const matchSchema = mongoose.Schema({
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    messages: [messageSchema],
});

const Match = mongoose.model('matches', matchSchema);

module.exports = Match;