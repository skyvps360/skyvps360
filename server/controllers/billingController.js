const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const BillingService = require('../services/billingService');
const PayPalService = require('../services/paypalService');
const { Transaction, BillingPlan } = require('../models/billingModel');
const User = require('../models/userModel');

// @desc    Get current billing status and usage
// @route   GET /api/v1/billing/current
// @access  Private
exports.getCurrentBilling = asyncHandler(async (req, res, next) => {
  const currentUsage = await BillingService.getCurrentResourceUsage(req.user.id);
  res.status(200).json({
    success: true,
    data: currentUsage
  });
});

// @desc    Get billing history
// @route   GET /api/v1/billing/history
// @access  Private
exports.getBillingHistory = asyncHandler(async (req, res, next) => {
  const transactions = await Transaction.find({ 
    user: req.user.id 
  }).sort('-createdAt');

  res.status(200).json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});

// @desc    Create PayPal order for one-time payment
// @route   POST /api/v1/billing/paypal/order
// @access  Private
exports.createPayPalOrder = asyncHandler(async (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return next(new ErrorResponse('Please provide an amount', 400));
  }

  const order = await PayPalService.createOrder(
    amount,
    'USD',
    'SkyVPS360 Credit Purchase'
  );

  res.status(200).json({
    success: true,
    data: order
  });
});

// @desc    Capture PayPal payment
// @route   POST /api/v1/billing/paypal/capture/:orderId
// @access  Private
exports.capturePayPalOrder = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  
  const captureData = await PayPalService.capturePayment(orderId);
  
  // Create transaction record
  const transaction = await Transaction.create({
    user: req.user.id,
    amount: captureData.purchase_units[0].payments.captures[0].amount.value,
    currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code,
    status: 'completed',
    paymentId: captureData.id,
    paymentMethod: 'paypal'
  });

  res.status(200).json({
    success: true,
    data: transaction
  });
});

// @desc    Create subscription
// @route   POST /api/v1/billing/subscription
// @access  Private
exports.createSubscription = asyncHandler(async (req, res, next) => {
  const { planId } = req.body;

  if (!planId) {
    return next(new ErrorResponse('Please provide a plan ID', 400));
  }

  const plan = await BillingPlan.findById(planId);
  if (!plan || !plan.isActive) {
    return next(new ErrorResponse('Invalid or inactive plan', 400));
  }

  // Create PayPal subscription
  const subscription = await PayPalService.createSubscription(plan.paypalPlanId);

  // Update user's billing info
  await User.findByIdAndUpdate(req.user.id, {
    'billingInfo.plan': plan.name,
    'billingInfo.subscriptionId': subscription.id,
    'billingInfo.subscriptionActive': true
  });

  res.status(200).json({
    success: true,
    data: subscription
  });
});

// @desc    Cancel subscription
// @route   DELETE /api/v1/billing/subscription/:id
// @access  Private
exports.cancelSubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.billingInfo.subscriptionActive) {
    return next(new ErrorResponse('No active subscription found', 404));
  }

  await PayPalService.cancelSubscription(
    user.billingInfo.subscriptionId,
    req.body.reason
  );

  // Update user's billing info
  user.billingInfo.subscriptionActive = false;
  user.billingInfo.subscriptionId = null;
  user.billingInfo.plan = 'free';
  await user.save();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get invoice
// @route   GET /api/v1/billing/invoice/:id
// @access  Private
exports.getInvoice = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(req.params.id);

  if (!transaction) {
    return next(new ErrorResponse('Invoice not found', 404));
  }

  // Make sure user owns transaction
  if (transaction.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this invoice', 401));
  }

  // Generate invoice data
  const invoice = {
    id: transaction._id,
    date: transaction.createdAt,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    items: transaction.usageRecords || [],
    user: {
      name: req.user.name,
      email: req.user.email
    }
  };

  res.status(200).json({
    success: true,
    data: invoice
  });
});

// @desc    Update billing info
// @route   PUT /api/v1/billing/info
// @access  Private
exports.updateBillingInfo = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      'billingInfo.paymentMethod': req.body.paymentMethod
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: user.billingInfo
  });
});

// @desc    Get billing report (Admin only)
// @route   GET /api/v1/billing/admin/report
// @access  Private/Admin
exports.getBillingReport = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, userId } = req.query;
  
  const report = await BillingService.generateBillingReport({
    startDate,
    endDate,
    userId
  });

  res.status(200).json({
    success: true,
    data: report
  });
});