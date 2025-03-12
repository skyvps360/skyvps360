const mongoose = require('mongoose');
const { UsageBilling, Transaction } = require('../models/billingModel');
const User = require('../models/userModel');
const Deployment = require('../models/deploymentModel');

class BillingService {
  /**
   * Start tracking resource usage for a deployment
   * @param {string} userId - User ID
   * @param {string} deploymentId - Deployment ID
   * @param {Object} resources - Resources to track { resourceType, quantity, rate }
   * @returns {Promise<Object>} - Created usage billing record
   */
  async startResourceUsage(userId, deploymentId, resources) {
    try {
      const { resourceType, quantity, rate } = resources;
      
      // Calculate initial cost (will be updated on stop)
      const initialCost = parseFloat((quantity * rate).toFixed(6));
      
      const usageBilling = await UsageBilling.create({
        user: userId,
        deployment: deploymentId,
        resourceType,
        quantity,
        rate,
        cost: initialCost,
        startTime: new Date(),
        billingStatus: 'active'
      });

      return usageBilling;
    } catch (error) {
      console.error('Error starting resource usage tracking:', error);
      throw new Error('Failed to start resource usage tracking');
    }
  }

  /**
   * Stop tracking resource usage and calculate final cost
   * @param {string} usageBillingId - Usage billing record ID
   * @returns {Promise<Object>} - Updated usage billing record
   */
  async stopResourceUsage(usageBillingId) {
    try {
      const endTime = new Date();
      const usageBilling = await UsageBilling.findById(usageBillingId);
      
      if (!usageBilling) {
        throw new Error('Usage billing record not found');
      }
      
      if (usageBilling.billingStatus !== 'active') {
        throw new Error('Usage billing is not active');
      }
      
      // Calculate usage duration in hours
      const startTime = usageBilling.startTime;
      const durationMs = endTime - startTime;
      const durationHours = durationMs / (1000 * 60 * 60);
      
      // Calculate final cost based on duration and rate
      const finalCost = parseFloat((usageBilling.quantity * usageBilling.rate * durationHours).toFixed(6));
      
      // Update the usage billing record
      usageBilling.endTime = endTime;
      usageBilling.cost = finalCost;
      usageBilling.billingStatus = 'billed';
      
      await usageBilling.save();
      
      // Add to the user's current billing cycle
      await this.addToCurrentBillingCycle(usageBilling);
      
      return usageBilling;
    } catch (error) {
      console.error('Error stopping resource usage tracking:', error);
      throw new Error('Failed to stop resource usage tracking');
    }
  }

  /**
   * Add usage record to current billing cycle transaction
   * @param {Object} usageBilling - Usage billing record
   * @returns {Promise<Object>} - Updated transaction
   */
  async addToCurrentBillingCycle(usageBilling) {
    try {
      const userId = usageBilling.user;
      
      // Find or create current billing cycle transaction
      let transaction = await Transaction.findOne({
        user: userId,
        isUsageBilling: true,
        'billingPeriod.endDate': { $gte: new Date() },
        status: { $in: ['pending', 'completed'] }
      }).sort({ createdAt: -1 });
      
      // If no active billing cycle exists, create a new one
      if (!transaction) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // Default to 30-day billing cycle
        
        transaction = await Transaction.create({
          user: userId,
          amount: 0, // Will be calculated from usage records
          currency: 'USD',
          status: 'pending',
          paymentMethod: 'paypal',
          isUsageBilling: true,
          billingPeriod: {
            startDate,
            endDate
          },
          usageRecords: []
        });
      }
      
      // Add the usage record to the transaction
      transaction.usageRecords.push(usageBilling._id);
      
      // Update the total amount (done via pre-save hook)
      await transaction.save();
      
      return transaction;
    } catch (error) {
      console.error('Error adding to billing cycle:', error);
      throw new Error('Failed to update billing cycle');
    }
  }

  /**
   * Get current resource usage for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Current usage summary
   */
  async getCurrentResourceUsage(userId) {
    try {
      // Get all active usage records for the user
      const activeUsage = await UsageBilling.find({
        user: userId,
        billingStatus: 'active'
      });
      
      // Get the current billing cycle
      const currentBillingCycle = await Transaction.findOne({
        user: userId,
        isUsageBilling: true,
        'billingPeriod.endDate': { $gte: new Date() },
        status: { $in: ['pending', 'completed'] }
      })
      .populate('usageRecords')
      .sort({ createdAt: -1 });
      
      // Calculate current costs
      const activeCost = activeUsage.reduce((total, record) => {
        const now = new Date();
        const durationHours = (now - record.startTime) / (1000 * 60 * 60);
        const cost = record.quantity * record.rate * durationHours;
        return total + cost;
      }, 0);
      
      const billedCost = currentBillingCycle ? currentBillingCycle.amount : 0;
      const totalCost = activeCost + billedCost;
      
      // Group by resource type
      const resourceSummary = {};
      if (activeUsage.length > 0) {
        activeUsage.forEach(record => {
          if (!resourceSummary[record.resourceType]) {
            resourceSummary[record.resourceType] = {
              quantity: 0,
              cost: 0
            };
          }
          
          const now = new Date();
          const durationHours = (now - record.startTime) / (1000 * 60 * 60);
          const cost = record.quantity * record.rate * durationHours;
          
          resourceSummary[record.resourceType].quantity += record.quantity;
          resourceSummary[record.resourceType].cost += cost;
        });
      }
      
      // Calculate billing cycle dates
      const billingCycleStart = currentBillingCycle ? currentBillingCycle.billingPeriod.startDate : new Date();
      const billingCycleEnd = currentBillingCycle ? currentBillingCycle.billingPeriod.endDate : new Date();
      
      return {
        userId,
        billingCycle: {
          start: billingCycleStart,
          end: billingCycleEnd,
          daysRemaining: Math.ceil((billingCycleEnd - new Date()) / (1000 * 60 * 60 * 24))
        },
        activeCost: parseFloat(activeCost.toFixed(6)),
        billedCost: parseFloat(billedCost.toFixed(6)),
        totalCost: parseFloat(totalCost.toFixed(6)),
        resourceSummary,
        activeUsage
      };
    } catch (error) {
      console.error('Error getting current resource usage:', error);
      throw new Error('Failed to retrieve current resource usage');
    }
  }

  /**
   * Generate billing report for admin
   * @param {Object} filters - Filtering options { userId, startDate, endDate }
   * @returns {Promise<Object>} - Billing report
   */
  async generateBillingReport(filters = {}) {
    try {
      const { userId, startDate, endDate } = filters;
      
      const query = {};
      
      if (userId) {
        query.user = userId;
      }
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }
      
      // Get all transactions matching the filters
      const transactions = await Transaction.find(query)
        .populate('user', 'name email')
        .populate('usageRecords')
        .sort({ createdAt: -1 });
      
      // Calculate report statistics
      const totalRevenue = transactions.reduce((total, transaction) => {
        return transaction.status === 'completed' ? total + transaction.amount : total;
      }, 0);
      
      const pendingRevenue = transactions.reduce((total, transaction) => {
        return transaction.status === 'pending' ? total + transaction.amount : total;
      }, 0);
      
      // Group by user
      const userSummary = {};
      transactions.forEach(transaction => {
        const userId = transaction.user._id.toString();
        if (!userSummary[userId]) {
          userSummary[userId] = {
            name: transaction.user.name,
            email: transaction.user.email,
            totalBilled: 0,
            totalPending: 0,
            transactions: []
          };
        }
        
        if (transaction.status === 'completed') {
          userSummary[userId].totalBilled += transaction.amount;
        } else if (transaction.status === 'pending') {
          userSummary[userId].totalPending += transaction.amount;
        }
        
        userSummary[userId].transactions.push({
          id: transaction._id,
          amount: transaction.amount,
          status: transaction.status,
          date: transaction.createdAt,
          billingPeriod: transaction.billingPeriod
        });
      });
      
      return {
        totalRevenue: parseFloat(totalRevenue.toFixed(6)),
        pendingRevenue: parseFloat(pendingRevenue.toFixed(6)),
        transactionCount: transactions.length,
        userCount: Object.keys(userSummary).length,
        userSummary,
        transactions
      };
    } catch (error) {
      console.error('Error generating billing report:', error);
      throw new Error('Failed to generate billing report');
    }
  }

  /**
   * Process hourly usage for a deployment
   * @param {string} deploymentId - Deployment ID
   * @returns {Promise<void>}
   */
  async processHourlyUsage(deploymentId) {
    try {
      const deployment = await Deployment.findById(deploymentId);
      if (!deployment) {
        throw new Error('Deployment not found');
      }
      
      // Only process if deployment is running
      if (deployment.status !== 'running') {
        return;
      }
      
      const userId = deployment.user;
      
      // Process cloudlet usage
      const cloudletUsage = await this.startResourceUsage(userId, deploymentId, {
        resourceType: 'cloudlet',
        quantity: deployment.resources.cloudlets,
        rate: 0.006 // Example: $0.006 per cloudlet per hour
      });
      
      // Process storage usage
      const storageUsage = await this.startResourceUsage(userId, deploymentId, {
        resourceType: 'storage',
        quantity: deployment.resources.storage,
        rate: 0.0002 // Example: $0.0002 per GB per hour
      });
      
      // Schedule stop after 1 hour
      setTimeout(async () => {
        try {
          await this.stopResourceUsage(cloudletUsage._id);
          await this.stopResourceUsage(storageUsage._id);
          
          // Recursively process the next hour if still running
          this.processHourlyUsage(deploymentId);
        } catch (error) {
          console.error('Error stopping hourly resource usage:', error);
        }
      }, 60 * 60 * 1000); // 1 hour
      
      return { cloudletUsage, storageUsage };
    } catch (error) {
      console.error('Error processing hourly usage:', error);
      throw new Error('Failed to process hourly usage');
    }
  }
}

module.exports = new BillingService();