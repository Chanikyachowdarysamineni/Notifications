import React, { useState } from 'react';
import { requestForToken } from '../firebase/notificationService';
import api from '../lib/axios';

export default function NotificationPermission() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);

  const handleRequestPermission = async () => {
    try {
      const currentToken = await requestForToken();
      if (currentToken) {
        setToken(currentToken);
        
        // Send to backend
        try {
          await api.post('/users/fcm-token', { token: currentToken });
          console.log('FCM token registered with backend');
        } catch (e) {
          console.error('Failed to register FCM token with backend', e);
        }
      }
    } catch (err) {
      setError('Failed to get permission.');
    }
  };

  if (token) {
    return null; // Hide the prompt if we already have the token
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md my-4">
      <h3 className="font-semibold text-blue-800">Enable Notifications</h3>
      <p className="text-sm text-blue-600 mb-3">Get notified about important updates instantly.</p>
      <button 
        onClick={handleRequestPermission}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md text-sm hover:bg-blue-700 transition"
      >
        Allow Notifications
      </button>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
