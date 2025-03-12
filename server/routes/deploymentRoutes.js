const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Import controllers - we'll need to create these next
const {
  getDeployments,
  getDeployment,
  createDeployment,
  updateDeployment,
  deleteDeployment,
  startDeployment,
  stopDeployment,
  createBackup,
  restoreBackup,
  getDeploymentLogs
} = require('../controllers/deploymentController');

// Routes
router
  .route('/')
  .get(protect, getDeployments)
  .post(protect, createDeployment);

router
  .route('/:id')
  .get(protect, getDeployment)
  .put(protect, updateDeployment)
  .delete(protect, deleteDeployment);

router.route('/:id/start').post(protect, startDeployment);
router.route('/:id/stop').post(protect, stopDeployment);
router.route('/:id/backup').post(protect, createBackup);
router.route('/:id/restore/:backupId').post(protect, restoreBackup);
router.route('/:id/logs').get(protect, getDeploymentLogs);

module.exports = router;