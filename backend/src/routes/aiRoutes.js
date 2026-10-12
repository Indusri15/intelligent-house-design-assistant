const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  checkHealth,
  analyzeSiteImage,
  segmentFloorplan,
  getAde20kInfo
} = require('../controllers/aiController');

// Public or protected AI service health check
router.get('/health', checkHealth);
router.get('/ade20k/info', getAde20kInfo);

// Protected CV endpoints
router.post('/analyze-site-image', upload.single('file'), analyzeSiteImage);
router.post('/segment-floorplan', upload.single('file'), segmentFloorplan);

module.exports = router;
