// backend/index.js
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import serverless from "serverless-http";
import connectDB from "./config/db.js";
// import "./config/passport.js";
// import loginRoutes from "./routes/authRoute.js";
// import blogRoutes from "./routes/blogRoute.js";
import cookieSession from "cookie-session";

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(
  cookieSession({
    name: "session",
    keys: ["cyberwolve"],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------
// Connect to DB first
// ----------------------
await connectDB();
// ----------------------
// Routes AFTER DB is connected
// ----------------------
// app.use("/api/auth", loginRoutes);
// app.use("/api/blog", blogRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

export const handler = serverless(app);
export default app;
