"use client";

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
  ChevronLeft,
  ChevronRight,
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

interface NavItemRowProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}

function NavItemRow({ item, isActive, collapsed }: NavItemRowProps) {
  const Icon = item.icon;

  return (
    <Link href={item.path} className="block relative group">
      {/* Active left border indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#D97706] rounded-r-full" />
      )}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors duration-150 cursor-pointer",
          isActive
            ? "bg-[#D97706]/10 text-[#D97706]"
            : "text-stone-400 hover:bg-[#292524] hover:text-stone-100",
          collapsed && "justify-center px-0 mx-2"
        )}
      >
        <Icon
          size={18}
          className={cn("shrink-0", isActive ? "text-[#D97706]" : "")}
        />
        {!collapsed && (
          <span className="text-sm font-medium truncate">{item.label}</span>
        )}
      </div>
      {/* Tooltip when collapsed */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-stone-800 text-stone-100 text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
          {item.label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-800" />
        </div>
      )}
    </Link>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentBranchName, user } =
    useAppStore();
  const pathname = usePathname();

  const userName = user?.name ?? "Admin User";
  const userRole = user?.role ?? "Manager";
  const initials = getInitials(userName);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-[#1C1917] border-r border-stone-800 relative transition-all duration-200 ease-in-out shrink-0",
        sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-6 z-10 flex items-center justify-center w-7 h-7 bg-[#1C1917] border border-stone-700 rounded-full text-stone-400 hover:text-stone-100 hover:border-stone-500 transition-colors duration-150 shadow-md"
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={14} />
        ) : (
          <ChevronLeft size={14} />
        )}
      </button>

      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-stone-800 shrink-0",
          sidebarCollapsed && "justify-center px-0"
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 bg-[#D97706] rounded-lg shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-stone-100 font-semibold text-sm leading-tight truncate">
              SalonSoft Pro
            </span>
            <span className="text-stone-500 text-xs leading-tight">
              Management Suite
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-stone-700">
        {navSections.map((section) => (
          <div key={section.title} className="mb-4">
            {/* Section header */}
            {!sidebarCollapsed && (
              <p className="px-6 mb-1.5 text-[10px] font-semibold tracking-widest text-stone-500 uppercase">
                {section.title}
              </p>
            )}
            {sidebarCollapsed && (
              <div className="mx-3 my-1.5 border-t border-stone-800" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItemRow
                  key={item.path}
                  item={item}
                  isActive={pathname === item.path || pathname.startsWith(item.path + "/")}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Settings */}
        <div className="mt-2">
          {!sidebarCollapsed && (
            <div className="mx-3 border-t border-stone-800 mb-3" />
          )}
          <NavItemRow
            item={{ path: "/settings", icon: Settings, label: "Settings" }}
            isActive={pathname === "/settings" || pathname.startsWith("/settings/")}
            collapsed={sidebarCollapsed}
          />
        </div>
      </nav>

      {/* Bottom section */}
      <div className="shrink-0 border-t border-stone-800">
        {/* Location selector */}
        <button
          className={cn(
            "w-full flex items-center gap-2.5 px-4 py-3 hover:bg-[#292524] transition-colors duration-150 border-b border-stone-800",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <div className="flex items-center justify-center w-6 h-6 bg-stone-700 rounded shrink-0">
            <span className="text-[#D97706] text-xs font-bold">
              {currentBranchName.charAt(0)}
            </span>
          </div>
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 text-left text-sm text-stone-300 truncate">
                {currentBranchName}
              </span>
              <ChevronDown size={14} className="text-stone-500 shrink-0" />
            </>
          )}
        </button>

        {/* User section */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#D97706] shrink-0">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-stone-200 text-sm font-medium truncate">
                {userName}
              </span>
              <span className="text-stone-500 text-xs truncate">{userRole}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
