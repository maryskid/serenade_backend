const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    token: String,
  },
  receiver: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    token: String,
  },
  content: String,
  date: Date,
});

const matchSchema = mongoose.Schema({
  user: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    name: String,
    pictures: [String],
    token: String,
  },

  userLiked: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    name: String,
    pictures: [String],
    token: String,
  },

  messages: [messageSchema],
});

const Match = mongoose.model("matches", matchSchema);

module.exports = Match;
