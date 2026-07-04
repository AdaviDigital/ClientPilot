// controllers/analyticsController.js
// Aggregation queries that power the analytics dashboard.

const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get high-level summary stats for the dashboard
// @route   GET /api/analytics/summary
// @access  Private (agent, admin)
const getSummary = asyncHandler(async (req, res) => {
  const [totalTickets, openTickets, resolvedTickets, totalConversations, totalCustomers] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Ticket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
    Conversation.countDocuments(),
    User.countDocuments({ role: 'customer' }),
  ]);

  // Average resolution time in hours, for tickets that have a resolvedAt timestamp
  const resolutionAgg = await Ticket.aggregate([
    { $match: { resolvedAt: { $ne: null } } },
    {
      $project: {
        resolutionHours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60] },
      },
    },
    { $group: { _id: null, avgResolutionHours: { $avg: '$resolutionHours' } } },
  ]);

  res.json({
    success: true,
    data: {
      totalTickets,
      openTickets,
      resolvedTickets,
      totalConversations,
      totalCustomers,
      avgResolutionHours: resolutionAgg[0] ? Math.round(resolutionAgg[0].avgResolutionHours * 10) / 10 : 0,
    },
  });
});

// @desc    Get ticket counts grouped by status (for pie/bar charts)
// @route   GET /api/analytics/tickets-by-status
// @access  Private (agent, admin)
const getTicketsByStatus = asyncHandler(async (req, res) => {
  const results = await Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  res.json({ success: true, data: results });
});

// @desc    Get ticket volume over the last 14 days (for a line/area chart)
// @route   GET /api/analytics/tickets-timeline
// @access  Private (agent, admin)
const getTicketsTimeline = asyncHandler(async (req, res) => {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const results = await Ticket.aggregate([
    { $match: { createdAt: { $gte: fourteenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: results });
});

// @desc    Get ticket counts grouped by category (for a bar chart)
// @route   GET /api/analytics/tickets-by-category
// @access  Private (agent, admin)
const getTicketsByCategory = asyncHandler(async (req, res) => {
  const results = await Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  res.json({ success: true, data: results });
});

module.exports = { getSummary, getTicketsByStatus, getTicketsTimeline, getTicketsByCategory };
