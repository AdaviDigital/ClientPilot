// controllers/ticketController.js
// CRUD operations and reply/assignment logic for support tickets.

const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private (customer, agent, admin)
const createTicket = asyncHandler(async (req, res) => {
  const { subject, description, priority, category } = req.body;

  if (!subject || !description) {
    res.status(400);
    throw new Error('Subject and description are required');
  }

  const ticket = await Ticket.create({
    subject,
    description,
    priority,
    category,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: ticket });
});

// @desc    Get tickets - customers see their own, agents/admins see all (with filters)
// @route   GET /api/tickets?status=&priority=&page=&limit=
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const { status, priority, category, page = 1, limit = 10 } = req.query;

  const query = {};
  if (req.user.role === 'customer') {
    query.createdBy = req.user._id; // customers only ever see their own tickets
  }
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;

  const skip = (Number(page) - 1) * Number(limit);

  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Ticket.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: tickets,
    pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
  });
});

// @desc    Get a single ticket by id
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('replies.sender', 'name role');

  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  // Customers may only view their own tickets
  if (req.user.role === 'customer' && String(ticket.createdBy._id) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to view this ticket');
  }

  res.json({ success: true, data: ticket });
});

// @desc    Update ticket status, priority, or assigned agent
// @route   PUT /api/tickets/:id
// @access  Private (agent, admin)
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  const { status, priority, assignedTo, category } = req.body;

  if (status) ticket.status = status;
  if (priority) ticket.priority = priority;
  if (category) ticket.category = category;
  if (assignedTo) ticket.assignedTo = assignedTo;

  if (status === 'resolved' || status === 'closed') {
    ticket.resolvedAt = new Date();
  }

  const updated = await ticket.save();
  res.json({ success: true, data: updated });
});

// @desc    Add a reply/comment to a ticket thread
// @route   POST /api/tickets/:id/replies
// @access  Private
const addReply = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400);
    throw new Error('Reply message is required');
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }

  if (req.user.role === 'customer' && String(ticket.createdBy) !== String(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to reply to this ticket');
  }

  ticket.replies.push({ sender: req.user._id, message });
  // Replying to a ticket that was open should move it to in_progress automatically
  if (ticket.status === 'open') ticket.status = 'in_progress';

  await ticket.save();
  res.status(201).json({ success: true, data: ticket });
});

// @desc    Delete a ticket
// @route   DELETE /api/tickets/:id
// @access  Private (admin)
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error('Ticket not found');
  }
  await ticket.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addReply,
  deleteTicket,
};
