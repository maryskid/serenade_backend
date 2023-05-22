var express = require("express");
var router = express.Router();
const Match = require("../models/Match");
const User = require("../models/User");

router.post("/add", async(req, res) => {
    const { token, userLikedId } = req.body;
    try {
        
        // Vérification des données recues dans la requête
        if (!token || !userLikedId) {
            return res.status(400).json({ message: "Missing required data" });
        } 
        // Recherche de l'utilisateur actuel
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        // Recherche de l'utilisateur liké
        const likedUser = await User.findOne({
          _id: userLikedId,
        });

        // Vérification si l'utilisateur liké existe
         if(!likedUser) {
            return res.status(400).json({ message: "User liked not found" });
         }

         // Vérification si le likedUser est déjà dans la liste des likes
         if (user.myLikes.includes(userLikedId)) {
            const newMatch = new Match({
                users: [user._id, userLikedId],
                messages: [],
            });
            const matchCreated =  await newMatch.save();
            return res.status(200).json({result: true, matchCreated, message: "Its a match" });
         }
      } catch (error) {
        return res.status(400).json({ result: false, message: error.message });
      }
  });

router.post("/remove", async(req, res) => {
    const { token, userLikedId } = req.body;
    try {
        // Vérification des données recues dans la requête
        if(!token || !userLikedId) {
            return res.status(400).json({ result: false, message: "Missing required data" });
        }
        // Recherche de l'utilisateur actuel
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(400).json({ result: false, message: "User not found" });
        }
        // Recherche du match existant
        if(user.myLikes.includes(userLikedId)) {
            const match = await Match.findOne({ users: [user._id, userLikedId] });
            if(!match) {
                return res.status(400).json({ result : false, message: "Match not found" });
            }
            // Suppression du match
            await match.deleteOne({ matchs: [user._id, userLikedId] });
            return res.status(200).json({ result: true, message: "Match removed" });
        }
    }   catch (error) {
        return res.status(400).json({ result: false, message: error.message });
      }
});

router.get("/congratulations", async(req, res) => {
    
});

module.exports = router;
