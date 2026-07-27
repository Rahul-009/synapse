import express from "express";
import { runAgent } from "../controllers/agent.controller.js";
import { upload, uploadDocument } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/run", runAgent);
router.post("/upload", upload.single("file"), uploadDocument);

export default router;
