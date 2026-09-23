const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { productController, productCategoryController, brandController, unitController, warehouseController, stockController } = require('../controllers/inventoryController');

router.use(authenticate);

// Products
router.get('/products', productController.getAll);
router.get('/products/low-stock', productController.getLowStock);
router.get('/products/:id', productController.getById);
router.post('/products', productController.create);
router.put('/products/:id', productController.update);
router.delete('/products/:id', productController.delete);

// Categories
router.get('/categories', productCategoryController.getAll);
router.post('/categories', productCategoryController.create);
router.put('/categories/:id', productCategoryController.update);
router.delete('/categories/:id', productCategoryController.delete);

// Brands
router.get('/brands', brandController.getAll);
router.post('/brands', brandController.create);
router.put('/brands/:id', brandController.update);
router.delete('/brands/:id', brandController.delete);

// Units
router.get('/units', unitController.getAll);
router.post('/units', unitController.create);
router.put('/units/:id', unitController.update);
router.delete('/units/:id', unitController.delete);

// Warehouses
router.get('/warehouses', warehouseController.getAll);
router.get('/warehouses/:id', warehouseController.getById);
router.post('/warehouses', warehouseController.create);
router.put('/warehouses/:id', warehouseController.update);
router.delete('/warehouses/:id', warehouseController.delete);

// Stock
router.get('/stock/:warehouseId', stockController.getByWarehouse);
router.post('/stock/transfer', stockController.transfer);
router.post('/stock/adjust', stockController.adjust);

module.exports = router;
