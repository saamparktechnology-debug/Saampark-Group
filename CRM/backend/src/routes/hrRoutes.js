const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { employeeController, attendanceController, leaveController, payrollController, performanceController, employeeDocController } = require('../controllers/hrController');

router.use(authenticate);

// Employees
router.get('/employees', employeeController.getAll);
router.get('/employees/:id', employeeController.getById);
router.post('/employees', employeeController.create);
router.put('/employees/:id', employeeController.update);
router.delete('/employees/:id', employeeController.delete);

// Attendance
router.post('/attendance/clock-in', attendanceController.clockIn);
router.post('/attendance/clock-out', attendanceController.clockOut);
router.get('/attendance/status', attendanceController.getStatus);
router.get('/attendance/employee/:employeeId', attendanceController.getByEmployee);
router.get('/attendance/company', attendanceController.getByCompany);

// Leave
router.get('/leave/types', leaveController.getTypes);
router.post('/leave/types', leaveController.createType);
router.post('/leave/request', leaveController.requestLeave);
router.get('/leave/requests', leaveController.getRequests);
router.put('/leave/approve/:id', leaveController.approve);
router.put('/leave/reject/:id', leaveController.reject);

// Payroll
router.get('/payroll', payrollController.getAll);
router.post('/payroll', payrollController.create);
router.put('/payroll/:id/mark-paid', payrollController.markPaid);

// Performance
router.get('/performance/employee/:employeeId', performanceController.getByEmployee);
router.post('/performance', performanceController.create);
router.put('/performance/:id', performanceController.update);

// Employee Documents
router.get('/employee-docs/:employeeId', employeeDocController.getByEmployee);
router.post('/employee-docs', employeeDocController.create);
router.delete('/employee-docs/:id', employeeDocController.delete);

module.exports = router;
