const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getSystemStats,
  getDeploymentStats,
  getBillingOverview,
  updateSystemSettings
} = require('../controllers/adminController');

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.get('/stats/system', getSystemStats);
router.get('/stats/deployments', getDeploymentStats);
router.get('/stats/billing', getBillingOverview);

router.put('/settings', updateSystemSettings);

module.exports = router;