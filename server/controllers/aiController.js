// server/controllers/aiController.js
const saathiAgent = require('../ai/agent');

// Define allowed roles for AI access
const ALLOWED_AI_ROLES = ['admin', 'coordinator', 'super_coordinator'];

exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;

    // 1. RBAC Check - Only authorized roles can access AI
    const userRole = req.user?.role?.toLowerCase();
    if (!userRole || !ALLOWED_AI_ROLES.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "AI Chatbot is restricted to Admins and Coordinators.",
      });
    }

    // 2. Input Validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "A valid message is required",
      });
    }

    // 3. Extract Safe User Context (Never expose raw user object)
    const userId = req.user._id?.toString() || req.user.id;
    const userName = req.user.name || 'User';
    
    console.log(`[AI] ${userRole.toUpperCase()} ${userName}: "${message.substring(0, 60)}..."`);

    // 4. Process Query with Full Context
    const response = await saathiAgent.processQuery(
      message.trim(), 
      userId, 
      userName, 
      userRole
    );

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Chat Error:', error.message);
    
    // Distinguish between LLM errors and system errors
    const isLLMError = error.message?.includes('RateLimit') || 
                       error.message?.includes('API key') ||
                       error.message?.includes('Timeout');
                       
    res.status(500).json({
      success: false,
      message: isLLMError 
        ? "AI service is temporarily unavailable. Please try again later."
        : "Failed to process your request",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.getAgentStatus = async (req, res) => {
  try {
    const status = await saathiAgent.getStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};