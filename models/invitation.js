const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  token: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
});

module.exports = mongoose.model("Invitation", invitationSchema);
