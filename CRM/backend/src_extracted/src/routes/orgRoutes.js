const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { departmentController, designationController, teamController } = require('../controllers/orgController');

router.use(authenticate);

// Departments
router.get('/departments', departmentController.getAll);
router.get('/departments/:id', departmentController.getById);
router.post('/departments', departmentController.create);
router.put('/departments/:id', departmentController.update);
router.delete('/departments/:id', departmentController.delete);

// Designations
router.get('/designations', designationController.getAll);
router.post('/designations', designationController.create);
router.put('/designations/:id', designationController.update);
router.delete('/designations/:id', designationController.delete);

// Teams
router.get('/teams', teamController.getAll);
router.get('/teams/:id', teamController.getById);
router.post('/teams', teamController.create);
router.put('/teams/:id', teamController.update);
router.delete('/teams/:id', teamController.delete);
router.post('/teams/:id/members', teamController.addMember);
router.delete('/teams/:id/members/:userId', teamController.removeMember);

module.exports = router;
