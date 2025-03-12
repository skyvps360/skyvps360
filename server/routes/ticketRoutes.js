const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  addResponse
} = require('../controllers/ticketController');

router
  .route('/')
  .get(protect, getTickets)
  .post(protect, createTicket);

router
  .route('/:id')
  .get(protect, getTicket)
  .put(protect, updateTicket)
  .delete(protect, deleteTicket);

router.post('/:id/responses', protect, addResponse);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), getAllTickets);

module.exports = router;