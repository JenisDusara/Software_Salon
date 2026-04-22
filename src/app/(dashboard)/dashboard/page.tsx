"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  DollarSign, Calendar, Clock, Users, TrendingUp, Receipt,
  Plus, ArrowRight, Play, CheckCircle2, UserX, Loader2,
  BarChart3, Package, Megaphone, RefreshCw,
} from "lucide-react";
import { formatINR, formatDate, getInitials, getAvatarColor } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────
type DashStats = {
  totalClients: number; newClientsThisMonth: number; monthRevenue: number;
  outstandingAmount: number; staffCount: number;
  todayAppointmentsCount: number; todayCompleted: number; todayRevenue: number;
};
type TodayAppt = {
  id: string; clientName: string; serviceName: string; staffName: string;
  time: string; startTimeISO: string; duration: number; status: string; amount: number;
};
type RecentInv = {
  id: string; invoiceNumber: string; clientName: string; clientPhone: string;
  items: { description: string }[]; totalAmount: number; status: string;
};
type MonthlyPoint = { month: string; revenue: number; expenses: number; profit: number };
type PaymentBreakdown = { cash: number; upi: number; card: number; split: number; other: number; totalInflows: number };
type TopService = { name: string; revenue: number };

type ApptStatus = "CONFIRMED" | "COMPLETED" | "IN_PROGRESS" | "PENDING" | "CANCELLED" | "NO_SHOW";
type InvoiceStatus = "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";

const PIE_COLORS: Record<string, string> = {
  Cash: "#D97706", UPI: "#2563EB", Card: "#059669", Split: "#7C3AED", Other: "#78716C",
};

const STATUS_LABEL: Record<ApptStatus, string> = {
  CONFIRMED: "Confirmed", COMPLETED: "Completed", IN_PROGRESS: "In Progress",
  PENDING: "Pending", CANCELLED: "Cancelled", NO_SHOW: "No Show",
};

const STATUS_COLOR: Record<ApptStatus, string> = {
  CONFIRMED: "bg-amber-100 text-amber-700 border border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border border-blue-200",
  PENDING: "bg-stone-100 text-stone-600 border border-stone-200",
  CANCELLED: "bg-red-100 text-red-600 border border-red-200",
  NO_SHOW: "bg-rose-100 text-rose-600 border border-rose-200",
};

// ── Greeting ──────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({ icon, iconBg, value, label, sub, trend, valueColor = "text-[#1C1917]" }: {
  icon: React.ReactNode; iconBg: string; value: string; label: string;
  sub?: React.ReactNode; trend?: React.ReactNode; valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
        {trend}
      </div>
      <div>
        <p className={`text-2xl font-bold font-heading ${valueColor}`}>{value}</p>
        <p className="text-sm text-[#78716C] mt-0.5">{label}</p>
        {sub && <p className="text-xs text-[#78716C] mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, string> = {
    PAID: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    OVERDUE: "bg-red-100 text-red-700",
    PARTIAL: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.name === "Revenue")?.value ?? 0;
  const expenses = payload.find((p) => p.name === "Expenses")?.value ?? 0;
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-[#1C1917] mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#78716C]"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Revenue</span>
          <span className="font-medium text-[#1C1917]">{formatINR(revenue)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#78716C]"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Expenses</span>
          <span className="font-medium text-[#1C1917]">{formatINR(expenses)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-[#E7E5E4] pt-1 mt-1">
          <span className="text-[#78716C]">Net</span>
          <span className={`font-semibold ${revenue - expenses >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatINR(revenue - expenses)}</span>
        </div>
      </div>
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-lg shadow-md p-2.5 text-sm">
      <p className="font-medium text-[#1C1917]">{payload[0].name}</p>
      <p className="text-[#78716C]">{formatINR(payload[0].value)}</p>
    </div>
  );
}

// ── Appointment Card ────────────────────────────────────────────────────────
function ApptCard({
  appt, onStatusChange, updating,
}: {
  appt: TodayAppt;
  onStatusChange: (id: string, status: ApptStatus) => void;
  updating: string | null;
}) {
  const status = appt.status as ApptStatus;
  const isUpdating = updating === appt.id;

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#E7E5E4] hover:border-[#D97706]/40 hover:bg-amber-50/30 transition-all group">
      {/* Time */}
      <div className="w-14 shrink-0 text-center pt-0.5">
        <p className="text-xs font-bold text-[#D97706] leading-tight">{appt.time.split(" ")[0]}</p>
        <p className="text-[10px] text-[#78716C]">{appt.time.split(" ")[1] ?? ""}</p>
        <p className="text-[10px] text-[#78716C] mt-0.5">{appt.duration}m</p>
      </div>

      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full ${getAvatarColor(appt.clientName)} flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5`}>
        {getInitials(appt.clientName)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[#1C1917] truncate">{appt.clientName}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
        <p className="text-xs text-[#78716C] truncate mt-0.5">{appt.serviceName}</p>
        {appt.staffName && (
          <p className="text-xs text-stone-400 mt-0.5">with {appt.staffName}</p>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {isUpdating ? (
            <span className="flex items-center gap-1 text-xs text-[#78716C]">
              <Loader2 className="w-3 h-3 animate-spin" /> Updating...
            </span>
          ) : (
            <>
              {(status === "CONFIRMED" || status === "PENDING") && (
                <>
                  <button
                    onClick={() => onStatusChange(appt.id, "IN_PROGRESS")}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Play className="w-2.5 h-2.5" /> Start
                  </button>
                  <button
                    onClick={() => onStatusChange(appt.id, "NO_SHOW")}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition"
                  >
                    <UserX className="w-2.5 h-2.5" /> No Show
                  </button>
                </>
              )}
              {status === "IN_PROGRESS" && (
                <button
                  onClick={() => onStatusChange(appt.id, "COMPLETED")}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition"
                >
                  <CheckCircle2 className="w-2.5 h-2.5" /> Mark Done
                </button>
              )}
              {status === "COMPLETED" && (
                <Link
                  href="/finance/billing"
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
                >
                  <Receipt className="w-2.5 h-2.5" /> Bill
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-[#1C1917]">{formatINR(appt.amount)}</p>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<"Week" | "Month" | "Year">("Month");
  const [stats, setStats] = useState<DashStats | null>(null);
  const [todayAppts, setTodayAppts] = useState<TodayAppt[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInv[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAppt, setUpdatingAppt] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, inv, monthly, payment, services] = await Promise.all([
        fetch("/api/dashboard").then((r) => r.json()),
        fetch(`/api/appointments?date=${todayStr}`).then((r) => r.json()),
        fetch("/api/invoices").then((r) => r.json()),
        fetch("/api/reports/monthly").then((r) => r.json()),
        fetch("/api/cashflow/today").then((r) => r.json()),
        fetch("/api/reports/service-revenue").then((r) => r.json()),
      ]);
      setStats(s);
      setTodayAppts(Array.isArray(a) ? a : []);
      setRecentInvoices(Array.isArray(inv) ? inv.slice(0, 5) : []);
      setMonthlyData(Array.isArray(monthly) ? monthly : []);
      setPaymentBreakdown(payment && !payment.error ? payment : null);
      setTopServices(Array.isArray(services) ? services.slice(0, 5) : []);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleStatusChange(id: string, status: ApptStatus) {
    setUpdatingAppt(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setTodayAppts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      // Update today stats inline
      if (status === "COMPLETED") {
        setStats((prev) =>
          prev
            ? {
                ...prev,
                todayCompleted: prev.todayCompleted + 1,
                todayRevenue:
                  prev.todayRevenue +
                  (todayAppts.find((a) => a.id === id)?.amount ?? 0),
              }
            : prev
        );
      }
      const label: Record<ApptStatus, string> = {
        IN_PROGRESS: "Marked as In Progress",
        COMPLETED: "Marked as Completed",
        NO_SHOW: "Marked as No Show",
        CONFIRMED: "Confirmed",
        PENDING: "Pending",
        CANCELLED: "Cancelled",
      };
      toast.success(label[status]);
    } catch {
      toast.error("Could not update appointment");
    } finally {
      setUpdatingAppt(null);
    }
  }

  const pieData = paymentBreakdown
    ? [
        { name: "Cash", value: paymentBreakdown.cash, color: PIE_COLORS.Cash },
        { name: "UPI", value: paymentBreakdown.upi, color: PIE_COLORS.UPI },
        { name: "Card", value: paymentBreakdown.card, color: PIE_COLORS.Card },
        { name: "Split", value: paymentBreakdown.split, color: PIE_COLORS.Split },
      ].filter((d) => d.value > 0)
    : [];

  const maxServiceRevenue = topServices[0]?.revenue ?? 1;

  const pending = todayAppts.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING");
  const inProgress = todayAppts.filter((a) => a.status === "IN_PROGRESS");
  const done = todayAppts.filter((a) => a.status === "COMPLETED");

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1C1917]">
            {getGreeting()} 👋
          </h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="p-2 rounded-lg border border-[#E7E5E4] text-[#78716C] hover:bg-[#F5F5F4] transition"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/appointments"
            className="flex items-center gap-2 px-4 py-2.5 border border-[#E7E5E4] text-[#1C1917] text-sm font-medium rounded-xl hover:bg-[#F5F5F4] transition"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Appointments</span>
          </Link>
          <Link
            href="/finance/billing"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition shadow-sm"
          >
            <Receipt className="w-4 h-4" />
            <span className="hidden sm:inline">New Bill</span>
          </Link>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New Appointment", icon: Calendar, href: "/appointments", color: "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100", iconBg: "bg-blue-100" },
          { label: "New Bill / POS", icon: Receipt, href: "/finance/billing", color: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100", iconBg: "bg-amber-100" },
          { label: "Add Client", icon: Users, href: "/clients", color: "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100", iconBg: "bg-purple-100" },
          { label: "View Reports", icon: BarChart3, href: "/reports", color: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100", iconBg: "bg-emerald-100" },
        ].map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center gap-3 p-3.5 rounded-xl border ${action.color} transition`}
          >
            <div className={`w-8 h-8 rounded-lg ${action.iconBg} flex items-center justify-center shrink-0`}>
              <action.icon className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold leading-tight">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          iconBg="bg-amber-100"
          icon={<DollarSign className="w-5 h-5 text-[#D97706]" />}
          value={formatINR(stats?.todayRevenue ?? 0)}
          label="Today's Revenue"
          sub={`${stats?.todayCompleted ?? 0} completed`}
        />
        <KpiCard
          iconBg="bg-blue-100"
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
          value={String(stats?.todayAppointmentsCount ?? 0)}
          label="Today's Appointments"
          sub={`${stats?.todayCompleted ?? 0} done · ${inProgress.length} in progress`}
        />
        <KpiCard
          iconBg="bg-rose-100"
          icon={<Clock className="w-5 h-5 text-rose-500" />}
          value={formatINR(stats?.outstandingAmount ?? 0)}
          label="Pending Collections"
          valueColor="text-rose-600"
        />
        <KpiCard
          iconBg="bg-purple-100"
          icon={<Users className="w-5 h-5 text-purple-600" />}
          value={String(stats?.newClientsThisMonth ?? 0)}
          label="New Clients This Month"
          sub={`${stats?.totalClients ?? 0} total`}
          trend={<TrendingUp className="w-4 h-4 text-purple-400" />}
        />
      </div>

      {/* ── Today's Schedule ── */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold font-heading text-[#1C1917]">Today&apos;s Schedule</h2>
            <div className="flex items-center gap-1.5">
              {inProgress.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                  {inProgress.length} in progress
                </span>
              )}
              {pending.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                  {pending.length} upcoming
                </span>
              )}
            </div>
          </div>
          <Link
            href="/appointments"
            className="flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-amber-700 transition"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-[#D97706]" />
            </div>
          ) : todayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F4] flex items-center justify-center mb-3">
                <Calendar className="w-5 h-5 text-[#78716C]" />
              </div>
              <p className="text-sm text-[#78716C]">No appointments today</p>
              <Link
                href="/appointments"
                className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#D97706] hover:text-amber-700"
              >
                <Plus className="w-3.5 h-3.5" /> Book an appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {/* In Progress first */}
              {[...inProgress, ...pending, ...done,
                ...todayAppts.filter(a => a.status === "NO_SHOW" || a.status === "CANCELLED")
              ].map((appt) => (
                <ApptCard
                  key={appt.id}
                  appt={appt}
                  onStatusChange={handleStatusChange}
                  updating={updatingAppt}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Revenue Chart + Right Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <h2 className="text-base font-semibold font-heading text-[#1C1917]">Revenue vs Expenses</h2>
            <div className="flex items-center gap-1 bg-[#F5F5F4] rounded-lg p-1">
              {(["Week", "Month", "Year"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${revenuePeriod === period ? "bg-white text-[#1C1917] shadow-sm" : "text-[#78716C] hover:text-[#1C1917]"}`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          {monthlyData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-[#78716C] text-sm">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716C" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: "#78716C" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<RevenueTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", color: "#78716C", paddingTop: "12px" }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" strokeWidth={2} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4, fill: "#059669" }} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#DC2626" strokeWidth={2} fill="url(#colorExpenses)" dot={false} activeDot={{ r: 4, fill: "#DC2626" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Payment Methods */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
            <h3 className="text-sm font-semibold font-heading text-[#1C1917] mb-4">Payment Methods Today</h3>
            {pieData.length === 0 ? (
              <p className="text-sm text-[#78716C] text-center py-3">No payments recorded today</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-[#78716C]">{item.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#1C1917]">{formatINR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Services */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold font-heading text-[#1C1917]">Top Services This Month</h3>
              <Link href="/reports" className="text-xs text-[#D97706] font-medium hover:underline">More →</Link>
            </div>
            {topServices.length === 0 ? (
              <p className="text-sm text-[#78716C] text-center py-3">No service data yet</p>
            ) : (
              <div className="space-y-3">
                {topServices.map((svc, i) => {
                  const pct = Math.round((svc.revenue / maxServiceRevenue) * 100);
                  return (
                    <div key={svc.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-[#78716C] shrink-0 w-4">{i + 1}.</span>
                          <span className="text-xs font-medium text-[#1C1917] truncate">{svc.name}</span>
                        </div>
                        <span className="text-xs text-[#78716C] shrink-0 ml-2">{formatINR(svc.revenue)}</span>
                      </div>
                      <div className="h-1.5 bg-[#F5F5F4] rounded-full overflow-hidden">
                        <div className="h-full bg-[#D97706] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Nav */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-4">
            <h3 className="text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-3">Quick Navigate</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Inventory", icon: Package, href: "/inventory" },
                { label: "Staff", icon: Users, href: "/staff" },
                { label: "Marketing", icon: Megaphone, href: "/marketing" },
                { label: "Cash Flow", icon: DollarSign, href: "/finance/cash-flow" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-[#E7E5E4] hover:border-[#D97706]/40 hover:bg-amber-50/50 transition text-xs font-medium text-[#78716C] hover:text-[#1C1917]"
                >
                  <item.icon className="w-3.5 h-3.5 text-[#D97706]" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Invoices ── */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold font-heading text-[#1C1917]">Recent Invoices</h2>
          <Link
            href="/finance/invoices"
            className="flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:text-amber-700 transition"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E5E4]">
                {["Invoice #", "Client", "Services", "Amount", "Status", ""].map((col) => (
                  <th key={col} className="text-left text-xs font-medium text-[#78716C] pb-3 pr-4 last:pr-0 last:text-right">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-[#78716C] text-sm">No invoices yet</td></tr>
              )}
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-[#F5F5F4] last:border-0 hover:bg-[#FAFAF9] transition-colors">
                  <td className="py-3 pr-4"><span className="font-mono text-xs text-[#78716C]">{inv.invoiceNumber}</span></td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${getAvatarColor(inv.clientName)}`}>{getInitials(inv.clientName)}</div>
                      <span className="font-medium text-[#1C1917]">{inv.clientName}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 max-w-[180px]">
                    <span className="text-xs text-[#78716C] line-clamp-1">{inv.items.map((it) => it.description).join(", ")}</span>
                  </td>
                  <td className="py-3 pr-4"><span className="font-semibold text-[#1C1917]">{formatINR(inv.totalAmount)}</span></td>
                  <td className="py-3 pr-4"><InvoiceStatusBadge status={inv.status as InvoiceStatus} /></td>
                  <td className="py-3 text-right">
                    <Link
                      href="/finance/invoices"
                      className="text-xs text-[#78716C] border border-[#E7E5E4] hover:border-[#D97706] hover:text-[#D97706] px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {recentInvoices.length === 0 && <p className="text-sm text-center text-[#78716C] py-4">No invoices yet</p>}
          {recentInvoices.map((inv) => (
            <Link key={inv.id} href="/finance/invoices" className="flex items-center gap-3 p-3 rounded-xl border border-[#E7E5E4] hover:border-[#D97706]/40 transition">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(inv.clientName)}`}>{getInitials(inv.clientName)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1C1917]">{inv.clientName}</p>
                  <InvoiceStatusBadge status={inv.status as InvoiceStatus} />
                </div>
                <p className="text-xs text-[#78716C] truncate">{inv.invoiceNumber} · {inv.items.map((it) => it.description).join(", ")}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-[#1C1917]">{formatINR(inv.totalAmount)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
