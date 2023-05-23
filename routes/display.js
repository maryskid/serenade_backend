var express = require("express");
var router = express.Router();
const User = require("../models/User");



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
        const {userToken} = req.body
  
      // Rechercher l'utilisateur actuel en utilisant le token
      const user = await User.findOne({ token: userToken });
  
      if (!user) {
        return res.status(404).json({ result: false, message: 'User not found' });
      }
  
      // Rechercher les correspondances entre myLikes et whoLikesMe
      const matches = await User.find({
        _id: { $ne: user._id }, // $ne : Exclure l'utilisateur 
        myLikes: user._id, // // Les utilisateurs dont l'ID est présent dans myLikes
        whoLikesMe: user._id // Les utilisateurs dont l'ID de l'utilisateur est présent dans whoLikesMe
      }); 

    // La réponse JSON renvoie un tableau contenant les utilisateurs correspondants.
      res.json({ result: true, data:matches });
    } catch (error) {
      return res.status(400).json({ result: false, message: error.message });
    }
  });
  


module.exports = router;