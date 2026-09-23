/**
 * Browser & In-App Notification Service for Saampark CRM
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "default") {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return "denied";
    }
  }

  return Notification.permission;
}

export function sendBrowserNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    url?: string;
    onClick?: () => void;
  }
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body: options?.body || "",
        icon: options?.icon || "/icon.png",
        tag: options?.tag || `saampark_${Date.now()}`,
      });

      notification.onclick = () => {
        window.focus();
        if (options?.url) {
          window.location.href = options.url;
        }
        if (options?.onClick) {
          options.onClick();
        }
        notification.close();
      };
    } catch (err) {
      console.warn("Browser notification trigger failed:", err);
    }
  }
}
