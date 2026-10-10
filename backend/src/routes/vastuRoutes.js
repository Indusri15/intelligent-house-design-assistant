const express = require('express');
const router = express.Router();
const { getVastuResult, evaluateVastu } = require('../controllers/vastuController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:projectId', getVastuResult);
router.post('/evaluate/:projectId', evaluateVastu);

module.exports = router;
