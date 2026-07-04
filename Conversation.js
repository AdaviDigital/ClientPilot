// models/Conversation.js
// Represents a chat session - either with the AI chatbot or a live human agent.

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Null until a human agent joins a live chat session
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // 'bot' = handled by AI chatbot, 'live' = human agent has taken over
    mode: {
      type: String,
      enum: ['bot', 'live'],
      default: 'bot',
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    // If the AI decided the conversation needs a human, link to the created ticket
    escalatedTicket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
