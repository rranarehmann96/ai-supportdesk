import express from "express";
import Ticket from "../models/Ticket.js";
import Message from "../models/Message.js";
import protect from "../middleware/auth.js";
import { suggestAgentReply } from "../utils/aiClient.js";

const router = express.Router();

// @route  POST /api/ai/suggest-reply
// @desc   Agent asks AI to draft a reply based on the conversation so far
router.post("/suggest-reply", protect, async (req, res) => {
  try {
    const { ticketId } = req.body;

    const ticket = await Ticket.findOne({
      _id: ticketId,
      workspace: req.user.workspace,
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    const messages = await Message.find({ ticket: ticketId }).sort({ createdAt: 1 });

    if (messages.length === 0) {
      return res.status(400).json({ message: "No conversation yet to reply to" });
    }

    const reply = await suggestAgentReply(ticket.subject, messages);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
