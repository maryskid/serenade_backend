var express = require("express");
var router = express.Router();
const User = require("../models/User");
const checkBody = require("../utils/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

router.post("/signup", async (req, res) => {
  const {
    email,
    name,
    password,
    gender,
    sexuality,
    relationshipStatus,
    birthdate,
    // location,
    // pictures,
    imaginaryName,
    occupation,
  } = req.body;

  if (
    !checkBody(
      {
        email,
        name,
        password,
        gender,
        sexuality,
        relationshipStatus,
        birthdate,
        // location,
        // pictures,
        imaginaryName,
      },
      [
        "email",
        "name",
        "password",
        "gender",
        "sexuality",
        "relationshipStatus",
        "birthdate",
        // "location",
        // "pictures",
        "imaginaryName",
      ]
    )
  ) {
    return res.status(400).json({
      result: false,
      message: "Please fill in all fields",
    });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      gender,
      sexuality,
      relationshipStatus,
      birthdate,
      location,
      // pictures,
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
      return res.status(400).json({ result: false, message: "Wrong username or password"});
    }

    if (bcrypt.compareSync(password, user.password)) {
      return res.status(200).json({ result: true, user: user.token });
    }

  } catch (error) {
    res.status(500).json({ result: false, message: error.message });
  }
});

module.exports = router;
