const mongoose = require('mongoose');

const BillingPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a plan name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a plan description']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billingInterval: {
    type: String,
    enum: ['hourly', 'monthly', 'quarterly', 'annual'],
    default: 'hourly'
  },
  features: [{
    type: String
  }],
  resources: {
    maxCloudlets: {
      type: Number,
      required: true
    },
    maxStorage: {
      type: Number,  // in GB
      required: true
    },
    maxEnvironments: {
      type: Number,
      required: true
    }
  },
  paypalPlanId: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const UsageBillingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deployment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment',
    required: true
  },
  resourceType: {
    type: String,
    enum: ['cloudlet', 'storage', 'transfer', 'other'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  rate: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  billingStatus: {
    type: String,
    enum: ['active', 'billed', 'error'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BillingPlan'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'paypal'
  },
  paymentId: {
    type: String
  },
  subscriptionId: {
    type: String
  },
  billingPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  usageRecords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsageBilling'
  }],
  isUsageBilling: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate current billing before saving transaction
TransactionSchema.pre('save', async function(next) {
  if (this.isUsageBilling && this.isModified('usageRecords')) {
    // Recalculate the total amount based on usage records
    let total = 0;
    if (this.usageRecords && this.usageRecords.length > 0) {
      const UsageBilling = mongoose.model('UsageBilling');
      const records = await UsageBilling.find({
        _id: { $in: this.usageRecords }
      });
      
      records.forEach(record => {
        total += record.cost;
      });
      
      this.amount = total;
    }
  }
  next();
});

exports.BillingPlan = mongoose.model('BillingPlan', BillingPlanSchema);
exports.UsageBilling = mongoose.model('UsageBilling', UsageBillingSchema);
exports.Transaction = mongoose.model('Transaction', TransactionSchema);