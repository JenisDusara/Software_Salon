"use client";

import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import {
  DollarSign, PieChart as PieIcon, Users, TrendingUp,
  Calendar, Package, Download, ChevronDown,
} from "lucide-react";
import { formatINR, formatPercent } from "@/lib/utils";
import { MONTHLY_REVENUE_DATA, SAMPLE_STAFF, SAMPLE_CLIENTS, SAMPLE_INVOICES, TODAY_APPOINTMENTS } from "@/data/sampleData";

// ─── Data ─────────────────────────────────────────────────────────────────────

const STAFF_PERFORMANCE = [
  { name: "Anita Nair", revenue: 68000, appointments: 35, commission: 13600 },
  { name: "Rahul Verma", revenue: 72000, appointments: 38, commission: 14400 },
  { name: "Suresh Kumar", revenue: 55000, appointments: 29, commission: 9900 },
  { name: "Rohan Mehta", revenue: 63000, appointments: 33, commission: 11340 },
  { name: "Amit Joshi", revenue: 41000, appointments: 22, commission: 8200 },
];

const CLIENT_SEGMENTS = [
  { name: "Gold (500+ pts)", value: SAMPLE_CLIENTS.filter((c) => c.loyaltyPoints >= 500).length, color: "#D97706" },
  { name: "Silver (200-499)", value: SAMPLE_CLIENTS.filter((c) => c.loyaltyPoints >= 200 && c.loyaltyPoints < 500).length, color: "#78716C" },
  { name: "Bronze (<200)", value: SAMPLE_CLIENTS.filter((c) => c.loyaltyPoints < 200).length, color: "#D97706" + "66" },
];

const SERVICE_REVENUE = [
  { name: "Haircuts", revenue: 112000 },
  { name: "Hair Color", revenue: 89500 },
  { name: "Facial", revenue: 67800 },
  { name: "Beard", revenue: 45000 },
  { name: "Bridal", revenue: 35000 },
  { name: "Nails", revenue: 28500 },
  { name: "Products", revenue: 23000 },
  { name: "Other", revenue: 22700 },
];

const APPOINTMENT_HOURS = [
  { hour: "9AM", count: 4 }, { hour: "10AM", count: 8 }, { hour: "11AM", count: 12 },
  { hour: "12PM", count: 9 }, { hour: "1PM", count: 6 }, { hour: "2PM", count: 10 },
  { hour: "3PM", count: 11 }, { hour: "4PM", count: 14 }, { hour: "5PM", count: 13 },
  { hour: "6PM", count: 9 }, { hour: "7PM", count: 7 },
];

const GST_DATA = [
  { month: "Jan", collected: 32400, payable: 21600 },
  { month: "Feb", collected: 34100, payable: 23200 },
  { month: "Mar", collected: 32000, payable: 21400 },
  { month: "Apr", collected: 38200, payable: 25600 },
];

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
            {typeof p.value === "number" && p.name !== "Appointments" && p.name !== "Count" ? formatINR(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Report Section Wrapper ───────────────────────────────────────────────────

function ReportCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activePeriod, setActivePeriod] = useState<string>("This Month");

  const totalRevenue = 423500;
  const totalExpenses = 287200;
  const netProfit = totalRevenue - totalExpenses;
  const totalInvoices = SAMPLE_INVOICES.length;
  const paidInvoices = SAMPLE_INVOICES.filter((i) => i.status === "PAID").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Reports
          </h1>
          <p className="text-[#78716C] text-sm mt-0.5">Business analytics &amp; performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-3 py-2 text-sm font-medium transition ${activePeriod === p ? "bg-[#1C1917] text-white" : "text-[#78716C] hover:bg-[#F5F5F4]"}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-[#E7E5E4] bg-white rounded-lg text-sm text-[#78716C] hover:bg-[#F5F5F4] shadow-sm transition">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatINR(totalRevenue), change: "+19.8%", icon: DollarSign, color: "bg-emerald-50 text-emerald-600", positive: true },
          { label: "Net Profit", value: formatINR(netProfit), change: "+28%", icon: TrendingUp, color: "bg-amber-50 text-amber-600", positive: true },
          { label: "Total Clients", value: SAMPLE_CLIENTS.length, change: "+3 new", icon: Users, color: "bg-blue-50 text-blue-600", positive: true },
          { label: "Invoices", value: `${paidInvoices}/${totalInvoices}`, change: "paid", icon: PieIcon, color: "bg-purple-50 text-purple-600", positive: true },
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
      <ReportCard
        title="Revenue Report"
        subtitle="Monthly revenue, expenses & profit trend — last 12 months"
        action={
          <button className="flex items-center gap-1 text-xs text-[#78716C] border border-[#E7E5E4] rounded-lg px-2.5 py-1.5 hover:bg-[#F5F5F4] transition">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        }
      >
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={MONTHLY_REVENUE_DATA} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
      </ReportCard>

      {/* Two column — Service Revenue + Appointment Peaks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Revenue */}
        <ReportCard title="Revenue by Service" subtitle="This month breakdown">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={SERVICE_REVENUE} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#78716C" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} width={75} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#D97706" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ReportCard>

        {/* Peak Hours */}
        <ReportCard title="Appointment Report" subtitle="Peak hours — appointments by time slot">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={APPOINTMENT_HOURS} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
              <YAxis tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Count" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-[#E7E5E4]">
            {[
              { label: "Total Today", value: TODAY_APPOINTMENTS.length },
              { label: "Completed", value: TODAY_APPOINTMENTS.filter((a) => a.status === "COMPLETED").length },
              { label: "Peak Hour", value: "4–5 PM" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-bold text-[#1C1917]">{s.value}</p>
                <p className="text-xs text-[#78716C]">{s.label}</p>
              </div>
            ))}
          </div>
        </ReportCard>
      </div>

      {/* Staff Performance */}
      <ReportCard title="Staff Performance" subtitle="Revenue generated & commission earned this month">
        <div className="overflow-x-auto">
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
              {STAFF_PERFORMANCE.map((staff) => {
                const netToSalon = staff.revenue - staff.commission;
                const sharePercent = Math.round((staff.revenue / STAFF_PERFORMANCE.reduce((s, x) => s + x.revenue, 0)) * 100);
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
                <td className="px-4 py-3 text-right font-bold text-[#1C1917]">{STAFF_PERFORMANCE.reduce((s, x) => s + x.appointments, 0)}</td>
                <td className="px-4 py-3 text-right font-bold text-[#1C1917]">{formatINR(STAFF_PERFORMANCE.reduce((s, x) => s + x.revenue, 0))}</td>
                <td className="px-4 py-3 text-right font-bold text-amber-600">{formatINR(STAFF_PERFORMANCE.reduce((s, x) => s + x.commission, 0))}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatINR(STAFF_PERFORMANCE.reduce((s, x) => s + x.revenue - x.commission, 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-5 h-48">
          <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide mb-3">Revenue by Stylist</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={STAFF_PERFORMANCE} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: "#78716C" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="commission" name="Commission" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ReportCard>

      {/* Two column — Client Analytics + GST Report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Analytics */}
        <ReportCard title="Client Analytics" subtitle="Loyalty tiers & spending patterns">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={CLIENT_SEGMENTS}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {CLIENT_SEGMENTS.map((entry, index) => (
                    <Cell key={index} fill={["#D97706", "#78716C", "#FEF3C7"][index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} clients`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {CLIENT_SEGMENTS.map((seg, i) => (
                <div key={seg.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: ["#D97706", "#78716C", "#FEF3C7"][i] }} />
                    <span className="text-sm text-[#78716C]">{seg.name}</span>
                  </div>
                  <span className="font-semibold text-[#1C1917] text-sm">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#E7E5E4] grid grid-cols-3 gap-3">
            {[
              { label: "Total Clients", value: SAMPLE_CLIENTS.length },
              { label: "Avg Visits", value: Math.round(SAMPLE_CLIENTS.reduce((s, c) => s + c.visitCount, 0) / SAMPLE_CLIENTS.length) },
              { label: "Avg Spend", value: formatINR(Math.round(SAMPLE_CLIENTS.reduce((s, c) => s + c.totalSpent, 0) / SAMPLE_CLIENTS.length)) },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-bold text-[#1C1917]">{s.value}</p>
                <p className="text-xs text-[#78716C]">{s.label}</p>
              </div>
            ))}
          </div>
        </ReportCard>

        {/* GST Report */}
        <ReportCard title="GST Report" subtitle="GSTR-1 summary — GST collected vs payable">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={GST_DATA} margin={{ top: 0, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="collected" name="Collected" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="payable" name="Payable" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 pt-4 border-t border-[#E7E5E4] space-y-2.5">
            {[
              { label: "Taxable Revenue", value: "₹3,58,898" },
              { label: "CGST (9%)", value: "₹32,301" },
              { label: "SGST (9%)", value: "₹32,301" },
              { label: "Total Collected", value: "₹64,602", bold: true },
              { label: "Net GST Payable", value: "₹50,022", bold: true, highlight: true },
            ].map(({ label, value, bold, highlight }) => (
              <div
                key={label}
                className={`flex items-center justify-between text-sm py-1 ${highlight ? "bg-emerald-50 -mx-5 px-5 border-t border-b border-emerald-100" : ""}`}
              >
                <span className="text-[#78716C]">{label}</span>
                <span className={`${bold ? "font-bold text-[#1C1917]" : "text-[#1C1917]"} ${highlight ? "text-emerald-700 text-base" : ""}`}>
                  {value}
                </span>
              </div>
            ))}
            <button className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium hover:text-emerald-700 transition mt-2">
              <Download className="w-4 h-4" />
              Download GSTR-1
            </button>
          </div>
        </ReportCard>
      </div>

      {/* Inventory Report */}
      <ReportCard title="Inventory Report" subtitle="Stock levels and product performance">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          {[
            { label: "Total Products", value: "6", color: "text-blue-600 bg-blue-50" },
            { label: "Low Stock", value: "3", color: "text-red-600 bg-red-50" },
            { label: "Stock Value", value: "₹78,620", color: "text-emerald-600 bg-emerald-50" },
            { label: "Categories", value: "6", color: "text-amber-600 bg-amber-50" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={[
              { name: "L'Oreal Dark Brown", stock: 24, threshold: 5 },
              { name: "Wella Ash Blonde", stock: 3, threshold: 5 },
              { name: "Schwarzkopf Dust", stock: 8, threshold: 3 },
              { name: "Kerastase Shampoo", stock: 12, threshold: 4 },
              { name: "OPI Nail Polish", stock: 2, threshold: 5 },
              { name: "Biotique Hair Oil", stock: 18, threshold: 6 },
            ]}
            margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
            <YAxis tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="stock" name="Current Stock" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Bar dataKey="threshold" name="Min Threshold" fill="#E7E5E4" radius={[4, 4, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </ReportCard>
    </div>
  );
}
