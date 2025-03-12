const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./server/config/db');
connectDB();

// Route files
const auth = require('./server/routes/authRoutes');
// Additional routes that we need to create
const deployments = require('./server/routes/deploymentRoutes');
const billing = require('./server/routes/billingRoutes'); 
const tickets = require('./server/routes/ticketRoutes');
const admin = require('./server/routes/adminRoutes');

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/deployments', deployments);
app.use('/api/v1/billing', billing);
app.use('/api/v1/tickets', tickets);
app.use('/api/v1/admin', admin);

// Set static folder
app.use(express.static(path.join(__dirname, 'client/build')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Schedule hourly usage processing for active deployments
const BillingService = require('./server/services/billingService');
const Deployment = require('./server/models/deploymentModel');

// Initialize billing monitoring for running deployments
const initializeBillingMonitoring = async () => {
  try {
    const runningDeployments = await Deployment.find({ status: 'running' });
    console.log(`Initializing billing monitoring for ${runningDeployments.length} active deployments`);
    
    runningDeployments.forEach(deployment => {
      BillingService.processHourlyUsage(deployment._id);
    });
  } catch (error) {
    console.error('Failed to initialize billing monitoring:', error);
  }
};

// Start monitoring after server initialization
setTimeout(initializeBillingMonitoring, 5000);