"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Calendar } from "lucide-react";
import Link from "next/link";
import { useNotificationStore } from "@/store/useNotificationStore";

export default function NotificationBell({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { upcoming } = useNotificationStore();
  const count = upcoming.length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-150 ${
          dark
            ? "text-stone-400 hover:text-stone-100 hover:bg-stone-800"
            : "text-stone-600 hover:bg-stone-100"
        }`}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-[#E7E5E4] shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E7E5E4] flex items-center justify-between">
            <p className="text-sm font-semibold text-[#1C1917]">Upcoming Appointments</p>
            {count > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                {count} in next 30 min
              </span>
            )}
          </div>

          {count === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mb-2">
                <Calendar className="w-5 h-5 text-stone-400" />
              </div>
              <p className="text-sm text-[#78716C]">No appointments in the next 30 minutes</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-[#F5F5F4]">
              {upcoming.map((appt) => (
                <Link
                  key={appt.id}
                  href="/appointments"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[#FAFAF9] transition-colors"
                >
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-sm">⏰</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#1C1917] truncate">{appt.clientName}</p>
                      <span className="text-xs text-amber-600 font-bold whitespace-nowrap">{appt.minutesUntil}m</span>
                    </div>
                    <p className="text-xs text-[#78716C] truncate">
                      {appt.serviceName}
                      {appt.staffName ? ` · ${appt.staffName}` : ""}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">{appt.time}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-[#E7E5E4]">
            <Link
              href="/appointments"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
            >
              View all appointments →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
