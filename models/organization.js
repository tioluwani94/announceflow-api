const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  isOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  slug: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model("Organization", organizationSchema);
