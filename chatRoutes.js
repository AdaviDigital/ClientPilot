// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const {
  startConversation,
  sendMessage,
  getMessages,
  getConversations,
  joinConversation,
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getConversations);
router.post('/start', startConversation);
router.post('/:conversationId/message', sendMessage);
router.get('/:conversationId/messages', getMessages);
router.put('/:conversationId/join', authorize('agent', 'admin'), joinConversation);

module.exports = router;
