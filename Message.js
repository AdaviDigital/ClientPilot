// models/Message.js
// Individual chat messages that belong to a Conversation.

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    // Who sent the message: the customer, an agent, or the AI bot itself
    senderType: {
      type: String,
      enum: ['customer', 'agent', 'bot'],
      required: true,
    },
    // Reference to the User document - null when senderType is 'bot'
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
