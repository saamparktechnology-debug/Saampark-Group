const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const companyRoutes = require('./companyRoutes');
const leadRoutes = require('./leadRoutes');
const customerRoutes = require('./customerRoutes');
const dealRoutes = require('./dealRoutes');
const taskRoutes = require('./taskRoutes');
const ticketRoutes = require('./ticketRoutes');
const campaignRoutes = require('./campaignRoutes');
const reportRoutes = require('./reportRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const deletedRoutes = require('./deletedRoutes');
const storeRoutes = require('./storeRoutes');
const emailRoutes = require('./emailRoutes');

// Mount Sub-Routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/leads', leadRoutes);
router.use('/customers', customerRoutes);
router.use('/deals', dealRoutes);
router.use('/tasks', taskRoutes);
router.use('/tickets', ticketRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/reports', reportRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/deleted', deletedRoutes);
router.use('/store', storeRoutes);
router.use('/email', emailRoutes);

module.exports = router;

