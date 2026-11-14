const express = require('express');
const router = express.Router();

// Existing routes
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/companies', require('./companyRoutes'));
router.use('/leads', require('./leadRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/deals', require('./dealRoutes'));
router.use('/tasks', require('./taskRoutes'));
router.use('/tickets', require('./ticketRoutes'));
router.use('/campaigns', require('./campaignRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/subscriptions', require('./subscriptionRoutes'));
router.use('/deleted', require('./deletedRoutes'));
router.use('/store', require('./storeRoutes'));
router.use('/email', require('./emailRoutes'));

// NEW: Organisation Structure
router.use('/org', require('./orgRoutes'));
router.use('/branches', require('./branchRoutes'));

// NEW: Permissions & Roles
router.use('/access', require('./permissionRoutes'));

// NEW: Vendors/Suppliers
router.use('/vendors', require('./vendorRoutes'));

// NEW: CRM Core (Enquiries, Follow-ups, Calls, Meetings, Notes, Activities)
router.use('/crm', require('./crmCoreRoutes'));

// NEW: Sales (Quotations, Estimates, Sales Orders, Payments, Credit/Debit Notes)
router.use('/sales', require('./salesRoutes'));

// NEW: Purchase
router.use('/purchase', require('./purchaseRoutes'));

// NEW: Accounts & Finance
router.use('/accounts', require('./accountRoutes'));

// NEW: Inventory
router.use('/inventory', require('./inventoryRoutes'));

// NEW: HR & Employee
router.use('/hr', require('./hrRoutes'));

// NEW: Projects (Enhanced with Milestones, Subtasks, Timesheets)
router.use('/projects', require('./projectRoutes'));

// NEW: Support (Knowledge Base, SLA, Notifications, Templates, Documents, Audit Logs)
router.use('/support', require('./supportRoutes'));

// Dashboard (Super Admin aggregation)
router.use('/dashboard', require('./dashboardRoutes'));

// NEW: Expenses
router.use('/expenses', require('./expenseRoutes'));

module.exports = router;

