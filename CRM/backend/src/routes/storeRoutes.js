const express = require('express');
const router = express.Router();
const { getStoreData, saveStoreData } = require('../controllers/storeController');

router.get('/:key', getStoreData);
router.post('/:key', saveStoreData);
router.put('/:key', saveStoreData);

module.exports = router;
