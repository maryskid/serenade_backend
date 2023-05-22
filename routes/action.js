var express = require("express");
var router = express.Router();
const User = require("../models/User");


router.post('/like', async(req, res) => {
    try {
        const {userToken , likedUserToken} = req.body 

        const user = await User.findOne({token: userToken});
        if(!user) {
            return res.status(400).json({ result: false, error: 'User not found' })
            // si le user n'a pas été trouvé par avec le token
        }
        const likedUser = await User.findOne({token: likedUserToken});
        // si le liked user n'a pas été trouvé par avec le token
        if(!likedUser){
            return res.status(400).json({ result: false, error: 'Liked user not found' })
        }
        const data = await User.updateOne({ _id: user._id }, { $addToSet: { myLikes: likedUser._id } })
        //  $addToSet est spécifique à MangoDB, il ajoute sans ajouter en double.
        // si user et liked user trouvés, l'id du liked user est rajouté dans le tableau myLikes du user.
        if(data.modifiedCount === 1) {

            return res.json({result: true})
        }
        else {
            return res.json({result: false})
        }
      
    } catch (error) {
        return res.status(400).json({result:false, message: error.message})
    }
})

  

router.post('/dislike', async(req, res) => {
    try {
        const {userToken , dislikedUserToken} = req.body 
        const user = await User.findOne({token:userToken});
        if(!user) {
            return res.status(400).json({ result: false, error: 'User not found' })
            // si le user n'a pas été trouvé par avec le token
        }
        const dislikedUser = await User.findOne({token: dislikedUserToken});
        if(!dislikedUser){
            return res.status(400).json({ result: false, error: 'Disliked user not found' })
            // si le disliked user n'a pas été trouvé par avec le token
        }
        await User.updateOne({ _id: user._id }, { $addToSet: { myDislikes: dislikedUser._id } });

        await User.updateOne(
            { _id: user._id },
            { $pull: { myLikes: dislikedUser._id } }
          );

        // si user et disliked user trouvés, l'id du disliked user est rajouté dans le tableau myDislikes du user.
        return res.json({ result: true })
        
    } catch (error) {
        return res.status(400).json({result:false, message: error.message})
    }
})


module.exports = router;