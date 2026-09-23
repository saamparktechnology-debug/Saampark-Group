const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { permissionController, matrixController } = require('../controllers/permissionController');

router.use(authenticate);

// ─── Standard permission rows (permission_id based) ──────────────────────────
router.get('/permissions', permissionController.getAllPermissions);
router.get('/modules', permissionController.getModules);
router.get('/check', permissionController.checkPermission);
router.get('/roles/:roleId', permissionController.getRolePermissions);
router.put('/roles/:roleId', permissionController.setRolePermissions);
router.get('/users/:userId', permissionController.getUserPermissions);
router.put('/users/:userId', permissionController.setUserPermissions);

// ─── Custom roles ─────────────────────────────────────────────────────────────
router.get('/custom-roles', permissionController.getCustomRoles);
router.post('/custom-roles', permissionController.createCustomRole);
router.put('/custom-roles/:id', permissionController.updateCustomRole);
router.delete('/custom-roles/:id', permissionController.deleteCustomRole);

// ─── Matrix-format permission storage (module: { view, add, edit, delete }) ──
router.get('/matrices', matrixController.getAllRoleMatrices);
router.get('/roles/:roleId/matrix', matrixController.getRoleMatrix);
router.put('/roles/:roleId/matrix', matrixController.saveRoleMatrix);
router.post('/roles/:roleId/matrix', matrixController.saveRoleMatrix);
router.get('/users/:userId/matrix', matrixController.getUserMatrix);
router.put('/users/:userId/matrix', matrixController.saveUserMatrix);
router.post('/users/:userId/matrix', matrixController.saveUserMatrix);

module.exports = router;
