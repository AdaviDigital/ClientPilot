// models/Ticket.js
// Mongoose schema for support tickets raised by customers.

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    category: {
      type: String,
      enum: ['billing', 'technical', 'account', 'general', 'other'],
      default: 'general',
    },
    // The customer who raised the ticket
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The support agent currently assigned to resolve the ticket
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // Thread of replies/comments on the ticket (simple embedded sub-documents)
    replies: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Whether this ticket originated from the AI chatbot escalating a conversation
    source: {
      type: String,
      enum: ['manual', 'ai_escalation', 'live_chat'],
      default: 'manual',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index to speed up common dashboard queries (filter by status/priority, sort by date)
ticketSchema.index({ status: 1, createdAt: -1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
