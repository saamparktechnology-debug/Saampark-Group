const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { projectController, milestoneController, subtaskController, timesheetController } = require('../controllers/projectController');

router.use(authenticate);

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.delete);

// Milestones
router.get('/milestones/:projectId', milestoneController.getByProject);
router.post('/milestones', milestoneController.create);
router.put('/milestones/:id', milestoneController.update);
router.delete('/milestones/:id', milestoneController.delete);

// Subtasks
router.get('/subtasks/:taskId', subtaskController.getByTask);
router.post('/subtasks', subtaskController.create);
router.put('/subtasks/:id', subtaskController.update);
router.delete('/subtasks/:id', subtaskController.delete);

// Timesheets
router.get('/timesheets', timesheetController.getAll);
router.post('/timesheets', timesheetController.create);
router.put('/timesheets/:id/approve', timesheetController.approve);
router.delete('/timesheets/:id', timesheetController.delete);

module.exports = router;
