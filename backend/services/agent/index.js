import "dotenv/config";
import express from "express";
import morgan from "morgan";
import agentRoutes from "./routes/agent.route.js";

const app = express();
const port = process.env.PORT || 8003;

app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Reject requests that didn't come through the gateway (no identity header)
app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (!req.headers["x-user-id"]) {
    return res.status(401).json({ message: "Missing user identity" });
  }
  next();
});

app.use("/", agentRoutes);

app.get("/health", (req, res) => res.json({ service: "agent", status: "ok" }));

app.listen(port, () => {
  console.log(`Agent service running on port ${port}`);
});
