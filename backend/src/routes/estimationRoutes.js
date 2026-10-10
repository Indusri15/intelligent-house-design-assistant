const express = require('express');
const router = express.Router();
const {
  getEstimate,
  recalculateEstimate,
  getPackages,
  selectPackage,
  getRates
} = require('../controllers/estimationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/rates', getRates);

router.use(protect);

router.get('/:projectId', getEstimate);
router.post('/recalculate/:projectId', recalculateEstimate);
router.get('/packages/:projectId', getPackages);
router.post('/select-package/:projectId', selectPackage);

module.exports = router;
