const subscriptionModel = require('../models/subscriptionModel');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// 1. Fetch all packages
const getPackages = async (req, res, next) => {
  try {
    const packages = await subscriptionModel.getAllPackages();
    return successResponse(res, 200, 'Subscription packages fetched successfully', packages);
  } catch (error) {
    next(error);
  }
};

// 2. Subscribe a Customer to a Package
const subscribeCustomer = async (req, res, next) => {
  try {
    const { customer_id, package_id, billing_cycle, payment_method } = req.body;

    // Calculate dates (default 1 month)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (billing_cycle === 'yearly' ? 12 : 1));

    const subscriptionId = await subscriptionModel.createSubscription({
      customer_id,
      package_id,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      billing_cycle: billing_cycle || 'monthly',
    });

    // Create Invoice / Payment Record
    const invoiceNum = `INV-${Date.now()}`;
    await subscriptionModel.createInvoice({
      subscription_id: subscriptionId,
      invoice_number: invoiceNum,
      amount: req.body.amount || 0.00,
      payment_method: payment_method || 'upi',
    });

    return successResponse(res, 201, 'Customer subscribed successfully', {
      subscription_id: subscriptionId,
      invoice_number: invoiceNum,
    });
  } catch (error) {
    next(error);
  }
};

// 3. List All Subscriptions
const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionModel.getAllSubscriptions();
    return successResponse(res, 200, 'Subscriptions fetched successfully', subscriptions);
  } catch (error) {
    next(error);
  }
};

// 4. Update Subscription Status (Cancel / Renew)
const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // active, cancelled, expired

    await subscriptionModel.updateSubscriptionStatus(id, status);
    return successResponse(res, 200, `Subscription status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPackages,
  subscribeCustomer,
  getSubscriptions,
  changeStatus,
};