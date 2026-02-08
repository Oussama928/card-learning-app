"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import classNames from "classnames";
import DeleteIcon from "@mui/icons-material/Delete";

interface Notification {
  type: string;
  content: string;
}

const NotificationsPage = () => {
  const { data: session, status } = useSession();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (session) {
      const retrieveNotifications = async () => {
        try {
          const response = await fetch("/api/notifications/getBig", {
            method: "GET",
            headers: {
              authorization: `Bearer ${session.user.accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setNotifs(data.notifs);
          } else {
            console.error("Failed to retrieve notifications");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      };
      
      retrieveNotifications();
      console.log("here comes : ",notifs);
    }
  }, [session, status]);
  

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
        console.log(id);
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${session.user.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifs((prevNotifs) => prevNotifs.filter((item) => item.id !== id));      } else {
        console.error("Failed to delete notification");
      }
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
                      <DeleteIcon className=" " color="primary" />
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
