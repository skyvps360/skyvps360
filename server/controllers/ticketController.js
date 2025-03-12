const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Ticket = require('../models/ticketModel');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all tickets for a user
// @route   GET /api/v1/tickets
// @access  Private
exports.getTickets = asyncHandler(async (req, res, next) => {
  const tickets = await Ticket.find({ user: req.user.id })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});

// @desc    Get single ticket
// @route   GET /api/v1/tickets/:id
// @access  Private
exports.getTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('responses.user', 'name email');

  if (!ticket) {
    return next(new ErrorResponse('Ticket not found', 404));
  }

  // Make sure user owns ticket
  if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this ticket', 401));
  }

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Create new ticket
// @route   POST /api/v1/tickets
// @access  Private
exports.createTicket = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  const ticket = await Ticket.create(req.body);

  // Send email notification to admin
  try {
    await sendEmail({
      email: process.env.ADMIN_EMAIL,
      subject: 'New Support Ticket Created',
      message: `A new support ticket has been created:\n\nSubject: ${ticket.subject}\nPriority: ${ticket.priority}\nCategory: ${ticket.category}`
    });
  } catch (err) {
    console.log('Email notification failed:', err);
  }

  res.status(201).json({
    success: true,
    data: ticket
  });
});

// @desc    Update ticket
// @route   PUT /api/v1/tickets/:id
// @access  Private
exports.updateTicket = asyncHandler(async (req, res, next) => {
  let ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return next(new ErrorResponse('Ticket not found', 404));
  }

  // Make sure user owns ticket or is admin
  if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this ticket', 401));
  }

  ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  // If status changed, notify user
  if (req.body.status && req.body.status !== ticket.status) {
    try {
      await sendEmail({
        email: req.user.email,
        subject: 'Support Ticket Status Updated',
        message: `Your support ticket status has been updated to: ${req.body.status}\n\nTicket Subject: ${ticket.subject}`
      });
    } catch (err) {
      console.log('Email notification failed:', err);
    }
  }

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Delete ticket
// @route   DELETE /api/v1/tickets/:id
// @access  Private
exports.deleteTicket = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return next(new ErrorResponse('Ticket not found', 404));
  }

  // Make sure user owns ticket or is admin
  if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this ticket', 401));
  }

  await ticket.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add response to ticket
// @route   POST /api/v1/tickets/:id/responses
// @access  Private
exports.addResponse = asyncHandler(async (req, res, next) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return next(new ErrorResponse('Ticket not found', 404));
  }

  // Make sure user owns ticket or is admin
  if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to respond to this ticket', 401));
  }

  const response = {
    user: req.user.id,
    text: req.body.text,
    isAdmin: req.user.role === 'admin'
  };

  ticket.responses.push(response);
  ticket.status = 'in-progress';
  await ticket.save();

  // Send email notification
  const notifyEmail = req.user.role === 'admin' ? 
    ticket.user.email : 
    process.env.ADMIN_EMAIL;

  try {
    await sendEmail({
      email: notifyEmail,
      subject: 'New Response to Support Ticket',
      message: `A new response has been added to your support ticket:\n\nTicket Subject: ${ticket.subject}\nResponse: ${response.text}`
    });
  } catch (err) {
    console.log('Email notification failed:', err);
  }

  res.status(200).json({
    success: true,
    data: ticket
  });
});

// @desc    Get all tickets (admin)
// @route   GET /api/v1/tickets/admin/all
// @access  Private/Admin
exports.getAllTickets = asyncHandler(async (req, res, next) => {
  const tickets = await Ticket.find()
    .populate('user', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: tickets.length,
    data: tickets
  });
});