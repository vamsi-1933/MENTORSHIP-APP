const express = require("express");
const cors = require("cors");
const passport = require("./config/passport");
const userRoutes = require("./routes/userRoutes");
const dotenv = require("dotenv");
const adminRoutes = require("./routes/adminRoutes");
const mentorshipRoutes = require("./routes/mentorshipRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const mentorDashboardRoutes = require("./routes/mentorDashboardRoutes");
const menteeDashboardRoutes = require("./routes/menteeDashboardRoutes");
const coordinatorDashboardRoutes = require("./routes/coordinatorDashboardRoutes");


const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");



dotenv.config();

connectDB();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || "").split(","),
]
  .map((o) => (o || "").trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / tools with no Origin header
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      console.warn(`CORS blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/admin", adminRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/mentee", menteeDashboardRoutes);
app.use(
  "/api/coordinator",
  coordinatorDashboardRoutes
);
app.use("/api/mentor", mentorDashboardRoutes);


// Passport
app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);

// Health Check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Saathi Backend Running 🚀"
    });
});

// Safe deploy diagnostics (no secrets)
app.get("/api/health", (req, res) => {
  const client = (process.env.CLIENT_URL || "").trim().replace(/\/$/, "");
  const callback = (process.env.GOOGLE_CALLBACK_URL || "").trim();
  res.json({
    success: true,
    clientUrl: client || null,
    clientIsLocalhost: client.includes("localhost"),
    callbackUrl: callback || null,
    callbackIsLocalhost: callback.includes("localhost"),
    mongoConfigured: Boolean(process.env.MONGO_URI),
    googleConfigured: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
  });
});

module.exports = app;