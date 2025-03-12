import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const VerifyEmail = () => {
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useParams();
  const { verifyEmail } = useAuth();

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail(token);
        setVerifying(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Email verification failed');
        setVerifying(false);
      }
    };

    verify();
  }, [token, verifyEmail]);

  if (verifying) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6">Verifying Your Email</h1>
        <p>Please wait while we verify your email address...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Verification Failed</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <p>
          The verification link may have expired. Please{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800">
            login
          </Link>{' '}
          to request a new verification email.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <h1 className="text-3xl font-bold mb-6 text-green-600">Email Verified!</h1>
      <p className="text-gray-600 mb-4">
        Your email has been successfully verified. You can now access all features of your account.
      </p>
      <Link
        to="/login"
        className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Continue to Login
      </Link>
    </div>
  );
};

export default VerifyEmail;