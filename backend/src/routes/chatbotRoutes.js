const express = require('express');
const router = express.Router();
const { handleMessage } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/message', handleMessage);

module.exports = router;
