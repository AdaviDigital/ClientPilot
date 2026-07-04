// controllers/chatController.js
// Handles AI chatbot conversations: starting a session, sending messages,
// and auto-escalating to a human-managed ticket when needed.

const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const { getAIResponse } = require('../utils/openai');

// @desc    Start a new AI chat conversation
// @route   POST /api/chat/start
// @access  Private
const startConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.create({
    customer: req.user._id,
    mode: 'bot',
  });

  const welcome = await Message.create({
    conversation: conversation._id,
    senderType: 'bot',
    content: `Hi ${req.user.name}, I'm your AI support assistant. How can I help you today?`,
  });

  res.status(201).json({ success: true, data: { conversation, messages: [welcome] } });
});

// @desc    Send a message in a conversation and get the AI's reply
// @route   POST /api/chat/:conversationId/message
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  // Save the customer's message
  const userMessage = await Message.create({
    conversation: conversation._id,
    senderType: 'customer',
    sender: req.user._id,
    content,
  });

  // If a live agent has already taken over, don't generate an AI reply here -
  // the message will instead be delivered to the agent via Socket.io.
  if (conversation.mode === 'live') {
    return res.status(201).json({ success: true, data: { userMessage, botMessage: null } });
  }

  // Build conversation history for OpenAI (last 10 messages for context window efficiency)
  const history = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: 1 })
    .limit(10);

  const formattedHistory = history.map((m) => ({
    role: m.senderType === 'bot' ? 'assistant' : 'user',
    content: m.content,
  }));

  const { reply, shouldEscalate } = await getAIResponse(formattedHistory);

  const botMessage = await Message.create({
    conversation: conversation._id,
    senderType: 'bot',
    content: reply,
  });

  let ticket = null;
  if (shouldEscalate && !conversation.escalatedTicket) {
    ticket = await Ticket.create({
      subject: `AI Escalation: chat with ${req.user.name}`,
      description: content,
      createdBy: req.user._id,
      source: 'ai_escalation',
      priority: 'medium',
    });
    conversation.escalatedTicket = ticket._id;
    conversation.mode = 'live'; // hand off to a human agent
    await conversation.save();
  }

  res.status(201).json({ success: true, data: { userMessage, botMessage, escalatedTicket: ticket } });
});

// @desc    Get all messages for a conversation
// @route   GET /api/chat/:conversationId/messages
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find({ conversation: req.params.conversationId })
    .populate('sender', 'name role')
    .sort({ createdAt: 1 });

  res.json({ success: true, data: messages });
});

// @desc    List conversations - customers see their own, agents see live ones needing help
// @route   GET /api/chat
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const query = req.user.role === 'customer' ? { customer: req.user._id } : { mode: 'live', status: 'active' };

  const conversations = await Conversation.find(query)
    .populate('customer', 'name email')
    .populate('agent', 'name email')
    .sort({ updatedAt: -1 });

  res.json({ success: true, data: conversations });
});

// @desc    Agent joins a live chat conversation, switching it from bot to live handling
// @route   PUT /api/chat/:conversationId/join
// @access  Private (agent, admin)
const joinConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.conversationId);
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  conversation.agent = req.user._id;
  conversation.mode = 'live';
  await conversation.save();

  res.json({ success: true, data: conversation });
});

module.exports = {
  startConversation,
  sendMessage,
  getMessages,
  getConversations,
  joinConversation,
};
