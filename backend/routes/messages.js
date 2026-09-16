import express from "express";
import Message from "../models/Message.js";
import Ticket from "../models/Ticket.js";

const router = express.Router();

// @route  GET /api/messages/:ticketId
// @desc   Get all messages for a ticket (open to both agent + customer view)
router.get("/:ticketId", async (req, res) => {
  try {
    const messages = await Message.find({ ticket: req.params.ticketId }).sort({
      createdAt: 1,
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/messages/public/:ticketId
// @desc   Verify a ticket exists (used by customer chat page)
router.get("/public/:ticketId/ticket", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
