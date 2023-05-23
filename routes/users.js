var express = require("express");
var router = express.Router();
const User = require("../models/User");
const checkBody = require("../modules/checkBody");
const {
  isAnArrayOfPictures,
  validatePictureFormats,
} = require("../modules/validatePictures");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const { uploadUserPictures } = require("../modules/cloudinary");
const Match = require("../models/Match");
const haversine = require("haversine");
const { differenceInYears } = require("date-fns");

router.post("/signup", async (req, res) => {
  try {
    // Check if req.body is empty
    if (!req.body) {
      return res
        .status(400)
        .json({ result: false, message: "Missing user information" });
    }

    // we use destructuring to get the values from the request body
    const {
      email,
      name,
      password,
      gender,
      sexuality,
      relationshipStatus,
      birthdate,
      location,
      imaginaryName,
    } = req.body;

    // we use the checkBody function from the utils folder to check if all the fields we need are filled in
    if (
      !checkBody(
        {
          email,
          name,
          password,
          imaginaryName,
        },
        ["email", "name", "password", "imaginaryName"]
      )
    ) {
      return res.status(400).json({
        result: false,
        message: "Please fill in all fields",
      });
    }

    // Check if a user with the same email already exists
    const userAlreadyExists = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });
    if (userAlreadyExists) {
      return res.status(400).json({
        result: false,
        message: "User already exists",
      });
    }

    //Check if a user with the same imaginaryName already exists
    const imaginaryNameIsTaken = await User.findOne({
      imaginaryName: { $regex: new RegExp(`^${imaginaryName}$`, "i") },
    });
    if (imaginaryNameIsTaken) {
      return res.status(400).json({
        result: false,
        message: "Imaginary name already exists",
      });
    }

    // We cryptographically hash the password using bcrypt
    const hashedPassword = bcrypt.hashSync(password, 10);

    // We create a new user
    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      gender,
      sexuality,
      relationshipStatus,
      birthdate,
      location,
      imaginaryName,
      token: uid2(32),
    });

    const savedUser = await newUser.save();
    return res.status(200).json({ result: true, userToken: savedUser.token });
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  // we use the checkBody module to check if all the fields we need are filled in
  if (!checkBody({ email, password }, ["email", "password"])) {
    return res
      .status(400)
      .json({ result: false, message: "Please fill in all fields" });
  }
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res
        .status(400)
        .json({ result: false, message: "Wrong username or password" });
    }

    if (bcrypt.compareSync(password, user.password)) {
      return res.status(200).json({ result: true, userToken: user.token });
    }
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
});

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

router.get("/partner/search", async (req, res) => {
  const { partnerImaginaryName } = req.query;
  try {
    const userPartner = await User.findOne({
      imaginaryName: { $regex: new RegExp(`^${partnerImaginaryName}$`, "i") },
    });
    if (!userPartner) {
      return res
        .status(400)
        .json({ result: false, message: "User partner not found" });
    }
    return res.status(200).json({ result: true, userPartner });
  } catch (error) {
    return res.status(500).json({ result: false, message: error.message });
  }
});

router.post("/partner/add", async (req, res) => {
  try {
    const { userToken, partnerImaginaryName } = req.body;
    const user = await User.findOne({ token: userToken });
    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }
    const userPartner = await User.findOne({
      imaginaryName: { $regex: new RegExp(`^${partnerImaginaryName}$`, "i") },
    });
    if (!userPartner) {
      return res
        .status(400)
        .json({ result: false, message: "Partner not found" });
    }
    if (user.myRelationships.includes(userPartner._id)) {
      return res
        .status(400)
        .json({ result: false, message: "Partner already added" });
    }

    if (user.token === userPartner.token) {
      return res.status(400).json({
        result: false,
        message: "You cannot be in relationship with yourself",
      });
    }

    user.myRelationships.push(userPartner._id);
    await user.save();

    return res.status(200).json({ result: true, message: "Partner added" });
  } catch (error) {
    return res.status(500).json({ result: false, message: error.message });
  }
});

router.post("/partner/remove", async (req, res) => {
  try {
    const { userToken, partnerImaginaryName } = req.body;
    const user = await User.findOne({ token: userToken });
    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }
    const userPartner = await User.findOne({
      imaginaryName: { $regex: new RegExp(`^${partnerImaginaryName}$`, "i") },
    });
    if (!userPartner) {
      return res
        .status(400)
        .json({ result: false, message: "Partner not found" });
    }
    const partnerIndex = user.myRelationships.indexOf(userPartner._id);

    if (partnerIndex === -1) {
      return res.status(400).json({
        result: false,
        message: "Non existing partner cannot be removed",
      });
    }

    user.myRelationships.splice(partnerIndex, 1);
    await user.save();
    return res
      .status(200)
      .json({ result: true, message: "User partner removed" });
  } catch (error) {
    return res.status(500).json({ result: false, message: error.message });
  }
});

router.post("/partners", async (req, res) => {
  try {
    const { userToken } = req.body;

    const user = await User.findOne({ token: userToken }).populate({
      path: "myRelationships",
      select: "_id name pictures token imaginaryName",
    });

    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }

    const userPartners = user.myRelationships;

    if (userPartners.length === 0) {
      return res
        .status(400)
        .json({ result: false, message: "User has no partners" });
    }

    return res.status(200).json({ result: true, userPartners });
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
});

router.post("/action/like", async (req, res) => {
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

    const updateUserLikes = await User.updateOne(
      { _id: user._id },
      { $addToSet: { myLikes: likedUser._id } }
    );

    const updateLikedUserWhoLikesMe = await User.updateOne(
      { _id: likedUser._id },
      { $addToSet: { whoLikesMe: user._id } }
    );

    if (
      updateUserLikes.modifiedCount !== 1 ||
      updateLikedUserWhoLikesMe.modifiedCount !== 1
    ) {
      return res.status(400).json({
        result: false,
        message: "Error in the like action",
      });
    }

    if (user.whoLikesMe.includes(likedUser._id)) {
      const newMatch = new Match({
        user: {
          id: user._id,
          name: user.name,
          pictures: user.pictures,
          token: user.token,
        },
        userLiked: {
          id: likedUser._id,
          name: likedUser.name,
          pictures: likedUser.pictures,
          token: likedUser.token,
        },
      });

      const matchData = await newMatch.save();

      return res.status(200).json({ isAMatch: true, matchData });
    }

    return res.status(200).json({ result: true, message: "Like done" });
  } catch (error) {
    return res.status(400).json({ result: false, message: error.message });
  }
});

router.post("/action/dislike", async (req, res) => {
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
      { $addToSet: { myDislikes: dislikedUser._id } }
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

router.post("/action/dismatch", async (req, res) => {
  try {
    const { userToken, dismatchedUserToken, matchId } = req.body;
    const user = await User.findOne({ token: userToken });
    if (!user) {
      return res.status(400).json({ result: false, message: "User not found" });
    }
    const dismatchedUser = await User.findOne({ token: dismatchedUserToken });
    if (!dismatchedUser) {
      return res
        .status(400)
        .json({ result: false, message: "Dismatched user not found" });
    }
    const match = await Match.findById(matchId);

    if (!match) {
      return res
        .status(400)
        .json({ result: false, message: "Match not found" });
    }

    const updateUserLikes = await User.updateOne(
      { _id: user._id },
      { $pull: { myLikes: dismatchedUser._id } }
    );
    const updateDismatchedUserWhoLikesMe = await User.updateOne(
      { _id: dismatchedUser._id },
      { $pull: { whoLikesMe: user._id } }
    );
    const deleteMatch = await Match.deleteOne({ _id: matchId });
    if (
      updateUserLikes.modifiedCount !== 1 ||
      updateDismatchedUserWhoLikesMe.modifiedCount !== 1 ||
      deleteMatch.deletedCount !== 1
    ) {
      return res.status(400).json({
        result: false,
        message: "Error in the dismatch action",
      });
    }

    return res.status(200).json({ result: true, message: "Dismatch done" });
  } catch (error) {
    res.status(400).json({ result: false, message: error.message });
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
        path: "whoLikesMe myRelationships",
        select: "-_id name location pictures birthdate gender token",
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
    );

    // Get the array of likes and dislikes of our user for efficient filtering
    const userLikes = user.myLikes;
    const userDislikes = user.myDislikes;

    // Filter users based on likes and dislikes of our user
    const firstFilteredUsers = allUsers.filter((people) => {
      return (
        !userLikes.includes(people._id) &&
        !userDislikes.includes(people._id) &&
        people.token !== userToken
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

    return res
      .status(200)
      .json({
        result: true,
        total: userRecommandations.length,
        recommendedUsers: userRecommandations,
      });
  } catch (error) {
    return res.status(500).json({ result: false, message: error.message });
  }
});

module.exports = router;
