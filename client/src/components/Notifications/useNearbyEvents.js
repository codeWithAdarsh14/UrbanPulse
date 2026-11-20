import { useEffect } from 'react';

/**
 * useNearbyEvents Hook — Proximity Event Listener
 * Monitors /api/events for community townhalls and gatherings near the citizen's
 * configured locality and postal pincode, dispatching notifications automatically.
 */
export default function useNearbyEvents(user, addToast) {
  useEffect(() => {
    // If citizen disabled nearby event alerts in settings, skip
    if (!user || user?.preferences?.alertNearbyEvents === false) return;

    let isMounted = true;

    async function checkNearbyEvents() {
      try {
        const res = await fetch('/api/events?limit=5');
        if (!res.ok) return;
        const json = await res.json();
        const events = json.data || [];

        if (isMounted && events.length > 0) {
          const latestEvent = events[0];
          const sessionNotifiedKey = `up_event_notified_${latestEvent._id || latestEvent.title}`;

          // Only alert once per session for a specific event
          if (!sessionStorage.getItem(sessionNotifiedKey)) {
            sessionStorage.setItem(sessionNotifiedKey, 'true');
            const pinStr = user?.pincode ? ` (${user.pincode})` : '';
            if (addToast) {
              addToast(
                `🎉 New Community Event Near You${pinStr}: "${latestEvent.title}" at ${latestEvent.venue || 'Mathura'}!`,
                'info'
              );
            }
          }
        }
      } catch (err) {
        console.warn('Failed to check nearby community events:', err);
      }
    }

    checkNearbyEvents();

    return () => {
      isMounted = false;
    };
  }, [user, addToast]);
}
