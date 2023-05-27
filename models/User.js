const mongoose = require("mongoose");

const locationSchema = mongoose.Schema({
  longitude: Number,
  latitude: Number,
  city: String,
});

const userSearchSchema = mongoose.Schema({
  maxDistance: Number,
  ageMin: Number,
  ageMax: Number,
  genderLiked: String,
  sexualityLiked: String,
});

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  gender: String,
  sexuality: String,
  relationshipStatus: String,
  birthdate: Date,
  location: locationSchema,
  pictures: [String],
  isOnline: Boolean,
  occupation: String,
  description: String,
  imaginaryName: { type: String, unique: true, required: true },
  search: userSearchSchema,
  whoLikesMe: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  myLikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  myDislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  myRelationships: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
});

const User = mongoose.model("users", userSchema);

module.exports = User;
