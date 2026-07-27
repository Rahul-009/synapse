import "dotenv/config";
import express from "express";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.route.js";

const app = express();
const port = process.env.PORT || 8001;

app.use(express.json());
app.use(morgan("dev"));

app.use("/", authRoutes);

app.get("/health", (req, res) => res.json({ service: "auth", status: "ok" }));

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Auth service running on port ${port}`);
  });
});
