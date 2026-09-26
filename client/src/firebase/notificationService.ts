import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./messaging";

const VAPID_KEY = "BBQYTnj9C3kC5lliJfpeUMg2CkzZ6DsCWkOJoxs8lpdJVsVsq3ms-jrS-g_wAhugpkarYeTvRkSWkN74F_ATrTU";

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (currentToken) {
      console.log('Firebase registration token:', currentToken);
      // TODO: Send this token to your backend to associate it with the user
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received: ", payload);
      resolve(payload);
    });
  });
};
