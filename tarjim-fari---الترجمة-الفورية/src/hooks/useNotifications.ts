import { useEffect, useState } from "react";

export interface FavoriteItem {
  id: string;
  timestamp: number;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export const useNotifications = (
  enabled: boolean,
  notificationTime: string = "09:00",
) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );

  useEffect(() => {
    if (!enabled) return;

    const requestPermission = async () => {
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "default"
      ) {
        const perm = await Notification.requestPermission();
        setPermission(perm);
      }
    };

    requestPermission();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || permission !== "granted") return;

    const checkAndSendNotification = () => {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, "0");
      const currentMinute = now.getMinutes().toString().padStart(2, "0");
      const currentTimeStr = `${currentHour}:${currentMinute}`;

      const lastSentStr = localStorage.getItem("tarjim_last_notification");
      const lastSent = lastSentStr ? parseInt(lastSentStr, 10) : 0;

      const ONE_DAY = 24 * 60 * 60 * 1000;
      const timeSinceLast = Date.now() - lastSent;

      // If the current time matches the scheduled time, AND we haven't sent one in the last 23 hours
      if (
        currentTimeStr === notificationTime &&
        timeSinceLast > ONE_DAY - 60 * 60 * 1000
      ) {
        sendDailyNotification();
      }
    };

    const sendDailyNotification = () => {
      try {
        const storedFavorites = localStorage.getItem("tarjim_favorites");
        const favorites: FavoriteItem[] = storedFavorites
          ? JSON.parse(storedFavorites)
          : [];

        let title = "ترجم | كلمة اليوم";
        let body = "اكتشف كلمات جديدة وتعرف على لغات مختلفة كل يوم!";

        if (favorites.length > 0) {
          // Get a random favorite
          const randomFav =
            favorites[Math.floor(Math.random() * favorites.length)];
          title = "ترجم | مراجعة سريعة للحفظ";
          body = `هل تتذكر هذه الترجمة؟\n${randomFav.sourceText}\nالترجمة: ${randomFav.translatedText}`;
        } else {
          // Word of the day fallback
          const wordsOfTheDay = [
            { en: "Serendipity", ar: "صدفة حسنة" },
            { en: "Resilience", ar: "المرونة / القدرة على التعافي" },
            { en: "Empathy", ar: "التعاطف الوجداني" },
            { en: "Perseverance", ar: "المثابرة / الإصرار" },
            { en: "Innovation", ar: "الابتكار" },
          ];
          const randomWord =
            wordsOfTheDay[Math.floor(Math.random() * wordsOfTheDay.length)];
          title = "ترجم | كلمة اليوم";
          body = `الكلمة: ${randomWord.en}\nالترجمة: ${randomWord.ar}`;
        }

        const notification = new Notification(title, {
          body,
          icon: "/favicon.ico", // Or whatever icon we have
        });

        localStorage.setItem("tarjim_last_notification", Date.now().toString());

        // Auto close after 10 seconds
        setTimeout(() => notification.close(), 10000);
      } catch (err) {
        console.error("Failed to send notification", err);
      }
    };

    // Check immediately on load
    checkAndSendNotification();

    // Check every minute to see if time matches
    const interval = setInterval(checkAndSendNotification, 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, permission, notificationTime]);

  // Expose a way to test notification directly for better UX
  const sendTestNotification = () => {
    if (permission === "granted") {
      new Notification("ترجم | إشعار تجريبي", {
        body: "تعمل الإشعارات بنجاح. ستتلقى تنبيهات يومية للمراجعة.",
      });
    } else if (typeof Notification !== "undefined") {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
        if (perm === "granted") {
          new Notification("ترجم | إشعار تجريبي", {
            body: "تعمل الإشعارات بنجاح. ستتلقى تنبيهات يومية للمراجعة.",
          });
        }
      });
    }
  };

  return { permission, setPermission, sendTestNotification };
};
