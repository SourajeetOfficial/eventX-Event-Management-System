const express = require('express');
const { getUserDashboard } = require('../controllers/userDashboardController');
const { getAdminDashboard } = require('../controllers/adminDashboardController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// User dashboard route
router.get('/user', protect, getUserDashboard);

// Admin dashboard route
router.get('/admin', [protect, admin], getAdminDashboard);

module.exports = router;