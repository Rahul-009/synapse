import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { cacheGet, cacheSet, cacheDel } from "../config/redis.js";

const CACHE_TTL = 300; // seconds

const conversationsKey = (userId) => `chat:conversations:${userId}`;
const messagesKey = (conversationId) => `chat:messages:${conversationId}`;

// Gateway verifies the JWT and forwards identity as headers
const getUserId = (req) => req.headers["x-user-id"];

const findOwnedConversation = async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation || conversation.userId !== getUserId(req)) {
    res.status(404).json({ message: "Conversation not found" });
    return null;
  }
  return conversation;
};

export const listConversations = async (req, res) => {
  try {
    const userId = getUserId(req);

    const cached = await cacheGet(conversationsKey(userId));
    if (cached) return res.json({ conversations: cached, cached: true });

    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();
    await cacheSet(conversationsKey(userId), conversations, CACHE_TTL);
    res.json({ conversations });
  } catch (error) {
    console.error("List conversations error:", error.message);
    res.status(500).json({ message: "Failed to list conversations" });
  }
};

export const createConversation = async (req, res) => {
  try {
    const userId = getUserId(req);
    const conversation = await Conversation.create({
      userId,
      title: req.body?.title,
    });
    await cacheDel(conversationsKey(userId));
    res.status(201).json({ conversation });
  } catch (error) {
    console.error("Create conversation error:", error.message);
    res.status(500).json({ message: "Failed to create conversation" });
  }
};

export const renameConversation = async (req, res) => {
  try {
    const conversation = await findOwnedConversation(req, res);
    if (!conversation) return;

    const { title } = req.body ?? {};
    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    conversation.title = title.trim();
    await conversation.save();
    await cacheDel(conversationsKey(conversation.userId));
    res.json({ conversation });
  } catch (error) {
    console.error("Rename conversation error:", error.message);
    res.status(500).json({ message: "Failed to rename conversation" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const conversation = await findOwnedConversation(req, res);
    if (!conversation) return;

    await Message.deleteMany({ conversationId: conversation._id });
    await conversation.deleteOne();
    await cacheDel(
      conversationsKey(conversation.userId),
      messagesKey(conversation._id.toString()),
    );
    res.json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error.message);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
};

export const listMessages = async (req, res) => {
  try {
    const conversation = await findOwnedConversation(req, res);
    if (!conversation) return;

    const key = messagesKey(conversation._id.toString());
    const cached = await cacheGet(key);
    if (cached) return res.json({ messages: cached, cached: true });

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean();
    await cacheSet(key, messages, CACHE_TTL);
    res.json({ messages });
  } catch (error) {
    console.error("List messages error:", error.message);
    res.status(500).json({ message: "Failed to list messages" });
  }
};

export const createMessage = async (req, res) => {
  try {
    const conversation = await findOwnedConversation(req, res);
    if (!conversation) return;

    const { role, content, agent } = req.body ?? {};
    if (!["user", "assistant"].includes(role) || !content?.trim()) {
      return res
        .status(400)
        .json({ message: "Valid role and content are required" });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      role,
      content,
      agent: role === "assistant" ? agent : null,
    });

    // First user message becomes the conversation title
    if (role === "user" && conversation.title === "New chat") {
      conversation.title = content.trim().slice(0, 50);
    }
    conversation.updatedAt = new Date();
    await conversation.save();

    await cacheDel(
      messagesKey(conversation._id.toString()),
      conversationsKey(conversation.userId),
    );

    res.status(201).json({ message });
  } catch (error) {
    console.error("Create message error:", error.message);
    res.status(500).json({ message: "Failed to create message" });
  }
};
