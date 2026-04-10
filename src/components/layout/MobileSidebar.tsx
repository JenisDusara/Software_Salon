"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Receipt,
  FileText,
  TrendingDown,
  BarChart3,
  DollarSign,
  Calendar,
  Users,
  UserCheck,
  Scissors,
  Package,
  Megaphone,
  PieChart,
  Settings,
  X,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "FINANCE",
    items: [
      { path: "/finance/billing", icon: Receipt, label: "Billing & POS" },
      { path: "/finance/invoices", icon: FileText, label: "Invoices" },
      { path: "/finance/expenses", icon: TrendingDown, label: "Expenses" },
      { path: "/finance/profit-loss", icon: BarChart3, label: "Profit & Loss" },
      { path: "/finance/cash-flow", icon: DollarSign, label: "Cash Flow" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { path: "/appointments", icon: Calendar, label: "Appointments" },
      { path: "/clients", icon: Users, label: "Clients" },
      { path: "/staff", icon: UserCheck, label: "Staff" },
      { path: "/services", icon: Scissors, label: "Services" },
      { path: "/inventory", icon: Package, label: "Inventory" },
    ],
  },
  {
    title: "GROWTH",
    items: [
      { path: "/marketing", icon: Megaphone, label: "Marketing" },
      { path: "/reports", icon: PieChart, label: "Reports" },
    ],
  },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { currentBranchName, user } = useAppStore();

  const userName = user?.name ?? "Admin User";
  const userRole = user?.role ?? "Manager";
  const initials = getInitials(userName);

  // Close on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] flex flex-col bg-[#1C1917] transition-transform duration-200 ease-in-out shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-[#D97706] rounded-lg shrink-0">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-stone-100 font-semibold text-sm leading-tight">
                SalonSoft Pro
              </span>
              <span className="text-stone-500 text-xs leading-tight">
                Management Suite
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors duration-150"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className="px-6 mb-1.5 text-[10px] font-semibold tracking-widest text-stone-500 uppercase">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.path ||
                    (pathname?.startsWith(item.path + "/") ?? false);
                  return (
                    <Link key={item.path} href={item.path} className="block relative">
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#D97706] rounded-r-full" />
                      )}
                      <div
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors duration-150",
                          isActive
                            ? "bg-[#D97706]/10 text-[#D97706]"
                            : "text-stone-400 hover:bg-[#292524] hover:text-stone-100"
                        )}
                      >
                        <Icon
                          size={18}
                          className={cn("shrink-0", isActive ? "text-[#D97706]" : "")}
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Settings */}
          <div className="mt-2">
            <div className="mx-3 border-t border-stone-800 mb-3" />
            {(() => {
              const isActive =
                pathname === "/settings" ||
                (pathname?.startsWith("/settings/") ?? false);
              return (
                <Link href="/settings" className="block relative">
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#D97706] rounded-r-full" />
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors duration-150",
                      isActive
                        ? "bg-[#D97706]/10 text-[#D97706]"
                        : "text-stone-400 hover:bg-[#292524] hover:text-stone-100"
                    )}
                  >
                    <Settings
                      size={18}
                      className={cn("shrink-0", isActive ? "text-[#D97706]" : "")}
                    />
                    <span className="text-sm font-medium">Settings</span>
                  </div>
                </Link>
              );
            })()}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-stone-800">
          {/* Location selector */}
          <button className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-[#292524] transition-colors duration-150 border-b border-stone-800">
            <div className="flex items-center justify-center w-6 h-6 bg-stone-700 rounded shrink-0">
              <span className="text-[#D97706] text-xs font-bold">
                {currentBranchName.charAt(0)}
              </span>
            </div>
            <span className="flex-1 text-left text-sm text-stone-300 truncate">
              {currentBranchName}
            </span>
            <ChevronDown size={14} className="text-stone-500 shrink-0" />
          </button>

          {/* User section */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#D97706] shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-stone-200 text-sm font-medium truncate">
                {userName}
              </span>
              <span className="text-stone-500 text-xs truncate">{userRole}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
