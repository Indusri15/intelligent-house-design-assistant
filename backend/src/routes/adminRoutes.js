const express = require('express');
const router = express.Router();
const { getAdminStats, updateRates } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('admin'));

router.get('/stats', getAdminStats);
router.put('/rates', updateRates);

module.exports = router;
