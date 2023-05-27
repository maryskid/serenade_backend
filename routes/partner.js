const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.get("/search", async (req, res) => {
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

router.post("/add", async (req, res) => {
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

router.post("/remove", async (req, res) => {
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

router.post("/all", async (req, res) => {
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

module.exports = router;
