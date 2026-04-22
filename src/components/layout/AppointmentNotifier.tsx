"use client";

import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { useNotificationStore } from "@/store/useNotificationStore";

const POLL_INTERVAL = 60_000; // every 60 seconds
const ALERT_WINDOW_MINUTES = 30;

export default function AppointmentNotifier() {
  const { notifiedIds, markNotified, setUpcoming } = useNotificationStore();
  const notifiedRef = useRef<string[]>(notifiedIds);

  // Keep ref in sync with store (avoids stale closure in interval)
  useEffect(() => {
    notifiedRef.current = notifiedIds;
  }, [notifiedIds]);

  const poll = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/appointments?date=${today}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const now = Date.now();
      const upcoming = data
        .filter((a: any) => {
          if (!a.startTimeISO) return false;
          if (a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW") return false;
          const startMs = new Date(a.startTimeISO).getTime();
          const mins = (startMs - now) / 60_000;
          return mins > 0 && mins <= ALERT_WINDOW_MINUTES;
        })
        .map((a: any) => ({
          id: a.id,
          clientName: a.clientName,
          serviceName: a.serviceName,
          staffName: a.staffName,
          time: a.time,
          startTimeISO: a.startTimeISO,
          minutesUntil: Math.round((new Date(a.startTimeISO).getTime() - now) / 60_000),
        }));

      setUpcoming(upcoming);

      // Fire toast for each new upcoming appointment
      upcoming.forEach((appt: any) => {
        if (!notifiedRef.current.includes(appt.id)) {
          markNotified(appt.id);
          toast.custom(
            (t) => (
              <div
                className={`flex items-start gap-3 bg-white border border-amber-300 shadow-xl rounded-2xl px-4 py-3 max-w-sm w-full transition-all ${
                  t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                }`}
              >
                <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-lg">
                  ⏰
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Upcoming in {appt.minutesUntil} min
                  </p>
                  <p className="text-sm font-bold text-[#1C1917] mt-0.5 truncate">
                    {appt.clientName}
                  </p>
                  <p className="text-xs text-[#78716C] truncate">
                    {appt.serviceName}{appt.staffName ? ` · ${appt.staffName}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-stone-400 hover:text-stone-600 mt-0.5 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ),
            { duration: 8000, position: "top-right" }
          );
        }
      });
    } catch {
      // silent — notifier should never break the app
    }
  }, [markNotified, setUpcoming]);

  useEffect(() => {
    poll(); // run immediately on mount
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [poll]);

  return null; // no UI — just runs in background
}
