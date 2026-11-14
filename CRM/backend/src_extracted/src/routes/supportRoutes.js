const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { knowledgeBaseController, slaController, notificationController, messageTemplateController, documentController, auditLogController, reminderController } = require('../controllers/supportController');

router.use(authenticate);

// Knowledge Base
router.get('/knowledge-base', knowledgeBaseController.getAll);
router.get('/knowledge-base/:id', knowledgeBaseController.getById);
router.post('/knowledge-base', knowledgeBaseController.create);
router.put('/knowledge-base/:id', knowledgeBaseController.update);
router.delete('/knowledge-base/:id', knowledgeBaseController.delete);

// SLA
router.get('/sla', slaController.getAll);
router.post('/sla', slaController.create);
router.put('/sla/:id', slaController.update);
router.delete('/sla/:id', slaController.delete);

// Notifications
router.get('/notifications', notificationController.getAll);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', notificationController.markRead);
router.put('/notifications/read-all', notificationController.markAllRead);

// Message Templates
router.get('/templates', messageTemplateController.getAll);
router.post('/templates', messageTemplateController.create);
router.put('/templates/:id', messageTemplateController.update);
router.delete('/templates/:id', messageTemplateController.delete);

// Documents
router.get('/documents', documentController.getAll);
router.get('/documents/expiring', documentController.getExpiring);
router.get('/documents/:id', documentController.getById);
router.post('/documents', documentController.create);
router.delete('/documents/:id', documentController.delete);

// Audit Logs
router.get('/audit-logs', auditLogController.getAll);
router.post('/audit-logs', auditLogController.create);

// Reminders
router.get('/reminders', reminderController.getMy);
router.post('/reminders', reminderController.create);
router.delete('/reminders/:id', reminderController.delete);

module.exports = router;
