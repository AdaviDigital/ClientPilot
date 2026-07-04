// routes/ticketRoutes.js
const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  addReply,
  deleteTicket,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // every ticket route requires authentication

router.route('/')
  .get(getTickets)
  .post(createTicket);

router.route('/:id')
  .get(getTicketById)
  .put(authorize('agent', 'admin'), updateTicket)
  .delete(authorize('admin'), deleteTicket);

router.post('/:id/replies', addReply);

module.exports = router;
