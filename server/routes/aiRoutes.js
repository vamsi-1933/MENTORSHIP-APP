// server/routes/aiRoutes.js
const express = require("express");
const router = express.Router();

const { handleChat, getAgentStatus } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

// AI Chat - RBAC enforced inside controller
router.post("/chat", protect, handleChat);

// Optional: Health check for admins only (uses existing allowRoles)
const { allowRoles } = require("../middleware/roleMiddleware");
router.get("/status", protect, allowRoles("admin"), getAgentStatus);

module.exports = router;