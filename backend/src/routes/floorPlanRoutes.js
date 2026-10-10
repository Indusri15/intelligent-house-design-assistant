const express = require('express');
const router = express.Router();
const {
  generateFloorPlan,
  getFloorPlan,
  selectLayoutCandidate,
  saveRevision
} = require('../controllers/floorPlanController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate/:projectId', generateFloorPlan);
router.get('/:projectId', getFloorPlan);
router.post('/select/:projectId', selectLayoutCandidate);
router.post('/save-revision/:projectId', saveRevision);

module.exports = router;
