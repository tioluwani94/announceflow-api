const express = require("express");

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/user");
const Profile = require("../models/profile");
const Invitation = require("../models/invitation");
const Organization = require("../models/organization");

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// Send an invitation email
router.post("/send", auth, authorize, async (req, res) => {
  try {
    const { email, organizationId } = req.body;

    // Create a unique token for this invitation
    const token = jwt.sign(
      { email, organizationId },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "24h",
      }
    );

    const invitation = new Invitation({
      email,
      organization: organizationId,
      token,
    });
    await invitation.save();

    // Set up email with NodeMailer (ensure proper SMTP config)
    let transporter = nodemailer.createTransport({
      service: "gmail", // Use your preferred service
      auth: {
        user: "your_email@gmail.com",
        pass: "your_email_password",
      },
    });

    let mailOptions = {
      from: "your_email@gmail.com",
      to: email,
      subject: "Invitation to Join Our Organization",
      html: `<p>You've been invited! Click <a href="http://frontend-url/accept-invitation/${token}">here</a> to join.</p>`, // Change 'frontend-url' to your actual frontend URL
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Email sent: " + info.response);
        res.json({ message: "Invitation sent successfully" });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete the invitation process
router.post("/accept", async (req, res) => {
  try {
    const { token, firstName, lastName, email, password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (email !== decoded.email) {
      return res.status(400).json({ message: "Invalid invitation token" });
    }

    // Check if the user already exists
    let user = await User.findOne({ email });
    const organization = await Organization.findById(decoded.organizationId);

    if (!user) {
      // Create the user if they don't exist
      user = new User({ email, password });
      user.organizations = [organization._id];

      const profile = new Profile({
        user: user._id,
        firstName,
        lastName,
      });
      await profile.save();
    }

    // Whether the user is new or existing, add them to the organization's members

    if (!organization.members.includes(user._id.toString())) {
      organization.members.push(user._id);
      await organization.save();
    }

    user.organization_id = organization._id;
    user.organizations = [organization._id, ...user.organizations];

    await user.save();

    res.status(201).json({
      message: "Successfully joined the organization",
      userId: user._id,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Invitation token has expired" });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
