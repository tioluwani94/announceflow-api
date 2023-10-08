const express = require("express");

const Organization = require("../models/organization");

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// Create Organization
// router.post("/", auth, async (req, res) => {
//   try {
//     const organization = new Organization({
//       name: req.body.name,
//       domains: req.body.domains,
//       styling: req.body.styling,
//       slug: "", // generate random slug from organization name
//       members: [{ user: req.user._id, role: "admin" }], // The creator is automatically an admin
//     });
//     await organization.save();
//     res.status(201).json(organization);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// Read Organization Details
router.get("/:orgId", auth, authorize, async (req, res) => {
  // Accessible by both members and admins
  try {
    const organization = await Organization.findById(req.params.orgId);
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Organization
router.put("/:orgId", auth, authorize, async (req, res) => {
  // Only admins can update organization
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.orgId,
      req.body,
      { new: true }
    );
    res.json(organization);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete Organization
router.delete("/:orgId", auth, authorize, async (req, res) => {
  // Only admins can delete organization
  try {
    await Organization.findByIdAndDelete(req.params.orgId);
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all members of an organization
router.get("/:orgId/members", auth, authorize, async (req, res) => {
  try {
    const orgId = req.params.orgId;

    // Fetch the organization and populate its members
    const organization = await Organization.findById(orgId).populate(
      "members",
      "email firstName lastName"
    );

    if (!organization)
      return res.status(404).json({ message: "Organization not found" });

    res.json(organization.members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
