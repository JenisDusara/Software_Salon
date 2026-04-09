"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { useAppStore } from "@/store/useAppStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const setBranches = useAppStore((s) => s.setBranches);
  const setCurrentBranch = useAppStore((s) => s.setCurrentBranch);
  const currentBranchId = useAppStore((s) => s.currentBranchId);

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

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF9]">
      {/* Desktop sidebar — hidden on mobile, visible on lg+ */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar — visible on mobile only */}
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
