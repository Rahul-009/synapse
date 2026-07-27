import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import proxy from "express-http-proxy";
import { protect } from "./middleware/auth.middleware.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import { getCurrentUser } from "./controllers/user.controller.js";

dotenv.config();

const port = process.env.PORT;

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(morgan("dev"));

// Public: login/register must be reachable without a token
app.use("/api/auth", proxy(process.env.AUTH_SERVICE));

// Protected: downstream services receive the user's identity via headers
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE));

// Agent uses http-proxy-middleware (streams SSE responses, which
// express-http-proxy would buffer)
app.use(
  "/api/agent",
  protect,
  createProxyMiddleware({
    target: process.env.AGENT_SERVICE,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user) {
          proxyReq.setHeader("x-user-id", req.user.id);
          proxyReq.setHeader("x-user-email", req.user.email);
        }
      },
    },
  }),
);

app.get("/api/me", protect, getCurrentUser);

app.get("/", (req, res) => res.json({ service: "gateway", status: "ok" }));

app.listen(port, () => {
  console.log(`Gateway running on port ${port}`);
});
