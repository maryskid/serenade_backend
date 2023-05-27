var express = require("express");
var router = express.Router();
const User = require("../models/User");
const {
  isAnArrayOfPictures,
  validatePictureFormats,
} = require("../modules/validatePictures");

const { uploadUserPictures } = require("../modules/cloudinary");
const Match = require("../models/Match");
const haversine = require("haversine");
const { differenceInYears } = require("date-fns");

router.post("/uploadPictures", async (req, res) => {
  try {
    if (!req.body?.userToken) {
      return res
        .status(400)
        .json({ result: false, message: "Missing user token" });
    }
    // Check if req.files.userPictures exists
    if (!req.files?.userPictures) {
      return res
        .status(400)
        .json({ result: false, message: "Missing user pictures" });
    }

    //Acces the user token from the request body and parse it to retrieve a string
    const userToken = JSON.parse(req.body.userToken);

    // we find the user in the database and return an error message if the user doesn't exist
    const user = await User.findOne({ token: userToken });
    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }

    // we use express-fileupload (imported in App.js) to access the files passed in the request body in our frontend
    const userPictures = req.files.userPictures;

    // if we don't have at least 2 pictures we respond with an error message
    if (!isAnArrayOfPictures(userPictures)) {
      return res.status(400).json({
        result: false,
        message: "Please upload at least 2 pictures",
      });
    }

    // if we have got some files that wasn't image file we respond with an error message
    if (!validatePictureFormats(userPictures)) {
      return res.status(400).json({
        result: false,
        message: "Image formats supported: JPG, PNG, JPEG",
      });
    }

    // We use our cloudinary module modules/cloudinary.js
    //to upload the user pictures to cloudinary and get the urls of the uploaded pictures
    const userPicturesUrls = await uploadUserPictures(userPictures);

    //if an error occurs during this process we respond with an error message
    if (!userPicturesUrls) {
      return res
        .status(400)
        .json({ result: false, message: "No pictures were uploaded" });
    }

    // otherwise we update the user pictures with those urls from cloudinary
    user.pictures = userPicturesUrls;

    // and finally update our user document in database
    await user.save();
    return res.status(200).json({ result: true, message: "Pictures uploaded" });
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
});

router.post("/displayProfile", async (req, res) => {
  try {
    const { userToken } = req.body;
    // Verify token exists
    if (!userToken) {
      return res.status(400).json({ result: false, message: "Missing token" });
    }

    //find user by token and populate people who likes him/her and their partners
    const user = await User.findOne({ token: userToken })
      .populate({
        path: "whoLikesMe",
        select: "-_id -password -myLikes -myDislikes -whoLikesMe",
        populate: {
          path: "myRelationships",
          select: "-_id -password -myLikes -myDislikes -whoLikesMe",
        },
      })
      .populate({
        path: "myRelationships",
        populate: {
          path: "myRelationships",
          select: "-_id -password -myLikes -myDislikes -whoLikesMe",
        },
        select: "-_id -password -myLikes -myDislikes -whoLikesMe",
      })
      .select("-_id -password -myLikes -myDislikes");
    // Check if user exists
    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }
    return res.status(200).json({ result: true, user });
  } catch (error) {
    return res.status(500).json({ result: false, message: error.message });
  }
});

router.post("/updateProfile", async (req, res) => {
  try {
    const { userToken, birthdate, gender, sexuality, occupation, description } =
      req.body;

    const user = await User.findOne({ token: userToken });
    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }

    const updateObject = {};

    if (gender) {
      updateObject.gender = gender;
    }
    if (sexuality) {
      updateObject.sexuality = sexuality;
    }
    if (occupation) {
      updateObject.occupation = occupation;
    }
    if (description) {
      updateObject.description = description;
    }
    if (birthdate) {
      updateObject.birthdate = birthdate;
    }
    const updatedUser = await User.updateOne(
      { token: userToken },
      updateObject
    );

    if (updatedUser.modifiedCount !== 1) {
      return res.status(400).json({
        result: false,
        message: "Error when updating profile",
      });
    }
    return res.status(200).json({
      result: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ result: false, message: error.message });
  }
});

router.put("/saveSearchSettings", (req, res) => {
  // Récupération des données du front sous cette forme :
  // {
  //   "search" :
  //   {
  //   "maxDistance":50,
  //   "ageMin":30,
  //   "ageMax":50,
  //   "genderLiked":"Woman",
  //   "sexualityLiked": "Straight"
  // },
  // "location":
  // {
  //   "city" : "Taverny",
  //   "latitude": 49.0254200,
  //   "longitude": 2.2169100
  // },
  // "userToken": "Xk7H4OJZKxWj6QGcRjAs9tBvMFQ0P3N2"
  // }

  const userToken = req.body.userToken;

  const updateFields = {};
  if (req.body.search) {
    updateFields.search = req.body.search;
  }
  if (req.body.location) {
    updateFields.location = req.body.location;
  }

  User.findOneAndUpdate({ token: userToken }, updateFields, { new: true })
    .then((updatedUser) => {
      if (updatedUser) {
        return res.status(200).json({ result: true, user: updatedUser });
      } else {
        return res
          .status(404)
          .json({ result: false, message: "User not found." });
      }
    })
    .catch((error) => {
      return res.status(500).json({ result: false, message: error.message });
    });
});

router.post("/recommandations", async (req, res) => {
  try {
    const userToken = req.body.userToken;
    const user = await User.findOne({ token: userToken });
    if (!user) {
      return res.status(400).json({ result: false, message: "user not found" });
    }

    // Fetch necessary fields only using query projection
    const allUsers = await User.find(
      {},
      {
        password: 0,
        myLikes: 0,
        myDislikes: 0,
        whoLikesMe: 0,
        imaginaryName: 0,
      }
    ).populate("myRelationships");

    // Get the array of likes and dislikes of our user for efficient filtering
    const userLikes = user.myLikes;
    const userDislikes = user.myDislikes;

    const matches = await Match.find({
      $or: [
        { user: user._id }, // Matches where user ID is the given ID
        { userLiked: user._id }, // Matches where userLiked ID is the given ID
      ],
    })
      .populate({
        path: "user",
        select: "_id token",
      })
      .populate({
        path: "userLiked",
        select: "_id token",
      });

    // Other users who matched with our current user
    const usermatches = matches
      .map((match) => {
        if (match.user && match.user.token !== userToken) {
          return match.user;
        } else if (match.userLiked && match.userLiked.token !== userToken) {
          return match.userLiked;
        }
        return null; // To exclude the unmatched documents from the result
      })
      .filter(Boolean);

    // Filter users based on likes and dislikes and matches of our user
    const firstFilteredUsers = allUsers.filter((people) => {
      return (
        !userLikes.includes(people._id) &&
        !userDislikes.includes(people._id) &&
        people.token !== userToken &&
        !usermatches.some((match) => match._id.equals(people._id))
      );
    });

    if (!user.search) {
      return res.status(200).json({
        result: true,
        total: firstFilteredUsers.length,
        recommendedUsers: firstFilteredUsers,
      });
    }

    // Get user's location coordinates
    const userCoordinates = {
      latitude: user.location.latitude,
      longitude: user.location.longitude,
    };

    // For each of the filtered users, keep only those who fit the search criteria
    const userRecommandations = firstFilteredUsers.filter((people) => {
      const peopleCoordinates = {
        latitude: people.location.latitude,
        longitude: people.location.longitude,
      };

      // Calculate the distance between the two users using haversine
      const distanceBetweenOurTwoUsersInKm =
        haversine(peopleCoordinates, userCoordinates, { unit: "meter" }) / 1000;

      // Get the age of each user in years
      const peopleAge = differenceInYears(
        new Date(),
        new Date(people.birthdate)
      );

      return (
        peopleAge > user.search?.ageMin &&
        peopleAge < user.search?.ageMax &&
        distanceBetweenOurTwoUsersInKm < user.search?.maxDistance &&
        people.gender === user.search?.genderLiked &&
        people.sexuality === user.search?.sexualityLiked
      );
    });

    return res.status(200).json({
      result: true,
      total: userRecommandations.length,
      recommendedUsers: userRecommandations,
    });
  } catch (error) {
    return res.status(500).json({ result: false, message: error.message });
  }
});

router.post("/matches", async (req, res) => {
  try {
    const { userToken } = req.body;

    // Recherche l'utilisateur actuel en utilisant le token
    const user = await User.findOne({ token: userToken });

    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }

    const matches = await Match.find({
      $or: [
        { user: user._id }, // Matches where user ID is the given ID
        { userLiked: user._id }, // Matches where userLiked ID is the given ID
      ],
    })
      .populate({
        path: "user",
        select: "-_id -password -myLikes -myDislikes -whoLikesMe",
        populate: {
          path: "myRelationships",
          select: "-_id -password -myLikes -myDislikes -whoLikesMe",
        },
      })
      .populate({
        path: "userLiked",
        select: "-_id -password -myLikes -myDislikes -whoLikesMe",
        populate: {
          path: "myRelationships",
          select: "-_id -password -myLikes -myDislikes -whoLikesMe",
        },
      });
    res.status(200).json({ result: true, data: matches });
  } catch (error) {
    return res.status(400).json({ result: false, message: error.message });
  }
});

module.exports = router;
