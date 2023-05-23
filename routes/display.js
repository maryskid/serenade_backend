var express = require("express");
var router = express.Router();
const User = require("../models/User");
const Match = require("../models/Match");



router.post('/wholikesme', async (req, res) => {
    try {
        const {userToken} = req.body 
      // Recherche l'utilisateur  en utilisant le token
      const user = await User.findOne({ token: userToken });
  
      if (!user) {
        return res.status(404).json({ result: false, message: 'User not found' });
      }
  
      // Recherche tous les utilisateurs qui ont aimé l'utilisateur 
      const usersWhoLikeMe = await User.find({ whoLikesMe: user});
  
      res.json({ result: true, data: usersWhoLikeMe});
    } catch (error) {
      return res.status(400).json({ result: false, message: error.message });
    }
  });
  




  
  router.post('/mymatches', async (req, res) => {
    try {
      const { userToken } = req.body;
  
      // Recherche l'utilisateur actuel en utilisant le token
      const user = await User.findOne({ token: userToken });
  
      if (!user) {
        return res.status(404).json({ result: false, message: 'User not found' });
      }
  
      // Recherche les documents "Match" correspondants pour l'utilisateur
      const matches = await Match.find({ user: user._id });
  
      // Récupére les IDs des utilisateurs qui ont matché 
      const matchedUserIds = matches.map(match => match.matchedUser);
  
      // Recherche les utilisateurs correspondants dans la collection "User"
      const matchedUsers = await User.find({ _id: { $in: matchedUserIds } });
  
      //  Donne les utilisateurs qui ont matché avec le user
      res.json({ result: true, data: matchedUsers });
    } catch (error) {
      return res.status(400).json({ result: false, message: error.message });
    }
  });
  
  

module.exports = router;