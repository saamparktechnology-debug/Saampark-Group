const express = require('express');
const router = express.Router();
const { getDeletedItems, markItemDeleted } = require('../controllers/deletedController');

router.get('/', getDeletedItems);
router.post('/', markItemDeleted);

module.exports = router;
