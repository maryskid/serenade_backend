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

router.post("/signup", async (req, res) => {
  try {
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

    // we use express-fileupload (imported in App.js) to access the files passed in the request body
    //We also use the nullish coalescing operator (??) to assign an empty object to the pictures variable if req.files is null or undefined.
    //This prevents errors when accessing pictures later in the code.
    const { pictures } = req.files ?? {};

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

    // if we don't have any file  we respond with an error message
    if (!isAnArrayOfPictures(pictures)) {
      return res.status(400).json({
        result: false,
        message: "Please upload at least 2 pictures",
      });
    }

    // if we have got some files that wasn't image file we respond with an error message
    if (!validatePictureFormats(pictures)) {
      return res.status(400).json({
        result: false,
        message: "Image formats supported: JPG, PNG, JPEG",
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

    // We respond with an error message if no pictures were processed
    const userPicturesUrls = await uploadUserPictures(pictures);
    if (!userPicturesUrls) {
      res
        .status(400)
        .json({ result: false, message: "No pictures were uploaded" });
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
      pictures: userPicturesUrls,
      imaginaryName,
      token: uid2(32),
    });

    const savedUser = await newUser.save();
    return res.status(200).json({ result: true, user: savedUser.token });
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
      return res.status(200).json({ result: true, user: user.token });
    }
  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
});

module.exports = router;
