const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a deployment name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  jelasticEnvironmentId: {
    type: String,
    required: true
  },
  jelasticRegion: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: [
      'creating', 
      'running', 
      'stopped', 
      'failed', 
      'suspended', 
      'updating'
    ],
    default: 'creating'
  },
  type: {
    type: String,
    enum: ['nodejs', 'php', 'java', 'python', 'docker', 'other'],
    required: true
  },
  resources: {
    cloudlets: {
      type: Number,
      default: 4
    },
    storage: {
      type: Number, // in GB
      default: 10
    }
  },
  url: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastBackup: {
    type: Date
  }
});

// Update the updatedAt field on save
DeploymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Deployment', DeploymentSchema);