const express = require("express");

const BlogPost = require("../models/blogpost");
const Analytics = require("../models/analytics");
const Organization = require("../models/organization");

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const router = express.Router();

// Get all blog posts for an organization with pagination
router.get("/organization/:orgId", auth, authorize, async (req, res) => {
  try {
    const orgId = req.params.orgId;

    const organization = await Organization.findById(orgId);
    if (!organization)
      return res.status(404).json({ message: "Organization not found" });

    // Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogPosts = await BlogPost.find({ organization: orgId })
      .skip(skip)
      .limit(limit)
      .populate("author", "email");

    res.json(blogPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new blog post
router.post("/", auth, authorize, async (req, res) => {
  try {
    const blogPost = new BlogPost({
      title: req.body.title,
      content: req.body.content,
      author: req.user._id,
      organization: req.body.organization,
    });

    await blogPost.save();
    res.status(201).json(blogPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific blog post
router.get("/:blogPostId", auth, authorize, async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.blogPostId).populate(
      "author",
      "email"
    );

    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });

    res.json(blogPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a blog post
router.put("/:blogPostId", auth, authorize, async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.blogPostId);

    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });

    if (blogPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "User not authorized" });
    }

    blogPost.title = req.body.title || blogPost.title;
    blogPost.content = req.body.content || blogPost.content;
    blogPost.status = req.body.status || blogPost.status;

    await blogPost.save();
    res.json(blogPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a blog post
router.delete("/:blogPostId", auth, authorize, async (req, res) => {
  try {
    const blogPost = await BlogPost.findById(req.params.blogPostId);

    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });

    if (blogPost.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "User not authorized" });
    }

    await blogPost.remove();
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get analytics for a specific post, with optional date filtering
router.get("/:postId/analytics", auth, authorize, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { blogPost: req.params.postId };

    if (startDate) filter.date = { $gte: new Date(startDate) };
    if (endDate) {
      if (filter.date) filter.date.$lte = new Date(endDate);
      else filter.date = { $lte: new Date(endDate) };
    }

    const analyticsData = await Analytics.find(filter).sort("date");

    res.json(analyticsData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * Public facing endpoints
 */

// Get all published blog posts for an organization publicly using the slug
router.get("/public/:orgSlug", async (req, res) => {
  try {
    const organization = await Organization.findOne({
      slug: req.params.orgSlug,
    });

    if (!organization)
      return res.status(404).json({ message: "Organization not found" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogPosts = await BlogPost.find({
      organization: organization._id,
      status: "published",
    })
      .skip(skip)
      .limit(limit)
      .populate("author", "email");

    res.json(blogPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific published blog post publicly using the slug and post ID
router.get("/public/:orgSlug/:postId", async (req, res) => {
  try {
    const organization = await Organization.findOne({
      slug: req.params.orgSlug,
    });
    if (!organization)
      return res.status(404).json({ message: "Organization not found" });

    const blogPost = await BlogPost.findOne({
      _id: req.params.postId,
      organization: organization._id,
      status: "published",
    }).populate("author", "email");

    if (!blogPost)
      return res.status(404).json({ message: "Blog post not found" });

    // Update analytics for this post view
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analyticsRecord = await Analytics.findOne({
      blogPost: blogPost._id,
      date: today,
    });

    if (analyticsRecord) {
      analyticsRecord.viewCount++;
      await analyticsRecord.save();
    } else {
      await Analytics.create({
        blogPost: blogPost._id,
        date: today,
        viewCount: 1,
      });
    }

    res.json(blogPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
