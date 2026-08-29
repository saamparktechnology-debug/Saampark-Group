const express = require('express');
const router = express.Router();
const { getDeletedItems, markItemDeleted, unmarkItemDeleted } = require('../controllers/deletedController');

router.get('/', getDeletedItems);
router.post('/', markItemDeleted);
router.post('/restore', unmarkItemDeleted);
router.delete('/:id', unmarkItemDeleted);

module.exports = router;
