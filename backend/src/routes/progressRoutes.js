const express = require('express');
const router = express.Router();
const {
  getStages,
  updateStage,
  completeStage,
  recordException
} = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:projectId', getStages);
router.put('/:projectId/stages/:stageId', updateStage);
router.post('/:projectId/stages/:stageId/complete', completeStage);
router.post('/:projectId/stages/:stageId/exception', recordException);

module.exports = router;
