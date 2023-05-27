var express = require("express");
var router = express.Router();
const User = require("../models/User");
const checkBody = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

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

module.exports = router;
