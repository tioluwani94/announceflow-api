// models/user.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
  },
  organizations: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
  ],
});

// Hashing password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
