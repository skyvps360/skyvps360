const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/userModel');
const Deployment = require('../models/deploymentModel');
const { Transaction } = require('../models/billingModel');
const BillingService = require('../services/billingService');
const JelasticService = require('../services/jelasticService');

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select('+jelasticCredentials.apiKey');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select('+jelasticCredentials.apiKey');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Delete user's deployments
  const deployments = await Deployment.find({ user: user._id });
  for (const deployment of deployments) {
    try {
      await JelasticService.deleteEnvironment(
        user.jelasticCredentials.apiKey,
        deployment.jelasticEnvironmentId
      );
      await deployment.remove();
    } catch (err) {
      console.error(`Failed to delete deployment ${deployment._id}:`, err);
    }
  }

  await user.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get system statistics
// @route   GET /api/v1/admin/stats/system
// @access  Private/Admin
exports.getSystemStats = asyncHandler(async (req, res, next) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ 'billingInfo.subscriptionActive': true });
  const totalDeployments = await Deployment.countDocuments();
  const activeDeployments = await Deployment.countDocuments({ status: 'running' });

  // Get revenue stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const monthlyRevenue = await Transaction.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: monthStart }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active: activeUsers
      },
      deployments: {
        total: totalDeployments,
        active: activeDeployments
      },
      revenue: {
        monthly: monthlyRevenue[0]?.total || 0
      }
    }
  });
});

// @desc    Get deployment statistics
// @route   GET /api/v1/admin/stats/deployments
// @access  Private/Admin
exports.getDeploymentStats = asyncHandler(async (req, res, next) => {
  const deploymentsByType = await Deployment.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        activeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] }
        }
      }
    }
  ]);

  const deploymentsByRegion = await Deployment.aggregate([
    {
      $group: {
        _id: '$jelasticRegion',
        count: { $sum: 1 }
      }
    }
  ]);

  const resourceUsage = await Deployment.aggregate([
    {
      $match: { status: 'running' }
    },
    {
      $group: {
        _id: null,
        totalCloudlets: { $sum: '$resources.cloudlets' },
        totalStorage: { $sum: '$resources.storage' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      byType: deploymentsByType,
      byRegion: deploymentsByRegion,
      resourceUsage: resourceUsage[0] || { totalCloudlets: 0, totalStorage: 0 }
    }
  });
});

// @desc    Get billing overview
// @route   GET /api/v1/admin/stats/billing
// @access  Private/Admin
exports.getBillingOverview = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  const report = await BillingService.generateBillingReport({
    startDate: startDate || new Date(new Date().setDate(1)), // Default to start of current month
    endDate: endDate || new Date()
  });

  const subscriptionStats = await User.aggregate([
    {
      $group: {
        _id: '$billingInfo.plan',
        count: { $sum: 1 },
        activeSubscriptions: {
          $sum: { $cond: [{ $eq: ['$billingInfo.subscriptionActive', true] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      billing: report,
      subscriptions: subscriptionStats
    }
  });
});

// @desc    Update system settings
// @route   PUT /api/v1/admin/settings
// @access  Private/Admin
exports.updateSystemSettings = asyncHandler(async (req, res, next) => {
  // This would typically update a settings collection in MongoDB
  // For now, we'll just return success as this needs to be implemented
  // based on what settings need to be configurable
  
  res.status(200).json({
    success: true,
    message: 'Settings updated successfully'
  });
});