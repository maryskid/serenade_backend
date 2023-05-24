const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  sender: String,
  receiver: String,
  content: String,
  date: Date,
});

const matchSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  userLiked: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  messages: [messageSchema],
});

const Match = mongoose.model("matches", matchSchema);

module.exports = Match;
