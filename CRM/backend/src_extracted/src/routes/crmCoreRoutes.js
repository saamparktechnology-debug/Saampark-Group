const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { enquiryController, followUpController, callController, meetingController, noteController, activityController } = require('../controllers/crmCoreController');

router.use(authenticate);

// Enquiries
router.get('/enquiries', enquiryController.getAll);
router.get('/enquiries/:id', enquiryController.getById);
router.post('/enquiries', enquiryController.create);
router.put('/enquiries/:id', enquiryController.update);
router.delete('/enquiries/:id', enquiryController.delete);

// Follow-ups
router.get('/follow-ups', followUpController.getAll);
router.get('/follow-ups/:id', followUpController.getById);
router.post('/follow-ups', followUpController.create);
router.put('/follow-ups/:id', followUpController.update);
router.delete('/follow-ups/:id', followUpController.delete);

// Calls
router.get('/calls', callController.getAll);
router.post('/calls', callController.create);
router.delete('/calls/:id', callController.delete);

// Meetings
router.get('/meetings', meetingController.getAll);
router.get('/meetings/:id', meetingController.getById);
router.post('/meetings', meetingController.create);
router.put('/meetings/:id', meetingController.update);
router.delete('/meetings/:id', meetingController.delete);

// Notes
router.get('/notes/:module_type/:module_id', noteController.getByModule);
router.post('/notes', noteController.create);
router.put('/notes/:id', noteController.update);
router.delete('/notes/:id', noteController.delete);

// Activity Timeline
router.get('/activities', activityController.getAll);
router.get('/activities/:module_type/:module_id', activityController.getByModule);
router.post('/activities', activityController.create);

module.exports = router;
