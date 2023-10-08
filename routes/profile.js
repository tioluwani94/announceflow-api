const express = require("express");

const User = require("../models/user");
const Profile = require("../models/profile");

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// Create Profile
router.post("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const profile = new Profile({
      user: req.user._id,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      profilePicture: req.body.profilePicture,
    });

    await profile.save();
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Read Profile
router.get("/:userId", auth, authorize, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate(
      "user",
      "email"
    );

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Profile
router.put("/", auth, authorize, async (req, res) => {
  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true }
    );

    if (!updatedProfile)
      return res.status(404).json({ message: "Profile not found" });

    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Profile
router.delete("/", auth, authorize, async (req, res) => {
  try {
    await Profile.findOneAndDelete({ user: req.user._id });
    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
