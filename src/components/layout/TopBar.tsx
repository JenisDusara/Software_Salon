"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/finance/billing": "Billing & POS",
  "/finance/invoices": "Invoices",
  "/finance/expenses": "Expenses",
  "/finance/profit-loss": "Profit & Loss",
  "/finance/cash-flow": "Cash Flow",
  "/appointments": "Appointments",
  "/clients": "Clients",
  "/staff": "Staff",
  "/services": "Services",
  "/inventory": "Inventory",
  "/marketing": "Marketing",
  "/reports": "Reports",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (routeTitles[pathname]) return routeTitles[pathname];
  // Prefix match for nested routes
  const match = Object.keys(routeTitles)
    .filter((key) => pathname.startsWith(key + "/"))
    .sort((a, b) => b.length - a.length)[0];
  return match ? routeTitles[match] : "SalonSoft Pro";
}

interface TopBarProps {
  onMenuClick: () => void;
  title?: string;
}

export default function TopBar({ onMenuClick, title }: TopBarProps) {
  const pathname = usePathname();
  const { user } = useAppStore();

  const pageTitle = title ?? getPageTitle(pathname);
  const userName = user?.name ?? "Admin User";
  const initials = getInitials(userName);

  return (
    <header
      className={cn(
        "lg:hidden flex items-center h-16 bg-white border-b border-stone-200 px-4 shrink-0 z-20"
      )}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors duration-150"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {/* Page title */}
      <h1 className="flex-1 text-center text-base font-semibold text-stone-800 truncate px-3">
        {pageTitle}
      </h1>

      {/* Right: Bell + Avatar + Logout */}
      <div className="flex items-center gap-1">
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors duration-150"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D97706] rounded-full ring-2 ring-white" />
        </button>
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#D97706]">
          <span className="text-white text-xs font-semibold">{initials}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-stone-500 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
