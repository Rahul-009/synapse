import express from "express";
import {
  listConversations,
  createConversation,
  renameConversation,
  deleteConversation,
  listMessages,
  createMessage,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/conversations", listConversations);
router.post("/conversations", createConversation);
router.patch("/conversations/:id", renameConversation);
router.delete("/conversations/:id", deleteConversation);

router.get("/conversations/:id/messages", listMessages);
router.post("/conversations/:id/messages", createMessage);

export default router;
