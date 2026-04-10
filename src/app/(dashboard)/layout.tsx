"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { useAppStore } from "@/store/useAppStore";
import { ShieldCheck, LogOut } from "lucide-react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [impersonatedBusiness, setImpersonatedBusiness] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const setBranches = useAppStore((s) => s.setBranches);
  const setCurrentBranch = useAppStore((s) => s.setCurrentBranch);
  const currentBranchId = useAppStore((s) => s.currentBranchId);

  useEffect(() => {
    // Check if super admin is impersonating
    const business = getCookie("sa_business");
    setImpersonatedBusiness(business);
  }, []);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data);
          if (!currentBranchId) {
            setCurrentBranch(data[0].id, data[0].name);
          }
        }
      })
      .catch(() => {});
  }, [setBranches, setCurrentBranch, currentBranchId]);

  async function exitImpersonation() {
    setExiting(true);
    try {
      await fetch("/api/super-admin/switch-tenant", { method: "DELETE" });
      router.push("/super-admin");
    } catch {
      setExiting(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF9]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Super Admin impersonation banner */}
        {impersonatedBusiness && (
          <div className="bg-[#1C1917] text-white px-4 py-2 flex items-center justify-between text-sm shrink-0 z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D97706]" />
              <span className="text-stone-300">Super Admin View —</span>
              <span className="font-semibold text-white">{impersonatedBusiness}</span>
            </div>
            <button
              onClick={exitImpersonation}
              disabled={exiting}
              className="flex items-center gap-1.5 px-3 py-1 bg-stone-700 hover:bg-stone-600 rounded-lg transition text-xs font-medium disabled:opacity-60"
            >
              <LogOut className="w-3 h-3" />
              {exiting ? "Exiting..." : "Exit Admin View"}
            </button>
          </div>
        )}

        {/* Mobile top bar */}
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav onMoreClick={() => setMobileMenuOpen(true)} />

      {/* Mobile drawer sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
}
