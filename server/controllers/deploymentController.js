const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Deployment = require('../models/deploymentModel');
const JelasticService = require('../services/jelasticService');
const BillingService = require('../services/billingService');

// @desc    Get all deployments for a user
// @route   GET /api/v1/deployments
// @access  Private
exports.getDeployments = asyncHandler(async (req, res, next) => {
  const deployments = await Deployment.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    count: deployments.length,
    data: deployments
  });
});

// @desc    Get single deployment
// @route   GET /api/v1/deployments/:id
// @access  Private
exports.getDeployment = asyncHandler(async (req, res, next) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return next(new ErrorResponse(`Deployment not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns deployment
  if (deployment.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this deployment', 401));
  }

  res.status(200).json({
    success: true,
    data: deployment
  });
});

// @desc    Create new deployment
// @route   POST /api/v1/deployments
// @access  Private
exports.createDeployment = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Create environment in Jelastic
  const jelasticEnv = await JelasticService.createEnvironment(
    req.user.jelasticCredentials.apiKey,
    {
      envName: req.body.name,
      region: req.body.jelasticRegion,
      type: req.body.type,
      nodeGroups: req.body.nodeGroups
    }
  );

  // Create deployment in our database
  const deployment = await Deployment.create({
    ...req.body,
    jelasticEnvironmentId: jelasticEnv.envId,
    status: 'creating'
  });

  // Start billing for the deployment
  await BillingService.processHourlyUsage(deployment._id);

  res.status(201).json({
    success: true,
    data: deployment
  });
});

// @desc    Update deployment
// @route   PUT /api/v1/deployments/:id
// @access  Private
exports.updateDeployment = asyncHandler(async (req, res, next) => {
  let deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return next(new ErrorResponse(`Deployment not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns deployment
  if (deployment.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this deployment', 401));
  }

  deployment = await Deployment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: deployment
  });
});

// @desc    Delete deployment
// @route   DELETE /api/v1/deployments/:id
// @access  Private
exports.deleteDeployment = asyncHandler(async (req, res, next) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return next(new ErrorResponse(`Deployment not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns deployment
  if (deployment.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to delete this deployment', 401));
  }

  // Delete environment in Jelastic
  await JelasticService.deleteEnvironment(
    req.user.jelasticCredentials.apiKey,
    deployment.jelasticEnvironmentId
  );

  await deployment.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Start deployment
// @route   POST /api/v1/deployments/:id/start
// @access  Private
exports.startDeployment = asyncHandler(async (req, res, next) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return next(new ErrorResponse(`Deployment not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns deployment
  if (deployment.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to start this deployment', 401));
  }

  // Start environment in Jelastic
  await JelasticService.startEnvironment(
    req.user.jelasticCredentials.apiKey,
    deployment.jelasticEnvironmentId
  );

  deployment.status = 'running';
  await deployment.save();

  // Start billing
  await BillingService.processHourlyUsage(deployment._id);

  res.status(200).json({
    success: true,
    data: deployment
  });
});

// @desc    Stop deployment
// @route   POST /api/v1/deployments/:id/stop
// @access  Private
exports.stopDeployment = asyncHandler(async (req, res, next) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return next(new ErrorResponse(`Deployment not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns deployment
  if (deployment.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to stop this deployment', 401));
  }

  // Stop environment in Jelastic
  await JelasticService.stopEnvironment(
    req.user.jelasticCredentials.apiKey,
    deployment.jelasticEnvironmentId
  );

  deployment.status = 'stopped';
  await deployment.save();

  res.status(200).json({
    success: true,
    data: deployment
  });
});

// @desc    Create backup
// @route   POST /api/v1/deployments/:id/backup
// @access  Private
exports.createBackup = asyncHandler(async (req, res, next) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return next(new ErrorResponse(`Deployment not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns deployment
  if (deployment.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to backup this deployment', 401));
  }

  // Create backup in Jelastic
  const backup = await JelasticService.createBackup(
    req.user.jelasticCredentials.apiKey,
    deployment.jelasticEnvironmentId,
    req.body.description
  );

  deployment.lastBackup = Date.now();
  await deployment.save();

  res.status(200).json({
    success: true,
    data: backup
  });
});

// @desc    Restore backup
// @route   POST /api/v1/deployments/:id/restore/:backupId
// @access  Private
exports.restoreBackup = asyncHandler(async (req, res, next) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return next(new ErrorResponse(`Deployment not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns deployment
  if (deployment.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to restore this deployment', 401));
  }

  // Restore backup in Jelastic
  await JelasticService.restoreBackup(
    req.user.jelasticCredentials.apiKey,
    deployment.jelasticEnvironmentId,
    req.params.backupId
  );

  deployment.status = 'updating';
  await deployment.save();

  res.status(200).json({
    success: true,
    data: deployment
  });
});

// @desc    Get deployment logs
// @route   GET /api/v1/deployments/:id/logs
// @access  Private
exports.getDeploymentLogs = asyncHandler(async (req, res, next) => {
  const deployment = await Deployment.findById(req.params.id);

  if (!deployment) {
    return next(new ErrorResponse(`Deployment not found with id of ${req.params.id}`, 404));
  }

  // Make sure user owns deployment
  if (deployment.user.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to access this deployment logs', 401));
  }

  // Get logs from Jelastic
  const logs = await JelasticService.getDeploymentLogs(
    req.user.jelasticCredentials.apiKey,
    deployment.jelasticEnvironmentId
  );

  res.status(200).json({
    success: true,
    data: logs
  });
});