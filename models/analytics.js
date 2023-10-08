const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  blogPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BlogPost",
    required: true,
  },
  date: { type: Date, default: Date.now, required: true },
  viewCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Analytics", analyticsSchema);
