import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // which agent produced this message (assistant messages only)
    agent: {
      type: String,
      enum: ["chat", "coding", "pdf", "search", "image"],
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
