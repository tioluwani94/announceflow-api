// routes/user.js
const express = require("express");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Profile = require("../models/profile");
const Organization = require("../models/organization");

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const generateSlug = require("../utils/slug-generator");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExists = await User.findOne({ email });
    // Check if an organization with the provided name already exists
    const organizationExists = await Organization.findOne({ name: orgName });
    if (organizationExists)
      return res.status(400).json({
        message:
          "An organization with this name already exists. Please choose another name.",
      });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = new User({ email, password });
    await user.save();

    // Create a profile for the user
    const profile = new Profile({
      user: user._id,
      firstName,
      lastName,
    });
    await profile.save();

    // Create an organization for the user since the name is unique
    const organization = new Organization({
      name: orgName,
      isOwner: user._id,
      members: [user._id],
      slug: generateSlug(),
    });
    await organization.save();

    user.organization_id = organization._id;
    user.organizations = [organization._id];
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "30d",
    });
    res.status(201).json({
      token,
      profile,
      userId: user._id,
      organizations: user.organizations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "30d",
    });
    // Fetch the user's profile
    const profile = await Profile.findOne({ user: user._id });

    res.json({
      token,
      profile,
      userId: user._id,
      organizations: user.organizations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set active organization for a user
router.put(
  "/setActiveOrganization/:orgId",
  auth,
  authorize,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const orgId = req.params.orgId;

      // Check if the user is a member of the organization
      const organization = await Organization.findById(orgId);
      if (!organization)
        return res.status(404).json({ message: "Organization not found" });

      if (!organization.members.includes(userId)) {
        return res
          .status(403)
          .json({ message: "User is not a member of this organization" });
      }

      const user = await User.findById(userId);
      user.organization_id = orgId;
      await user.save();

      res.json({ message: "Active organization updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
