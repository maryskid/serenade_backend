var express = require("express");
var router = express.Router();
const User = require("../models/User");


router.post('/like', (req, res) => {
    const currentUserToken = req.body.token;
    const likedUserToken = req.body.likedUserToken;
  
    User.findOne({ token: currentUserToken })
      .then(currentUser => {
        if (currentUser) {
          User.findOne({ token: likedUserToken })
            .then(likedUser => {
              if (likedUser) {
                User.updateOne({ _id: currentUser._id }, { $addToSet: { myLikes: likedUser._id } })
                  .then(() => {
                    User.find()
                      .then(data => {
                        res.json({ result: true, data: data });
                      })
                      .catch(error => {
                        res.json({ result: false, error: error.message });
                      });
                  })
                  .catch(error => {
                    res.json({ result: false, error: error.message });
                  });
              } else {
                res.json({ result: false, error: 'Liked user not found' });
              }
            })
            .catch(error => {
              res.json({ result: false, error: error.message });
            });
        } else {
          res.json({ result: false, error: 'User not found' });
        }
      })
      .catch(error => {
        res.json({ result: false, error: error.message });
      });
  });
  


router.post('/dislike', (req, res) => {
    const currentUserToken = req.body.token;
    const dislikedUserToken = req.body.dislikedUserToken;
  
    User.findOne({ token: currentUserToken })
      .then(currentUser => {
        if (currentUser) {
          User.findOne({ token: dislikedUserToken })
            .then(dislikedUser => {
              if (dislikedUser) {
                User.updateOne({ _id: currentUser._id }, { $addToSet: { myDislikes: dislikedUser._id } })
                  .then(() => {
                    User.find()
                      .then(data => {
                        res.json({ result: true, data: data });
                      })
                      .catch(error => {
                        res.json({ result: false, error: error.message });
                      });
                  })
                  .catch(error => {
                    res.json({ result: false, error: error.message });
                  });
              } else {
                res.json({ result: false, error: 'Disliked user not found' });
              }
            })
            .catch(error => {
              res.json({ result: false, error: error.message });
            });
        } else {
          res.json({ result: false, error: 'User not found' });
        }
      })
      .catch(error => {
        res.json({ result: false, error: error.message });
      });
  });
  



module.exports = router;