"use client";
import { create } from "zustand";

export interface UpcomingAppt {
  id: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  time: string;
  startTimeISO: string;
  minutesUntil: number;
}

interface NotificationState {
  upcoming: UpcomingAppt[];
  notifiedIds: string[];
  setUpcoming: (upcoming: UpcomingAppt[]) => void;
  markNotified: (id: string) => void;
  resetDay: () => void;
}

// ── localStorage helpers ──────────────────────────────────────────────────
const STORAGE_KEY = "ssp_notified_ids";
const TODAY_KEY = "ssp_notified_date";

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function loadNotifiedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const savedDate = localStorage.getItem(TODAY_KEY);
    const today = getTodayStr();
    // If stored date is not today, wipe it (new day = fresh notifications)
    if (savedDate !== today) {
      localStorage.setItem(TODAY_KEY, today);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveNotifiedIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    localStorage.setItem(TODAY_KEY, getTodayStr());
  } catch {}
}

// ── Store ─────────────────────────────────────────────────────────────────
export const useNotificationStore = create<NotificationState>((set, get) => ({
  upcoming: [],
  notifiedIds: loadNotifiedIds(),

  setUpcoming: (upcoming) => set({ upcoming }),

  markNotified: (id) => {
    const current = get().notifiedIds;
    if (current.includes(id)) return;
    const updated = [...current, id];
    saveNotifiedIds(updated);
    set({ notifiedIds: updated });
  },

  resetDay: () => {
    saveNotifiedIds([]);
    set({ upcoming: [], notifiedIds: [] });
  },
}));
