const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware.js');
const wrapAsync = require('../utils/wrapAsync');
const chatbotController = require('../controllers/chatbot.js');

// Send message to chatbot
router.post('/message', isLoggedIn, wrapAsync(chatbotController.sendMessage));

// Get chat history for a session
router.get('/history/:sessionId', isLoggedIn, wrapAsync(chatbotController.getChatHistory));

// Get user's chat sessions
router.get('/sessions', isLoggedIn, wrapAsync(chatbotController.getUserSessions));

// Mark message as resolved
router.put('/resolve/:messageId', isLoggedIn, wrapAsync(chatbotController.markAsResolved));

// Get quick help topics
router.get('/quick-help', wrapAsync(chatbotController.getQuickHelp));

module.exports = router;
