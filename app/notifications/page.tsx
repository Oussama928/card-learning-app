"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import classNames from "classnames";
import { FaTrash } from "react-icons/fa";
import { io, Socket } from "socket.io-client";
import type { NotificationItemDTO } from "@/types";
import { deleteNotification, getBigNotifications } from "@/services/notificationService";

const base64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const NotificationsPage = () => {
  const { data: session, status } = useSession();
  const [notifs, setNotifs] = useState<NotificationItemDTO[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const subscribeToPush = async () => {
      if (!session?.user?.accessToken) return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) return;

      const registration = await navigator.serviceWorker.register("/push-sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(vapidPublicKey),
        }));

      await fetch("/api/notifications/push-subscription", {
        method: "POST",
        headers: {
          authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });
    };

    void subscribeToPush();
  }, [session?.user?.accessToken]);

  useEffect(() => {
    if (session?.user?.accessToken) {
      const token = session.user.accessToken;
      // Initial fetch
      const retrieveNotifications = async () => {
        try {
          const data = await getBigNotifications(token);
          setNotifs(data.notifs || []);
        } catch (error) {
          console.error("Error:", error);
        }
      };
      
      retrieveNotifications();

      // WebSocket connection for real-time updates
      const newSocket = io({
        path: '/api/socket',
        auth: {
          token,
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification socket');
      });

      newSocket.on('notification', (notification: NotificationItemDTO) => {
        setNotifs((prev) => [notification, ...prev]);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [session?.user?.accessToken]);
  

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Please sign in to view notifications
      </div>
    );
  }
  const handleDelete = async (id: string) => {
    try {
      if (!session?.user?.accessToken) return;
      await deleteNotification(id, session.user.accessToken);
      setNotifs((prevNotifs) => prevNotifs.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error:", error);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-800">
              Notifications
            </h1>
          </div>

          {notifs.length === 0 ? (
            <div className="p-6 text-gray-500 text-center">
              No new notifications
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifs.map((item, index) => (
                <div
                  key={index}
                  className={classNames(
                    "flex justify-between w-full text-left px-6 py-4 transition-colors duration-200",
                    "hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600">
                          {item.type === "reminder"
                            ? "⏰"
                            : item.type === "feature"
                              ? "✨"
                              : item.type === "system"
                                ? "⚙️"
                                : item.type === "streak"
                                  ? "🔥"
                                  : "🔔"}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {item.type}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.content}
                      </p>
                      <div className="mt-2 text-xs text-gray-400">
                        {item.created_at}
                      </div>
                    </div>
                  </div>
                  <div>
                    <button onClick={()=>handleDelete(item.id)} className="hover:bg-slate-300 rounded-full p-1">
                      <FaTrash className="text-slate-700" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
