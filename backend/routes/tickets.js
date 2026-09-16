import express from "express";
import Ticket from "../models/Ticket.js";
import Workspace from "../models/Workspace.js";
import protect from "../middleware/auth.js";
import { detectPriority } from "../utils/aiClient.js";

const router = express.Router();

// @route  POST /api/tickets/public/:slug
// @desc   Customer creates a ticket (no login needed) via workspace slug
router.post("/public/:slug", async (req, res) => {
  try {
    const { subject, customerName, customerEmail } = req.body;

    const workspace = await Workspace.findOne({ slug: req.params.slug });
    if (!workspace) {
      return res.status(404).json({ message: "Support workspace not found" });
    }

    if (!subject || !customerName || !customerEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // AI reads the subject line and decides how urgent this ticket is.
    const priority = await detectPriority(subject);

    const ticket = await Ticket.create({
      workspace: workspace._id,
      subject,
      customerName,
      customerEmail,
      priority,
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/tickets
// @desc   Get all tickets for the logged-in agent/owner's workspace
router.get("/", protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ workspace: req.user.workspace })
      .populate("assignedAgent", "name email")
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/tickets/:id
router.get("/:id", protect, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      workspace: req.user.workspace,
    }).populate("assignedAgent", "name email");

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  PUT /api/tickets/:id
// @desc   Update ticket status/priority/assignment
router.put("/:id", protect, async (req, res) => {
  try {
    const { status, priority, assignedAgent } = req.body;

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      workspace: req.user.workspace,
    });

    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedAgent !== undefined) ticket.assignedAgent = assignedAgent;

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
