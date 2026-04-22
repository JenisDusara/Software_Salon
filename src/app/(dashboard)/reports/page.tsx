"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import {
  DollarSign, PieChart as PieIcon, Users, TrendingUp, Download, Loader2,
} from "lucide-react";
import { formatINR, formatPercent } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthlyPoint = { month: string; revenue: number; expenses: number; profit: number };
type StaffPerf = { name: string; revenue: number; appointments: number; commission: number };
type ServiceRev = { name: string; revenue: number };
type AppHour = { hour: string; count: number };
type GstMonth = { month: string; collected: number; payable: number; taxableRevenue: number };
type Overview = {
  revenue: number; prevRevenue: number;
  expenses: number; prevExpenses: number;
  netProfit: number; prevNetProfit: number;
  totalClients: number; totalInvoices: number; paidInvoices: number;
};

function pctChange(curr: number, prev: number) {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

const PERIODS = ["This Month", "Last Month", "This Quarter", "This Year"] as const;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-stone-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span className="text-stone-500">{p.name}:</span>
          <span className="font-medium text-stone-800">
            {typeof p.value === "number" && p.name !== "Count" && p.name !== "Appointments"
              ? formatINR(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReportCard({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4]">
        <div>
          <h2 className="font-semibold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h2>
          {subtitle && <p className="text-xs text-[#78716C] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-[#78716C] text-center py-8">{message}</p>;
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function exportPDF(
  period: string,
  overview: Overview | null,
  monthlyData: MonthlyPoint[],
  staffPerf: StaffPerf[],
  serviceRevenue: ServiceRev[],
  gstData: GstMonth[],
) {
  const fmt = (n: number) =>
    `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const netMargin = overview && overview.revenue > 0
    ? ((overview.netProfit / overview.revenue) * 100).toFixed(1) + "%"
    : "0%";

  const kpiRow = (label: string, value: string, color = "#1c1917") =>
    `<div style="flex:1;background:#fafaf9;border-radius:10px;padding:14px;border:1px solid #e7e5e4;text-align:center">
      <div style="font-size:18px;font-weight:800;color:${color}">${value}</div>
      <div style="font-size:11px;color:#78716c;margin-top:4px">${label}</div>
    </div>`;

  const tableRow = (...cells: string[]) =>
    `<tr>${cells.map((c, i) => `<td style="padding:8px 10px;border-bottom:1px solid #f5f5f4;font-size:12px;${i > 0 ? "text-align:right" : ""}">${c}</td>`).join("")}</tr>`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>P&L Report — ${period}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1c1917;background:#f5f5f4}
    .topbar{background:#1c1917;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
    .logo{width:32px;height:32px;background:#d97706;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:white}
    .topbar-title{color:#e7e5e4;font-size:14px;font-weight:600;margin-left:10px}
    .dl-btn{background:#d97706;color:white;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer}
    .dl-btn:hover{background:#b45309}
    .card{max-width:760px;margin:20px auto;background:white;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.07);padding:28px;margin-bottom:20px}
    h1{font-size:20px;font-weight:800}
    h2{font-size:14px;font-weight:700;margin-bottom:12px;color:#1c1917}
    table{width:100%;border-collapse:collapse}
    th{background:#1c1917;color:#e7e5e4;padding:8px 10px;font-size:11px;text-align:left;font-weight:600}
    th:not(:first-child){text-align:right}
    tfoot td{font-weight:700;background:#fafaf9;border-top:2px solid #e7e5e4}
    @media print{.topbar{display:none!important}.card{margin:0;border-radius:0;box-shadow:none}@page{margin:12px}}
  </style></head><body>
  <div class="topbar">
    <div style="display:flex;align-items:center">
      <div class="logo">S</div>
      <div class="topbar-title">Profit & Loss Report — ${period}</div>
    </div>
    <button class="dl-btn" onclick="window.print()">⬇ Download / Print</button>
  </div>

  <!-- Header card -->
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1c1917;padding-bottom:14px;margin-bottom:18px">
      <div>
        <h1>Profit & Loss Report</h1>
        <div style="color:#78716c;font-size:12px;margin-top:4px">${period} · Generated on ${date}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:11px;color:#78716c">SalonSoft Pro</div>
        <div style="font-size:11px;color:#78716c">GST Compliant</div>
      </div>
    </div>
    <!-- KPIs -->
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      ${kpiRow("Total Revenue", fmt(overview?.revenue ?? 0), "#059669")}
      ${kpiRow("Total Expenses", fmt(overview?.expenses ?? 0), "#dc2626")}
      ${kpiRow("Net Profit", fmt(overview?.netProfit ?? 0), "#d97706")}
      ${kpiRow("Net Margin", netMargin, "#2563eb")}
    </div>
  </div>

  <!-- Monthly P&L -->
  ${monthlyData.length > 0 ? `<div class="card">
    <h2>Monthly Revenue & Expenses</h2>
    <table>
      <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Net Profit</th></tr></thead>
      <tbody>${monthlyData.map((m) => tableRow(m.month, fmt(m.revenue), fmt(m.expenses), fmt(m.profit))).join("")}</tbody>
      <tfoot><tr>
        <td style="padding:8px 10px;font-size:12px">Total</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right">${fmt(monthlyData.reduce((s, m) => s + m.revenue, 0))}</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right">${fmt(monthlyData.reduce((s, m) => s + m.expenses, 0))}</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right;color:#d97706">${fmt(monthlyData.reduce((s, m) => s + m.profit, 0))}</td>
      </tr></tfoot>
    </table>
  </div>` : ""}

  <!-- Staff Performance -->
  ${staffPerf.length > 0 ? `<div class="card">
    <h2>Staff Performance</h2>
    <table>
      <thead><tr><th>Stylist</th><th>Appointments</th><th>Revenue</th><th>Commission</th><th>Net to Salon</th></tr></thead>
      <tbody>${staffPerf.map((s) => tableRow(s.name, String(s.appointments), fmt(s.revenue), fmt(s.commission), fmt(s.revenue - s.commission))).join("")}</tbody>
      <tfoot><tr>
        <td style="padding:8px 10px;font-size:12px">Total</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right">${staffPerf.reduce((s, x) => s + x.appointments, 0)}</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right">${fmt(staffPerf.reduce((s, x) => s + x.revenue, 0))}</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right">${fmt(staffPerf.reduce((s, x) => s + x.commission, 0))}</td>
        <td style="padding:8px 10px;font-size:12px;text-align:right">${fmt(staffPerf.reduce((s, x) => s + x.revenue - x.commission, 0))}</td>
      </tr></tfoot>
    </table>
  </div>` : ""}

  <!-- Service Revenue -->
  ${serviceRevenue.length > 0 ? `<div class="card">
    <h2>Revenue by Service</h2>
    <table>
      <thead><tr><th>Service</th><th>Revenue</th></tr></thead>
      <tbody>${serviceRevenue.map((s) => tableRow(s.name, fmt(s.revenue))).join("")}</tbody>
    </table>
  </div>` : ""}

  <!-- GST -->
  ${gstData.length > 0 ? `<div class="card">
    <h2>GST Summary</h2>
    <table>
      <thead><tr><th>Month</th><th>Taxable Revenue</th><th>GST Collected</th><th>GST Payable</th></tr></thead>
      <tbody>${gstData.map((g) => tableRow(g.month, fmt(g.taxableRevenue), fmt(g.collected), fmt(g.payable))).join("")}</tbody>
    </table>
  </div>` : ""}

  </body></html>`;

  const win = window.open("", "_blank", "width=820,height=960");
  if (win) { win.document.write(html); win.document.close(); }
  else alert("Pop-up blocked — please allow pop-ups for this site");
}

function exportCSV(
  period: string,
  overview: Overview | null,
  monthlyData: MonthlyPoint[],
  staffPerf: StaffPerf[],
  serviceRevenue: ServiceRev[],
  gstData: GstMonth[],
) {
  const rows: string[] = [];
  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const row = (...cols: (string | number)[]) => rows.push(cols.map(cell).join(","));

  row("Profit & Loss Report", period);
  row("Generated", new Date().toLocaleDateString("en-IN"));
  rows.push("");

  // Overview
  row("SUMMARY");
  row("Total Revenue", overview?.revenue ?? 0);
  row("Total Expenses", overview?.expenses ?? 0);
  row("Net Profit", overview?.netProfit ?? 0);
  row("Total Clients", overview?.totalClients ?? 0);
  row("Total Invoices", overview?.totalInvoices ?? 0);
  row("Paid Invoices", overview?.paidInvoices ?? 0);
  rows.push("");

  // Monthly
  if (monthlyData.length > 0) {
    row("MONTHLY P&L");
    row("Month", "Revenue", "Expenses", "Net Profit");
    monthlyData.forEach((m) => row(m.month, m.revenue, m.expenses, m.profit));
    rows.push("");
  }

  // Staff
  if (staffPerf.length > 0) {
    row("STAFF PERFORMANCE");
    row("Stylist", "Appointments", "Revenue", "Commission", "Net to Salon");
    staffPerf.forEach((s) => row(s.name, s.appointments, s.revenue, s.commission, s.revenue - s.commission));
    rows.push("");
  }

  // Services
  if (serviceRevenue.length > 0) {
    row("REVENUE BY SERVICE");
    row("Service", "Revenue");
    serviceRevenue.forEach((s) => row(s.name, s.revenue));
    rows.push("");
  }

  // GST
  if (gstData.length > 0) {
    row("GST SUMMARY");
    row("Month", "Taxable Revenue", "GST Collected", "GST Payable");
    gstData.forEach((g) => row(g.month, g.taxableRevenue, g.collected, g.payable));
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PL_Report_${period.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activePeriod, setActivePeriod] = useState<string>("This Month");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [serviceRevenue, setServiceRevenue] = useState<ServiceRev[]>([]);
  const [staffPerf, setStaffPerf] = useState<StaffPerf[]>([]);
  const [appointmentHours, setAppointmentHours] = useState<AppHour[]>([]);
  const [gstData, setGstData] = useState<GstMonth[]>([]);

  const periodParam =
    activePeriod === "Last Month" ? "last_month"
    : activePeriod === "This Quarter" ? "this_quarter"
    : activePeriod === "This Year" ? "this_year"
    : "this_month";

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/reports/overview?period=${periodParam}`).then((r) => r.json()),
      fetch("/api/reports/monthly").then((r) => r.json()),
      fetch("/api/reports/service-revenue").then((r) => r.json()),
      fetch("/api/reports/staff-performance").then((r) => r.json()),
      fetch("/api/reports/appointment-hours").then((r) => r.json()),
      fetch("/api/reports/gst").then((r) => r.json()),
    ]).then(([ov, monthly, services, staff, hours, gst]) => {
      setOverview(ov && !ov.error ? ov : null);
      setMonthlyData(Array.isArray(monthly) ? monthly : []);
      setServiceRevenue(Array.isArray(services) ? services : []);
      setStaffPerf(Array.isArray(staff) ? staff : []);
      setAppointmentHours(Array.isArray(hours) ? hours : []);
      setGstData(Array.isArray(gst) ? gst : []);
    }).finally(() => setLoading(false));
  }, [periodParam]);

  const revChange = overview ? pctChange(overview.revenue, overview.prevRevenue) : 0;
  const profitChange = overview ? pctChange(overview.netProfit, overview.prevNetProfit) : 0;
  const totalStaffRevenue = staffPerf.reduce((s, x) => s + x.revenue, 0);
  const latestGst = gstData[gstData.length - 1];

  const clientSegments = overview
    ? [
        { name: "Active Clients", value: overview.totalClients, color: "#D97706" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Reports</h1>
          <p className="text-[#78716C] text-sm mt-0.5">Business analytics &amp; performance insights</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-sm shrink-0">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${activePeriod === p ? "bg-[#1C1917] text-white" : "text-[#78716C] hover:bg-[#F5F5F4]"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => exportPDF(activePeriod, overview, monthlyData, staffPerf, serviceRevenue, gstData)}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E7E5E4] bg-white rounded-lg text-sm text-[#78716C] hover:bg-[#F5F5F4] shadow-sm transition shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button
            onClick={() => exportCSV(activePeriod, overview, monthlyData, staffPerf, serviceRevenue, gstData)}
            className="flex items-center gap-1.5 px-3 py-2 border border-[#E7E5E4] bg-white rounded-lg text-sm text-[#78716C] hover:bg-[#F5F5F4] shadow-sm transition shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#D97706]" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Revenue", value: formatINR(overview?.revenue ?? 0), change: `${revChange >= 0 ? "+" : ""}${revChange.toFixed(1)}%`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600", positive: revChange >= 0 },
              { label: "Net Profit", value: formatINR(overview?.netProfit ?? 0), change: `${profitChange >= 0 ? "+" : ""}${profitChange.toFixed(1)}%`, icon: TrendingUp, color: "bg-amber-50 text-amber-600", positive: profitChange >= 0 },
              { label: "Total Clients", value: overview?.totalClients ?? 0, change: "in total", icon: Users, color: "bg-blue-50 text-blue-600", positive: true },
              { label: "Invoices", value: overview ? `${overview.paidInvoices}/${overview.totalInvoices}` : "0/0", change: "paid", icon: PieIcon, color: "bg-purple-50 text-purple-600", positive: true },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-[#78716C] text-xs">{s.label}</p>
                  <span className={`text-xs font-medium ${s.positive ? "text-emerald-600" : "text-red-600"}`}>{s.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Trend */}
          <ReportCard title="Revenue Report" subtitle="Monthly revenue, expenses & profit trend — last 12 months">
            {monthlyData.length === 0 ? (
              <EmptyState message="No revenue data available yet" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} formatter={(v) => <span style={{ color: "#78716C" }}>{v}</span>} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" fill="#D1FAE5" strokeWidth={2} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#DC2626" fill="#FEE2E2" strokeWidth={2} fillOpacity={0.4} />
                  <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#D97706" strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: "#D97706", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ReportCard>

          {/* Two column — Service Revenue + Appointment Peaks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ReportCard title="Revenue by Service" subtitle="This month breakdown">
              {serviceRevenue.length === 0 ? (
                <EmptyState message="No service revenue data yet" />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={serviceRevenue} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#78716C" }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" name="Revenue" fill="#D97706" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ReportCard>

            <ReportCard title="Appointment Report" subtitle="Peak hours — appointments by time slot">
              {appointmentHours.every((h) => h.count === 0) ? (
                <EmptyState message="No appointment data yet" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={appointmentHours} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Count" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-[#E7E5E4]">
                    {[
                      { label: "Total", value: appointmentHours.reduce((s, h) => s + h.count, 0) },
                      { label: "Peak Hour", value: appointmentHours.reduce((max, h) => h.count > max.count ? h : max, appointmentHours[0])?.hour ?? "—" },
                      { label: "Avg / Hour", value: Math.round(appointmentHours.reduce((s, h) => s + h.count, 0) / appointmentHours.filter((h) => h.count > 0).length || 0) },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="font-bold text-[#1C1917]">{s.value}</p>
                        <p className="text-xs text-[#78716C]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ReportCard>
          </div>

          {/* Staff Performance */}
          <ReportCard title="Staff Performance" subtitle="Revenue generated & commission earned this month">
            {staffPerf.length === 0 ? (
              <EmptyState message="No staff performance data yet" />
            ) : (
              <>
                {/* Mobile card view */}
                <div className="md:hidden space-y-3 mb-5">
                  {staffPerf.map((staff) => {
                    const netToSalon = staff.revenue - staff.commission;
                    const sharePercent = totalStaffRevenue > 0 ? Math.round((staff.revenue / totalStaffRevenue) * 100) : 0;
                    return (
                      <div key={staff.name} className="bg-[#FAFAF9] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-[#1C1917] text-sm">{staff.name}</p>
                          <span className="text-xs text-[#78716C]">{sharePercent}% of team</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><p className="text-xs text-[#78716C]">Appointments</p><p className="font-medium text-[#1C1917]">{staff.appointments}</p></div>
                          <div><p className="text-xs text-[#78716C]">Revenue</p><p className="font-semibold text-[#1C1917]">{formatINR(staff.revenue)}</p></div>
                          <div><p className="text-xs text-[#78716C]">Commission</p><p className="font-medium text-amber-600">{formatINR(staff.commission)}</p></div>
                          <div><p className="text-xs text-[#78716C]">Net to Salon</p><p className="font-semibold text-emerald-600">{formatINR(netToSalon)}</p></div>
                        </div>
                        <div className="mt-3 h-1.5 bg-[#E7E5E4] rounded-full"><div className="h-full bg-[#D97706] rounded-full" style={{ width: `${sharePercent}%` }} /></div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E7E5E4] bg-[#FAFAF9]">
                        <th className="text-left px-4 py-3 font-medium text-[#78716C]">Stylist</th>
                        <th className="text-right px-4 py-3 font-medium text-[#78716C]">Appointments</th>
                        <th className="text-right px-4 py-3 font-medium text-[#78716C]">Revenue</th>
                        <th className="text-right px-4 py-3 font-medium text-[#78716C]">Commission</th>
                        <th className="text-right px-4 py-3 font-medium text-[#78716C]">Net to Salon</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E5E4]">
                      {staffPerf.map((staff) => {
                        const netToSalon = staff.revenue - staff.commission;
                        const sharePercent = totalStaffRevenue > 0 ? Math.round((staff.revenue / totalStaffRevenue) * 100) : 0;
                        return (
                          <tr key={staff.name} className="hover:bg-[#FAFAF9] transition">
                            <td className="px-4 py-3 font-medium text-[#1C1917]">{staff.name}</td>
                            <td className="px-4 py-3 text-right text-[#78716C]">{staff.appointments}</td>
                            <td className="px-4 py-3 text-right font-medium text-[#1C1917]">{formatINR(staff.revenue)}</td>
                            <td className="px-4 py-3 text-right text-amber-600">{formatINR(staff.commission)}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{formatINR(netToSalon)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[#F5F5F4] rounded-full min-w-[60px]">
                                  <div className="h-full bg-[#D97706] rounded-full" style={{ width: `${sharePercent}%` }} />
                                </div>
                                <span className="text-xs text-[#78716C] w-8 text-right">{sharePercent}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#E7E5E4] bg-[#FAFAF9]">
                        <td className="px-4 py-3 font-bold text-[#1C1917]">Total</td>
                        <td className="px-4 py-3 text-right font-bold text-[#1C1917]">{staffPerf.reduce((s, x) => s + x.appointments, 0)}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#1C1917]">{formatINR(totalStaffRevenue)}</td>
                        <td className="px-4 py-3 text-right font-bold text-amber-600">{formatINR(staffPerf.reduce((s, x) => s + x.commission, 0))}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatINR(staffPerf.reduce((s, x) => s + x.revenue - x.commission, 0))}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="mt-5 h-48">
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide mb-3">Revenue by Stylist</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={staffPerf} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#78716C" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="commission" name="Commission" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </ReportCard>

          {/* Two column — Client Summary + GST Report */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Summary */}
            <ReportCard title="Client Summary" subtitle="Total registered clients">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Clients", value: overview?.totalClients ?? 0 },
                  { label: "Total Invoices", value: overview?.totalInvoices ?? 0 },
                  { label: "Paid Invoices", value: overview?.paidInvoices ?? 0 },
                  { label: "Outstanding", value: (overview?.totalInvoices ?? 0) - (overview?.paidInvoices ?? 0) },
                ].map((s) => (
                  <div key={s.label} className="bg-[#FAFAF9] rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#1C1917]">{s.value}</p>
                    <p className="text-xs text-[#78716C] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </ReportCard>

            {/* GST Report */}
            <ReportCard title="GST Report" subtitle="GSTR-1 summary — GST collected vs payable">
              {gstData.length === 0 ? (
                <EmptyState message="No GST data available yet" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={gstData} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="collected" name="Collected" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="payable" name="Payable" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                  {latestGst && (
                    <div className="mt-4 pt-4 border-t border-[#E7E5E4] space-y-2.5">
                      {[
                        { label: "Taxable Revenue", value: formatINR(latestGst.taxableRevenue) },
                        { label: "CGST (9%)", value: formatINR(Math.round(latestGst.collected / 2)) },
                        { label: "SGST (9%)", value: formatINR(Math.round(latestGst.collected / 2)) },
                        { label: "Total Collected", value: formatINR(latestGst.collected), bold: true },
                        { label: "Net GST Payable", value: formatINR(latestGst.payable), bold: true, highlight: true },
                      ].map(({ label, value, bold, highlight }) => (
                        <div key={label} className={`flex items-center justify-between text-sm py-1 ${highlight ? "bg-emerald-50 -mx-5 px-5 border-t border-b border-emerald-100" : ""}`}>
                          <span className="text-[#78716C]">{label}</span>
                          <span className={`${bold ? "font-bold text-[#1C1917]" : "text-[#1C1917]"} ${highlight ? "text-emerald-700 text-base" : ""}`}>{value}</span>
                        </div>
                      ))}
                      <button
                        onClick={() => exportCSV("GST " + activePeriod, overview, monthlyData, staffPerf, serviceRevenue, gstData)}
                        className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition mt-2"
                      >
                        <Download className="w-4 h-4" />
                        Download GSTR-1
                      </button>
                    </div>
                  )}
                </>
              )}
            </ReportCard>
          </div>
        </>
      )}
    </div>
  );
}
