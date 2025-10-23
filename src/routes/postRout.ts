// routes/postRoutes.ts
import express from "express";
import Post from "../models/Post";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Create post
router.post("/", protect, upload.single("image"), async (req: AuthRequest, res) => {
  try {
    const post = new Post({
      ...req.body,
      author: req.user._id,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "name email");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get logged-in user posts
router.get("/my", protect, async (req: AuthRequest, res) => {
  try {
    console.log("req.user:", req.user); // must not be undefined
    const posts = await Post.find({ author: req.user._id }).sort({ createdAt: -1 });
    console.log("posts found:", posts);
    res.json(posts);
  } catch (err) {
    console.error("Fetch my posts error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// Update post
router.put("/:id", protect, upload.single("image"), async (req: AuthRequest, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    // Update fields
    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    if (req.file) post.imageUrl = `/uploads/${req.file.filename}`;
    console.log("Updated post data:", post);

    await post.save();
    res.json(post);
  } catch (err) {
    console.error("UPDATE POST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Delete post
router.delete("/:id", protect, async (req: AuthRequest, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
