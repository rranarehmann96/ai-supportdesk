import express from "express";
import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// @route  GET /api/analytics/summary
router.get("/summary", protect, async (req, res) => {
  try {
    const workspaceId = new mongoose.Types.ObjectId(req.user.workspace);

    const [statusBreakdown, priorityBreakdown, totalTickets, resolvedTickets, last7Days] =
      await Promise.all([
        Ticket.aggregate([
          { $match: { workspace: workspaceId } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Ticket.aggregate([
          { $match: { workspace: workspaceId } },
          { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),
        Ticket.countDocuments({ workspace: workspaceId }),
        Ticket.find({
          workspace: workspaceId,
          status: { $in: ["resolved", "closed"] },
        }).select("createdAt updatedAt"),
        Ticket.aggregate([
          {
            $match: {
              workspace: workspaceId,
              createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    // Average resolution time in hours, based on resolved/closed tickets
    let avgResolutionHours = 0;
    if (resolvedTickets.length > 0) {
      const totalHours = resolvedTickets.reduce((sum, t) => {
        const hours = (t.updatedAt - t.createdAt) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedTickets.length) * 10) / 10;
    }

    // Fill in the last 7 days so the chart always has 7 points, even with 0 tickets
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      const found = last7Days.find((x) => x._id === key);
      days.push({ date: key, count: found ? found.count : 0 });
    }

    res.json({
      totalTickets,
      avgResolutionHours,
      statusBreakdown,
      priorityBreakdown,
      last7Days: days,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
