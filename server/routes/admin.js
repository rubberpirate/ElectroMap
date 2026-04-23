const express = require('express');

const {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  getAdminReviews,
  getAdminChargers,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/reviews', getAdminReviews);
router.get('/chargers', getAdminChargers);

module.exports = router;
