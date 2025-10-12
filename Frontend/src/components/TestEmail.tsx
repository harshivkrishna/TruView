import React, { useState } from 'react';
import { emailService } from '../services/emailService';

const TestEmail: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);

  const handleTestEmail = async () => {
    if (!email) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Send verification OTP as test
      const emailResult = await emailService.sendVerificationOTP(email, '123456', 'Test User');
      setResult(emailResult);
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Failed to send test email',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const configStatus = emailService.getConfigStatus();

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Test Email Service</h2>
      
      {/* Configuration Status */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">EmailJS Configuration:</h3>
        <div className="text-sm space-y-1">
          <div className={`flex items-center ${configStatus.serviceId ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-2">{configStatus.serviceId ? '✅' : '❌'}</span>
            Service ID: {configStatus.serviceId ? 'Configured' : 'Missing'}
          </div>
          <div className={`flex items-center ${configStatus.publicKey ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-2">{configStatus.publicKey ? '✅' : '❌'}</span>
            Public Key: {configStatus.publicKey ? 'Configured' : 'Missing'}
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-300">
            <div className="font-medium mb-1">Email Templates:</div>
            <div className={`flex items-center ${configStatus.templates.verification ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-2">{configStatus.templates.verification ? '✅' : '❌'}</span>
              Verification OTP: {configStatus.templates.verification ? 'Configured' : 'Missing'}
            </div>
            <div className={`flex items-center ${configStatus.templates.passwordReset ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-2">{configStatus.templates.passwordReset ? '✅' : '❌'}</span>
              Password Reset: {configStatus.templates.passwordReset ? 'Configured' : 'Missing'}
            </div>
          </div>
          
          <div className={`flex items-center ${configStatus.ready ? 'text-green-600' : 'text-red-600'} mt-2 pt-2 border-t border-gray-300`}>
            <span className="mr-2">{configStatus.ready ? '✅' : '❌'}</span>
            Overall Status: {configStatus.ready ? 'Ready' : 'Not Ready'}
          </div>
        </div>
      </div>

      {/* Test Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Test Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address to test"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleTestEmail}
          disabled={loading || !configStatus.ready}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Send Test Verification OTP'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`mt-4 p-3 rounded-md ${
          result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className="font-semibold">
            {result.success ? '✅ Success!' : '❌ Error'}
          </div>
          <div className="text-sm mt-1">{result.message}</div>
          {result.error && (
            <div className="text-sm mt-1 font-mono bg-gray-200 p-2 rounded">
              {result.error}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-sm text-gray-600">
        <h4 className="font-semibold mb-2">Setup Instructions:</h4>
        <ol className="list-decimal list-inside space-y-1">
          <li>Create EmailJS account at emailjs.com</li>
          <li>Add Gmail service and get Service ID</li>
          <li>Create 2 email templates: verification_otp and password_reset_otp</li>
          <li>Get Public Key from account settings</li>
          <li>Add environment variables to .env.local</li>
        </ol>
      </div>
    </div>
  );
};

export default TestEmail;
