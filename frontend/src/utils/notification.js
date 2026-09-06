export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
};

export const showDesktopNotification = ({ title, body, icon }) => {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
        silent: false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.error("Error creating desktop notification:", err);
    }
  }
};
