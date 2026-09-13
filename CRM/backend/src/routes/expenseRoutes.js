const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const expenseController = require('../controllers/expenseController');

router.use(authenticate);

router.get('/stats', expenseController.getStats);
router.get('/', expenseController.getAll);
router.get('/:id', expenseController.getById);
router.post('/', expenseController.create);
router.put('/:id', expenseController.update);
router.patch('/:id/status', expenseController.updateStatus);
router.delete('/:id', expenseController.delete);

module.exports = router;
