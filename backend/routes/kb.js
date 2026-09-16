import express from "express";
import Article from "../models/Article.js";
import Workspace from "../models/Workspace.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// @route  GET /api/kb
// @desc   List all articles for the logged-in agent's workspace
router.get("/", protect, async (req, res) => {
  try {
    const articles = await Article.find({ workspace: req.user.workspace }).sort({
      createdAt: -1,
    });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/kb
router.post("/", protect, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const article = await Article.create({
      workspace: req.user.workspace,
      title,
      content,
      tags: tags || [],
      createdBy: req.user.id,
    });

    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  PUT /api/kb/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    const article = await Article.findOne({
      _id: req.params.id,
      workspace: req.user.workspace,
    });
    if (!article) return res.status(404).json({ message: "Article not found" });

    if (title) article.title = title;
    if (content) article.content = content;
    if (tags) article.tags = tags;

    await article.save();
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  DELETE /api/kb/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const article = await Article.findOneAndDelete({
      _id: req.params.id,
      workspace: req.user.workspace,
    });
    if (!article) return res.status(404).json({ message: "Article not found" });
    res.json({ message: "Article deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/kb/public/:slug?query=...
// @desc   Customer-facing search, no login needed
router.get("/public/:slug", async (req, res) => {
  try {
    const workspace = await Workspace.findOne({ slug: req.params.slug });
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    const { query } = req.query;
    const filter = { workspace: workspace._id };

    if (query && query.trim()) {
      const regex = new RegExp(query.trim(), "i");
      filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
    }

    const articles = await Article.find(filter).sort({ createdAt: -1 }).limit(10);
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
