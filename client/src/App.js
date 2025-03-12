import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/routing/PrivateRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Main Pages
import Dashboard from './pages/Dashboard';
import Deployments from './pages/deployments/Deployments';
import DeploymentDetails from './pages/deployments/DeploymentDetails';
import CreateDeployment from './pages/deployments/CreateDeployment';
import Billing from './pages/billing/Billing';
import BillingHistory from './pages/billing/BillingHistory';
import Support from './pages/support/Support';
import TicketDetails from './pages/support/TicketDetails';
import CreateTicket from './pages/support/CreateTicket';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDeployments from './pages/admin/Deployments';
import AdminBilling from './pages/admin/Billing';
import AdminSupport from './pages/admin/Support';
import AdminSettings from './pages/admin/Settings';

// Context
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />

              {/* Protected Routes */}
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/deployments" element={<PrivateRoute><Deployments /></PrivateRoute>} />
              <Route path="/deployments/create" element={<PrivateRoute><CreateDeployment /></PrivateRoute>} />
              <Route path="/deployments/:id" element={<PrivateRoute><DeploymentDetails /></PrivateRoute>} />
              <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
              <Route path="/billing/history" element={<PrivateRoute><BillingHistory /></PrivateRoute>} />
              <Route path="/support" element={<PrivateRoute><Support /></PrivateRoute>} />
              <Route path="/support/create" element={<PrivateRoute><CreateTicket /></PrivateRoute>} />
              <Route path="/support/:id" element={<PrivateRoute><TicketDetails /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<PrivateRoute admin><AdminDashboard /></PrivateRoute>} />
              <Route path="/admin/users" element={<PrivateRoute admin><AdminUsers /></PrivateRoute>} />
              <Route path="/admin/deployments" element={<PrivateRoute admin><AdminDeployments /></PrivateRoute>} />
              <Route path="/admin/billing" element={<PrivateRoute admin><AdminBilling /></PrivateRoute>} />
              <Route path="/admin/support" element={<PrivateRoute admin><AdminSupport /></PrivateRoute>} />
              <Route path="/admin/settings" element={<PrivateRoute admin><AdminSettings /></PrivateRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
        <ToastContainer />
      </Router>
    </AuthProvider>
  );
};

export default App;