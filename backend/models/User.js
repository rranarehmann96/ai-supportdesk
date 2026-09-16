import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "agent", "customer"],
      default: "owner",
    },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
