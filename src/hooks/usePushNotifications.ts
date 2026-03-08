import { useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export const usePushNotifications = () => {
  const { user } = useAuth();

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  // Request notification permission when user logs in
  useEffect(() => {
    if (user) {
      requestPermission();
    }
  }, [user, requestPermission]);

  const showCallNotification = useCallback(
    (callerName: string, serviceName: string, callId: string) => {
      if (Notification.permission !== "granted") return;

      // Only show system notification when page is hidden (background tab / minimized)
      if (document.visibilityState === "hidden") {
        const notification = new Notification(`📞 ${callerName} কল করছেন`, {
          body: `${serviceName} - Accept করতে ক্লিক করুন`,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: `call-${callId}`,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
        } as NotificationOptions);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      }
      return null;
    },
    []
  );

  const vibrate = useCallback((pattern: number[] = [200, 100, 200, 100, 200]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const stopVibration = useCallback(() => {
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  }, []);

  return { requestPermission, showCallNotification, vibrate, stopVibration };
};
