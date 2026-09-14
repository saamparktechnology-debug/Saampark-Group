const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { branchController, subBranchController } = require('../controllers/branchController');

router.use(authenticate);

// Sub-branch routes FIRST (before parameterized /:id)
router.get('/sub-branches/all', subBranchController.getAll);
router.get('/sub-branches/:id', subBranchController.getById);
router.post('/sub-branches', subBranchController.create);
router.put('/sub-branches/:id', subBranchController.update);
router.delete('/sub-branches/:id', requireRole(1), subBranchController.delete);

// Branch routes
router.get('/stats', branchController.getStats);
router.get('/', branchController.getAll);
router.get('/:id', branchController.getById);
router.post('/', branchController.create);
router.put('/:id', branchController.update);
router.delete('/:id', requireRole(1), branchController.delete);

module.exports = router;

