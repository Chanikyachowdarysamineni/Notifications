const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const User = require('../models/User');

// Initialize Firebase Admin (mocked safely if credentials are missing)
try {
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    serviceAccount = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      // Render stringifies newlines as literal \n, so we must replace them
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }



  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    console.warn('Firebase service account not configured. Push notifications will be mocked.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

const sendPush = async (deviceTokens, title, body, data = {}) => {
  if (!deviceTokens || deviceTokens.length === 0) return { success: true, count: 0, failedTokens: [] };

  if (!getApps().length) {
    // Mocked success if not configured
    console.log(`[MOCK PUSH] To: ${deviceTokens.length} devices | Title: ${title}`);
    return { success: true, count: deviceTokens.length, failedTokens: [] };
  }

  const message = {
    notification: { title, body },
    data,
    android: {
      notification: {
        sound: 'default',
        channelId: 'cse_hub_default'
      },
      priority: 'high'
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    webpush: {
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        requireInteraction: false
      },
      fcmOptions: {
        link: data?.url || data?.route || '/'
      }
    },
    tokens: deviceTokens,
  };

  try {
    const response = await getMessaging().sendMulticast(message);
    const failedTokens = [];
    
    // Check for invalid tokens to clean up
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(deviceTokens[idx]);
          }
        }
      });

      // Background cleanup of dead tokens
      if (failedTokens.length > 0) {
        User.updateMany(
          { device_tokens: { $in: failedTokens } },
          { $pull: { device_tokens: { $in: failedTokens } } }
        ).catch(err => console.error('Failed to clean up dead device tokens:', err));
      }
    }

    return { 
      success: true, 
      count: response.successCount, 
      failureCount: response.failureCount,
      failedTokens 
    };
  } catch (error) {
    console.error('Push notification failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPush };
