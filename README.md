# SkyVPS360 - Cloud VPS Management Platform

SkyVPS360 is a comprehensive cloud VPS management platform that integrates with Jelastic PaaS to provide easy deployment, management, and monitoring of virtual private servers.

## Features

- User Authentication & Authorization
- VPS Deployment Management
- Real-time Resource Usage Monitoring
- Pay-as-you-go Billing System
- PayPal Integration
- Automatic Usage Tracking
- Backup & Restore Functionality
- Support Ticket System
- Admin Dashboard

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: React.js (coming soon)
- **Cloud Provider**: Jelastic PaaS
- **Payment Processing**: PayPal
- **Authentication**: JWT

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- PayPal Business Account
- Jelastic PaaS Account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/skyvps360.git
cd skyvps360
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the root directory and add your configuration:
```env
# Copy from .env.example and update with your values
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/updatedetails` - Update user details
- `PUT /api/v1/auth/updatepassword` - Update password
- `POST /api/v1/auth/forgotpassword` - Request password reset
- `PUT /api/v1/auth/resetpassword/:resettoken` - Reset password

### Deployment Endpoints

- `GET /api/v1/deployments` - Get all deployments
- `POST /api/v1/deployments` - Create new deployment
- `GET /api/v1/deployments/:id` - Get single deployment
- `PUT /api/v1/deployments/:id` - Update deployment
- `DELETE /api/v1/deployments/:id` - Delete deployment
- `POST /api/v1/deployments/:id/start` - Start deployment
- `POST /api/v1/deployments/:id/stop` - Stop deployment
- `POST /api/v1/deployments/:id/backup` - Create backup
- `POST /api/v1/deployments/:id/restore/:backupId` - Restore from backup
- `GET /api/v1/deployments/:id/logs` - Get deployment logs

### Billing Endpoints

- `GET /api/v1/billing/current` - Get current billing status
- `GET /api/v1/billing/history` - Get billing history
- `POST /api/v1/billing/paypal/order` - Create PayPal order
- `POST /api/v1/billing/paypal/capture/:orderId` - Capture PayPal payment
- `POST /api/v1/billing/subscription` - Create subscription
- `DELETE /api/v1/billing/subscription/:id` - Cancel subscription
- `GET /api/v1/billing/invoice/:id` - Get invoice
- `PUT /api/v1/billing/info` - Update billing info

### Admin Endpoints

- `GET /api/v1/billing/admin/report` - Get billing reports
- More admin endpoints coming soon...

## Configuration

The application uses environment variables for configuration. See `.env.example` for all required variables.

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run in production
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@skyvps360.com or create a support ticket in the platform.