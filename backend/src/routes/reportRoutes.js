const express = require('express');
const router = express.Router();
const { downloadPdf, downloadExcel } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:projectId/pdf', downloadPdf);
router.get('/:projectId/excel', downloadExcel);

module.exports = router;
