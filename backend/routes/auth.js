import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";

const router = express.Router();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, workspace: user.workspace, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// @route  POST /api/auth/signup
// @desc   Business owner signs up -> creates a User + a Workspace
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, businessName } = req.body;

    if (!name || !email || !password || !businessName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    let baseSlug = slugify(businessName);
    let slug = baseSlug;
    let counter = 1;
    while (await Workspace.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "owner",
    });

    const workspace = await Workspace.create({
      name: businessName,
      slug,
      owner: user._id,
    });

    user.workspace = workspace._id;
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      workspace: { id: workspace._id, name: workspace.name, slug: workspace.slug },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const workspace = await Workspace.findById(user.workspace);
    const token = generateToken(user);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      workspace: workspace
        ? { id: workspace._id, name: workspace.name, slug: workspace.slug }
        : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
