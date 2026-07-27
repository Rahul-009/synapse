import "dotenv/config";
import express from "express";
import morgan from "morgan";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chat.route.js";

const app = express();
const port = process.env.PORT || 8002;

app.use(express.json());
app.use(morgan("dev"));

// Reject requests that didn't come through the gateway (no identity header)
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (!req.headers["x-user-id"]) {
    return res.status(401).json({ message: "Missing user identity" });
  }
  next();
});

app.use("/", chatRoutes);

app.get("/health", (req, res) => res.json({ service: "chat", status: "ok" }));

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Chat service running on port ${port}`);
  });
});
