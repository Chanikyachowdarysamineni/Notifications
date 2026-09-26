const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

// Single unified endpoint to handle all dashboard data based on user role
router.get('/', getDashboard);

module.exports = router;
