const express = require('express');
const { verifyToken, restrictTo } = require('../middleware/authMiddleware');
const { searchUsers } = require('../controllers/searchController');

const router = express.Router();

router.use(verifyToken);
router.use(restrictTo('admin', 'deo', 'faculty'));

router.get('/', searchUsers);

module.exports = router;
