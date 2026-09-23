const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middlewares/authMiddleware');
const { getDeletedItems, markItemDeleted, unmarkItemDeleted } = require('../controllers/deletedController');

router.get('/', optionalAuth, getDeletedItems);
router.post('/', optionalAuth, markItemDeleted);
router.post('/restore', optionalAuth, unmarkItemDeleted);
router.delete('/:id', optionalAuth, unmarkItemDeleted);

module.exports = router;
