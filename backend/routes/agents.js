import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import protect from "../middleware/auth.js";
import { sendMail } from "../utils/mailer.js";

const router = express.Router();

const ownerOnly = (req, res, next) => {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Only the workspace owner can do this" });
  }
  next();
};

// @route  GET /api/agents
// @desc   List everyone (owner + agents) in the workspace
router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find({ workspace: req.user.workspace }).select(
      "name email role createdAt"
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/agents
// @desc   Owner invites a new agent — a temp password is generated and emailed
//         (or returned directly if email isn't configured, so the owner can share it)
router.post("/", protect, ownerOnly, async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "This email is already registered" });
    }

    const tempPassword = crypto.randomBytes(4).toString("hex"); // e.g. "a1b2c3d4"
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const agent = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "agent",
      workspace: req.user.workspace,
    });

    await Workspace.findByIdAndUpdate(req.user.workspace, {
      $push: { agents: agent._id },
    });

    const loginUrl = `${process.env.CLIENT_URL}/login`;
    await sendMail({
      to: email,
      subject: "You've been added as a support agent",
      html: `
        <p>Hi ${name},</p>
        <p>You've been added as a support agent. Log in with:</p>
        <p><b>Email:</b> ${email}<br/><b>Temporary password:</b> ${tempPassword}</p>
        <p><a href="${loginUrl}">Log in here</a> and consider changing your password after.</p>
      `,
    });

    res.status(201).json({
      agent: { id: agent._id, name: agent.name, email: agent.email, role: agent.role },
      tempPassword, // shown to the owner too, in case email isn't set up
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  DELETE /api/agents/:id
router.delete("/:id", protect, ownerOnly, async (req, res) => {
  try {
    const agent = await User.findOne({
      _id: req.params.id,
      workspace: req.user.workspace,
      role: "agent",
    });
    if (!agent) return res.status(404).json({ message: "Agent not found" });

    await User.findByIdAndDelete(agent._id);
    await Workspace.findByIdAndUpdate(req.user.workspace, {
      $pull: { agents: agent._id },
    });

    res.json({ message: "Agent removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
