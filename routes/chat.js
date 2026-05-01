const express = require('express');
const router = express.Router();
const { handleChatQuery } = require('../controllers/chatController');

// POST /api/chat
router.post('/', handleChatQuery);

module.exports = router;
