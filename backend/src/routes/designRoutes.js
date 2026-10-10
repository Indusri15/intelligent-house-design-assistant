const express = require('express');
const router = express.Router();
const {
  getDesign,
  updateDesign,
  generateInteriorDesign,
  generateExteriorDesign,
  getDesignHistory,
  toggleFavorite,
  selectFinalDesign,
  deleteGeneratedDesign,
  analyzeScene,
  getProviders
} = require('../controllers/designController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/providers', getProviders);
router.post('/analyze-scene', upload.single('file'), analyzeScene);

router.get('/history/:projectId', getDesignHistory);
router.post('/generate/interior/:projectId', generateInteriorDesign);
router.post('/generate/exterior/:projectId', generateExteriorDesign);

router.put('/favorite/:designId', toggleFavorite);
router.put('/select-final/:projectId/:designId', selectFinalDesign);
router.delete('/:designId', deleteGeneratedDesign);

router.get('/:projectId', getDesign);
router.put('/:projectId', updateDesign);

module.exports = router;
