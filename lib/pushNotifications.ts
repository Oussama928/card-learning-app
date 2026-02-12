import webpush from "web-push";

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:support@card-learning.app";

let initialized = false;

export function initializePushNotifications() {
  if (initialized) return;
  if (!publicKey || !privateKey) return;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  initialized = true;
}

export async function sendPushNotification(
  subscription: PushSubscriptionPayload,
  payload: Record<string, unknown>
) {
  initializePushNotifications();
  if (!publicKey || !privateKey) return;

  await webpush.sendNotification(subscription as webpush.PushSubscription, JSON.stringify(payload));
}
