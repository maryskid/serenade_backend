const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Match = require("../models/Match");

router.post("/like", async (req, res) => {
  try {
    const { userToken, likedUserToken } = req.body;

    const user = await User.findOne({ token: userToken });
    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }

    const likedUser = await User.findOne({ token: likedUserToken });
    if (!likedUser) {
      return res
        .status(400)
        .json({ result: false, message: "Liked user not found" });
    }

    const existingMatch = await Match.findOne({
      $or: [
        { user: user._id, userLiked: likedUser._id },
        { user: likedUser._id, userLiked: user._id },
      ],
    });

    if (existingMatch) {
      // Match already exists, handle accordingly
      return res
        .status(400)
        .json({ result: false, message: "Match already exists" });
    }

    if (user.whoLikesMe.includes(likedUser._id)) {
      // Remove user from likes list and who likes me list
      user.whoLikesMe = user.whoLikesMe.filter(
        (id) => id.toString() !== likedUser._id.toString()
      );
      likedUser.myLikes = likedUser.myLikes.filter(
        (id) => id.toString() !== user._id.toString()
      );

      const newMatch = new Match({
        user: user._id,
        userLiked: likedUser._id,
      });

      const matchData = await newMatch.save();

      // Populate the user and userLiked properties in the matchData
      const populatedMatchData = await Match.populate(matchData, [
        { path: "user", select: "name pictures token" },
        { path: "userLiked", select: "name pictures token" },
      ]);

      await user.save();
      await likedUser.save();

      return res
        .status(200)
        .json({ isAMatch: true, matchData: populatedMatchData });
    }

    user.myLikes.addToSet(likedUser._id);
    likedUser.whoLikesMe.addToSet(user._id);

    await user.save();
    await likedUser.save();

    return res.status(200).json({ result: true, message: "Like done" });
  } catch (error) {
    return res.status(400).json({ result: false, message: error.message });
  }
});

router.post("/dislike", async (req, res) => {
  try {
    const { userToken, dislikedUserToken } = req.body;

    const user = await User.findOne({ token: userToken });
    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }
    const dislikedUser = await User.findOne({ token: dislikedUserToken });

    if (!dislikedUser) {
      return res
        .status(400)
        .json({ result: false, message: "DisLiked user not found" });
    }

    const updateUserDislikes = await User.updateOne(
      { _id: user._id },
      {
        $addToSet: { myDislikes: dislikedUser._id },
        $pull: { whoLikesMe: dislikedUser._id },
      }
    );

    if (updateUserDislikes.modifiedCount !== 1) {
      return res.status(400).json({
        result: false,
        message: "Error in the dislike action",
      });
    }

    return res.status(200).json({ result: true, message: "Dislike done" });
  } catch (error) {
    return res.status(400).json({ result: false, message: error.message });
  }
});

router.post("/newMessage", async (req, res) => {
  try {
    const { matchId, messageData } = req.body;

    const user = await User.findOne({ token: messageData.sender });

    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }

    const match = await Match.findById(matchId);

    if (!match) {
      return res
        .status(400)
        .json({ result: false, message: "Match not found" });
    }

    // Créer un nouveau message avec l'auteur correspondant au token de l'utilisateur
    const newMessage = {
      sender: messageData.sender,
      content: messageData.content,
      date: messageData.date,
    };

    match.messages.push(newMessage);
    const savedMessage = await match.save();
    return res.status(200).json({ result: true, savedMessage });
  } catch (error) {
    return res.status(400).json({ result: false, message: error.message });
  }
});

module.exports = router;
