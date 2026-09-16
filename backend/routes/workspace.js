import express from "express";
import Workspace from "../models/Workspace.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// @route  GET /api/workspace/me
// @desc   Get the logged-in user's workspace
router.get("/me", protect, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.user.workspace).populate(
      "agents",
      "name email"
    );
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
