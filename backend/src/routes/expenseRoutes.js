const express = require('express');
const router = express.Router();
const {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/:projectId', getExpenses);
router.post('/:projectId', upload.single('invoice'), addExpense);
router.put('/:projectId/:expenseId', updateExpense);
router.delete('/:projectId/:expenseId', deleteExpense);

module.exports = router;
