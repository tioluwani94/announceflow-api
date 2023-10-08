const express = require("express");
const BlogPost = require("../models/blogpost");
const Collection = require("../models/collection");

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// List all collections for the active organization
router.get("/", auth, authorize, async (req, res) => {
  try {
    const collections = await Collection.find({
      organization: req.user.organization_id,
    });
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new collection
router.post("/", auth, authorize, async (req, res) => {
  const { name, description, blogPosts } = req.body;

  try {
    // Validate if all provided blogPost IDs exist and belong to the same organization
    const blogs = await BlogPost.find({
      _id: { $in: blogPosts },
      organization: req.user.organization_id,
    });

    if (blogs.length !== blogPosts.length) {
      return res.status(400).json({
        message:
          "Some blog posts do not exist or are not associated with the current organization.",
      });
    }

    const newCollection = new Collection({
      name,
      description,
      blogPosts: blogPosts,
      organization: req.user.organization_id,
    });

    await newCollection.save();
    res.status(201).json(newCollection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a collection
router.put("/:collectionId", auth, authorize, async (req, res) => {
  try {
    const { name, description, blogPosts } = req.body;
    const collection = await Collection.findById(req.params.collectionId);

    if (!collection)
      return res.status(404).json({ message: "Collection not found" });

    if (name) collection.name = name;
    if (description) collection.description = description;

    // Handle updating of blog posts if provided
    if (blogPosts && Array.isArray(blogPosts)) {
      // Validate if all provided blogPost IDs exist and belong to the same organization
      const blogs = await BlogPost.find({
        _id: { $in: blogPosts },
        organization: req.user.organization_id,
      });

      if (blogs.length !== blogPosts.length) {
        return res.status(400).json({
          message:
            "Some blog posts do not exist or are not associated with the current organization.",
        });
      }

      collection.blogPosts = blogPosts;
    }

    await collection.save();
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a collection
router.delete("/:collectionId", auth, authorize, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.collectionId);

    if (!collection)
      return res.status(404).json({ message: "Collection not found" });

    await collection.remove();
    res.json({ message: "Collection deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
