const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String }, // optional description for the collection
  blogPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "BlogPost" }],
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
});

module.exports = mongoose.model("Collection", collectionSchema);
