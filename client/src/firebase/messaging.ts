import { getMessaging } from "firebase/messaging";
import { app } from "./firebaseConfig";

export const messaging = getMessaging(app);
