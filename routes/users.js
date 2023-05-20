var express = require("express");
var router = express.Router();
const User = require("../models/User");
const checkBody = require("../utils/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const uniqid = require("uniqid");
const { uploadPictures } = require("../utils/cloudinary");
const fs = require("fs");

router.post("/signup", async (req, res) => {
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

  // we use  the nullish coalescing operator (??) to ensure that even if req.files is null or undefined,
  //the pictures variable will be assigned an empty object as its default value, avoiding potential
  //errors when accessing pictures later in our code
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

  // Here is a types of files that we accept
  const fileTypes = ["image/jpeg", "image/png", "image/jpg"];

  // if we don't have any file  we respond with an error message
  if (!Array.isArray(pictures) || pictures.length === 0) {
    return res
      .status(400)
      .json({ result: false, message: "Please upload at least 2 pictures" });
  }

  // if we have got a file that isn't an image we respond with an error message
  if (!pictures.every((picture) => fileTypes.includes(picture.mimetype))) {
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

  // we declare an empty array to store the cloudinary urls
  let userPictures = [];

  try {
    //We loop through the pictures array and move each to cloudinary
    // Because it's a loop and all this operations are asynchronous we use **await Promise.all** to wait until all the operations are complete
    await Promise.all(
      pictures.map(async (picture) => {
        //we move the picture to a tmp folder and give it a unique name
        const photoPath = `./tmp/${uniqid()}.jpg`;
        await picture.mv(photoPath);

        //we upload the picture to cloudinary through the cloudinary module from the utils folder
        const cloudFiles = await uploadPictures(photoPath);

        //we delete the photo from the tmp folder
        fs.unlinkSync(photoPath);

        //We push the cloudinary url to the pictures array every time we upload a picture
        userPictures.push(cloudFiles.secure_url);
      })
    );
    // We respond with an error message if no pictures were processed
    if (userPictures.length === 0) {
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
      pictures: userPictures,
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
