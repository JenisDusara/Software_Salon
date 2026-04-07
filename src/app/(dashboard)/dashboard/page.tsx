"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { formatINR, formatDate, getInitials, getAvatarColor } from "@/lib/utils";
import {
  MONTHLY_REVENUE_DATA,
  TODAY_APPOINTMENTS,
  SAMPLE_INVOICES,
} from "@/data/sampleData";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppointmentStatus = "CONFIRMED" | "COMPLETED" | "IN_PROGRESS" | "PENDING";
type InvoiceStatus = "PAID" | "PENDING" | "OVERDUE" | "PARTIAL";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_PIE_DATA = [
  { name: "Cash", value: 4200, color: "#D97706" },
  { name: "UPI", value: 11850, color: "#2563EB" },
  { name: "Card", value: 2400, color: "#059669" },
];

const TOP_SERVICES = [
  { name: "Global Hair Color", amount: 89500, pct: 65 },
  { name: "Haircut (Women)", amount: 67800, pct: 49 },
  { name: "Hair Spa", amount: 52400, pct: 38 },
  { name: "Facial Premium", amount: 48200, pct: 35 },
  { name: "Manicure", amount: 35100, pct: 25 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  icon,
  iconBg,
  value,
  label,
  sub,
  trend,
  valueColor = "text-[#1C1917]",
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  sub?: React.ReactNode;
  trend?: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
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

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const map: Record<AppointmentStatus, string> = {
    CONFIRMED: "bg-amber-100 text-amber-700 border border-amber-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border border-blue-200",
    PENDING: "bg-stone-100 text-stone-600 border border-stone-200",
  };
  const labels: Record<AppointmentStatus, string> = {
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    IN_PROGRESS: "In Progress",
    PENDING: "Pending",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status]}`}>
      {labels[status]}
    </span>
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

// ─── Custom Tooltip for Revenue Chart ────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const revenue = payload.find((p) => p.name === "Revenue")?.value ?? 0;
  const expenses = payload.find((p) => p.name === "Expenses")?.value ?? 0;
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-[#1C1917] mb-2 font-heading">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#78716C]">
            <span className="w-2 h-2 rounded-full bg-[#059669] inline-block" />
            Revenue
          </span>
          <span className="font-medium text-[#1C1917]">{formatINR(revenue)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#78716C]">
            <span className="w-2 h-2 rounded-full bg-[#DC2626] inline-block" />
            Expenses
          </span>
          <span className="font-medium text-[#1C1917]">{formatINR(expenses)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-[#E7E5E4] pt-1 mt-1">
          <span className="text-[#78716C]">Net Profit</span>
          <span className={`font-semibold ${revenue - expenses >= 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>
            {formatINR(revenue - expenses)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip for Pie Chart ─────────────────────────────────────────────

function PieTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-lg shadow-md p-2.5 text-sm">
      <p className="font-medium text-[#1C1917]">{entry.name}</p>
      <p className="text-[#78716C]">{formatINR(entry.value)}</p>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<"Week" | "Month" | "Year">("Month");

  const today = new Date();
  const recentInvoices = SAMPLE_INVOICES.slice(0, 5);

  return (
    <div className="space-y-6 p-6 bg-[#FAFAF9] min-h-screen">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1C1917]">
            Good morning, Priya 👋
          </h1>
          <p className="text-sm text-[#78716C] mt-1">
            Here&apos;s what&apos;s happening at Mumbai Main today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[#1C1917]">
              {today.toLocaleDateString("en-IN", { weekday: "long" })}
            </p>
            <p className="text-xs text-[#78716C]">{formatDate(today)}</p>
          </div>
          <button className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <Receipt className="w-4 h-4" />
            New Bill
          </button>
        </div>
      </div>

      {/* ── 2. KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 – Today's Revenue */}
        <KpiCard
          iconBg="bg-amber-100"
          icon={<DollarSign className="w-5 h-5 text-[#D97706]" />}
          value="₹18,450"
          label="Today's Revenue"
          trend={
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              +12%
            </span>
          }
          sub="vs yesterday"
        />

        {/* Card 2 – Appointments */}
        <KpiCard
          iconBg="bg-blue-100"
          icon={<Calendar className="w-5 h-5 text-blue-600" />}
          value="7"
          label="Today's Appointments"
          sub="3 completed • 2 upcoming"
        />

        {/* Card 3 – Pending Amount */}
        <KpiCard
          iconBg="bg-amber-100"
          icon={<Clock className="w-5 h-5 text-[#D97706]" />}
          value="₹26,540"
          label="Pending Collections"
          sub="5 invoices"
          valueColor="text-[#D97706]"
        />

        {/* Card 4 – Active Clients */}
        <KpiCard
          iconBg="bg-purple-100"
          icon={<Users className="w-5 h-5 text-purple-600" />}
          value="12"
          label="New Clients This Month"
          sub="+3 vs last month"
          trend={
            <TrendingUp className="w-4 h-4 text-purple-400" />
          }
        />
      </div>

      {/* ── 3. Revenue Chart ── */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="text-base font-semibold font-heading text-[#1C1917]">
            Revenue vs Expenses
          </h2>
          <div className="flex items-center gap-1 bg-[#F5F5F4] rounded-lg p-1">
            {(["Week", "Month", "Year"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setRevenuePeriod(period)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  revenuePeriod === period
                    ? "bg-white text-[#1C1917] shadow-sm"
                    : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={MONTHLY_REVENUE_DATA}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
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
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#78716C" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`}
              tick={{ fontSize: 11, fill: "#78716C" }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "#78716C", paddingTop: "12px" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#059669"
              strokeWidth={2}
              fill="url(#colorRevenue)"
              dot={false}
              activeDot={{ r: 4, fill: "#059669" }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#DC2626"
              strokeWidth={2}
              fill="url(#colorExpenses)"
              dot={false}
              activeDot={{ r: 4, fill: "#DC2626" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── 4. Two-Column Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left – Today's Appointments (60%) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold font-heading text-[#1C1917]">
              Today&apos;s Appointments
            </h2>
            <button className="text-xs text-[#D97706] hover:underline font-medium">
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {TODAY_APPOINTMENTS.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FAFAF9] transition-colors border border-transparent hover:border-[#E7E5E4]"
              >
                {/* Time */}
                <div className="w-16 shrink-0 text-center">
                  <p className="text-xs font-bold text-[#D97706] leading-tight">
                    {appt.time.split(" ")[0]}
                  </p>
                  <p className="text-[10px] text-[#78716C]">{appt.time.split(" ")[1]}</p>
                </div>

                {/* Client + Service */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C1917] truncate">{appt.clientName}</p>
                  <p className="text-xs text-[#78716C] truncate">{appt.serviceName}</p>
                </div>

                {/* Staff */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${getAvatarColor(appt.staffName)}`}
                  >
                    {getInitials(appt.staffName)}
                  </div>
                  <span className="text-xs text-[#78716C] hidden md:block">{appt.staffName.split(" ")[0]}</span>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <StatusBadge status={appt.status as AppointmentStatus} />
                </div>

                {/* Amount + Bill button */}
                <div className="shrink-0 text-right flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1C1917]">{formatINR(appt.amount)}</span>
                  {appt.status === "COMPLETED" && (
                    <button className="text-xs text-[#D97706] border border-[#D97706] hover:bg-amber-50 px-2 py-0.5 rounded-lg font-medium transition-colors">
                      Bill
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right – Quick Stats (40%) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Mini Card 1 – Payment Methods Donut */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
            <h3 className="text-sm font-semibold font-heading text-[#1C1917] mb-4">
              Payment Methods Today
            </h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie
                    data={PAYMENT_PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {PAYMENT_PIE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {PAYMENT_PIE_DATA.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-[#78716C]">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#1C1917]">
                      {formatINR(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mini Card 2 – Top Services */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 flex-1">
            <h3 className="text-sm font-semibold font-heading text-[#1C1917] mb-4">
              Top Services This Month
            </h3>
            <div className="space-y-3">
              {TOP_SERVICES.map((svc, i) => (
                <div key={svc.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-[#78716C] shrink-0 w-4">{i + 1}.</span>
                      <span className="text-xs font-medium text-[#1C1917] truncate">{svc.name}</span>
                    </div>
                    <span className="text-xs text-[#78716C] shrink-0 ml-2">{formatINR(svc.amount)}</span>
                  </div>
                  <div className="h-1.5 bg-[#F5F5F4] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D97706] rounded-full transition-all"
                      style={{ width: `${svc.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Recent Invoices Table ── */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold font-heading text-[#1C1917]">Recent Invoices</h2>
          <button className="text-xs text-[#D97706] hover:underline font-medium">
            View All →
          </button>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E7E5E4]">
                {["Invoice #", "Client", "Services", "Amount", "Status", "Action"].map((col) => (
                  <th
                    key={col}
                    className="text-left text-xs font-medium text-[#78716C] pb-3 pr-4 last:pr-0"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-[#F5F5F4] last:border-0 hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="py-3 pr-4">
                    <span className="font-mono text-xs text-[#78716C]">{inv.invoiceNumber}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${getAvatarColor(inv.clientName)}`}
                      >
                        {getInitials(inv.clientName)}
                      </div>
                      <span className="font-medium text-[#1C1917]">{inv.clientName}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    <span className="text-xs text-[#78716C] line-clamp-1">
                      {inv.items.map((it) => it.description).join(", ")}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-[#1C1917]">
                      {formatINR(inv.totalAmount)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <InvoiceStatusBadge status={inv.status as InvoiceStatus} />
                  </td>
                  <td className="py-3">
                    <button className="text-xs text-[#78716C] border border-[#E7E5E4] hover:border-[#D97706] hover:text-[#D97706] px-3 py-1.5 rounded-lg transition-colors font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden space-y-3">
          {recentInvoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-[#E7E5E4]"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(inv.clientName)}`}
              >
                {getInitials(inv.clientName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1C1917]">{inv.clientName}</p>
                  <InvoiceStatusBadge status={inv.status as InvoiceStatus} />
                </div>
                <p className="text-xs text-[#78716C] truncate">
                  {inv.invoiceNumber} • {inv.items.map((it) => it.description).join(", ")}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-[#1C1917]">{formatINR(inv.totalAmount)}</p>
                <button className="text-xs text-[#D97706] font-medium">View</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
