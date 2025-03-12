const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getCurrentBilling,
  getBillingHistory,
  createPayPalOrder,
  capturePayPalOrder,
  createSubscription,
  cancelSubscription,
  getInvoice,
  updateBillingInfo
} = require('../controllers/billingController');

router.get('/current', protect, getCurrentBilling);
router.get('/history', protect, getBillingHistory);
router.get('/invoice/:id', protect, getInvoice);

router.post('/paypal/order', protect, createPayPalOrder);
router.post('/paypal/capture/:orderId', protect, capturePayPalOrder);

router.post('/subscription', protect, createSubscription);
router.delete('/subscription/:id', protect, cancelSubscription);

router.put('/info', protect, updateBillingInfo);

// Admin routes
router.get('/admin/report', protect, authorize('admin'), getBillingReport);

module.exports = router;