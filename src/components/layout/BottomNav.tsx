"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Menu,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomTab {
  label: string;
  icon: LucideIcon;
  path: string;
  isAction?: boolean;
}

const tabs: BottomTab[] = [
  { label: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Book", icon: Calendar, path: "/appointments" },
  { label: "Clients", icon: Users, path: "/clients" },
  { label: "Finance", icon: DollarSign, path: "/finance/billing" },
  { label: "More", icon: Menu, path: "/more", isAction: true },
];

interface BottomNavProps {
  onMoreClick?: () => void;
}

export default function BottomNav({ onMoreClick }: BottomNavProps) {
  const pathname = usePathname();

  function isTabActive(tab: BottomTab): boolean {
    if (tab.isAction) return false;
    if (tab.path === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname === tab.path || pathname.startsWith(tab.path + "/");
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(tab);

          if (tab.isAction) {
            return (
              <button
                key={tab.label}
                onClick={onMoreClick}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-stone-500 hover:text-stone-700 transition-colors duration-150"
                aria-label="More options"
              >
                <Icon size={22} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 relative transition-colors duration-150",
                active ? "text-[#D97706]" : "text-stone-500 hover:text-stone-700"
              )}
            >
              {/* Active indicator dot above icon */}
              {active && (
                <span className="absolute top-1.5 w-1.5 h-1.5 bg-[#D97706] rounded-full" />
              )}
              <Icon size={22} />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-[#D97706]" : ""
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for devices with home indicator */}
      <div className="h-safe-area-bottom bg-white" />
    </nav>
  );
}
