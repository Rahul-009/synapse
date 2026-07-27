import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  vectorStore,
  ensureCollection,
  deleteConversationVectors,
} from "../config/vectorstore.config.js";

const UPLOAD_DIR = path.resolve("uploads");
await fs.mkdir(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md"];

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(
      null,
      ALLOWED_EXTENSIONS.includes(
        path.extname(file.originalname).toLowerCase(),
      ),
    ),
});

const extractText = async (filePath, extension) => {
  if (extension === ".pdf") {
    const parser = new PDFParse({
      data: new Uint8Array(await fs.readFile(filePath)),
    });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }
  return fs.readFile(filePath, "utf8");
};

export const uploadDocument = async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({
      message: "A .pdf, .txt or .md file is required (max 20MB)",
    });
  }

  try {
    const { conversationId } = req.body ?? {};
    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    const text = await extractText(
      file.path,
      path.extname(file.originalname).toLowerCase(),
    );
    if (!text?.trim()) {
      return res.status(422).json({
        message:
          "No text could be extracted from this file (scanned/image-only PDFs are not supported)",
      });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 150,
    });
    const docs = await splitter.createDocuments(
      [text],
      [
        {
          userId: req.headers["x-user-id"],
          conversationId,
          source: file.originalname,
        },
      ],
    );

    await ensureCollection();
    // Re-uploading replaces the conversation's previous document
    await deleteConversationVectors(conversationId);
    await vectorStore.addDocuments(docs);

    res.json({ chunks: docs.length, name: file.originalname });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ message: "Failed to index document" });
  }
  // finally {
  //   // The PDF is never kept — vectors in Qdrant are the source of truth
  //   await fs.unlink(file.path).catch(() => {});
  // }
};
