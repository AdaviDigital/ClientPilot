// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const {
  getSummary,
  getTicketsByStatus,
  getTicketsTimeline,
  getTicketsByCategory,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('agent', 'admin'));

router.get('/summary', getSummary);
router.get('/tickets-by-status', getTicketsByStatus);
router.get('/tickets-timeline', getTicketsTimeline);
router.get('/tickets-by-category', getTicketsByCategory);

module.exports = router;
