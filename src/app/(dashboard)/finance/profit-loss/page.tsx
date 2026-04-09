"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Percent,
  Download, FileText, FileSpreadsheet, ChevronDown,
  ArrowUpRight, ArrowDownRight, Loader2,
} from "lucide-react";
import { formatINR, formatPercent, percentChange } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type MonthlyPoint = { month: string; revenue: number; expenses: number; profit: number };
type Overview = {
  revenue: number; prevRevenue: number;
  expenses: number; prevExpenses: number;
  netProfit: number; prevNetProfit: number;
  totalClients: number; totalInvoices: number; paidInvoices: number;
};
type ExpenseCat = { categoryName: string; amount: number };

const PERIODS = ["This Month", "Last Month", "This Quarter", "This Year", "Custom"] as const;

function pctParam(p: string) {
  if (p === "Last Month") return "last_month";
  if (p === "This Quarter") return "this_quarter";
  if (p === "This Year") return "this_year";
  return "this_month";
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-stone-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span className="text-stone-500 capitalize">{p.name}:</span>
          <span className="font-medium text-stone-800">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Ratio Card ───────────────────────────────────────────────────────────────

function RatioCard({ label, value, benchmark, status, unit = "%" }: {
  label: string; value: number; benchmark: string; status: "green" | "amber" | "red"; unit?: string;
}) {
  const dot = status === "green" ? "bg-[#059669]" : status === "amber" ? "bg-[#D97706]" : "bg-[#DC2626]";
  const textColor = status === "green" ? "text-[#059669]" : status === "amber" ? "text-[#D97706]" : "text-[#DC2626]";
  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</p>
        <span className={`w-2.5 h-2.5 rounded-full mt-0.5 ${dot}`} />
      </div>
      <p className={`text-3xl font-bold ${textColor} mb-1`}>{value.toFixed(1)}{unit}</p>
      <p className="text-xs text-stone-400">{benchmark}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfitLossPage() {
  const [activePeriod, setActivePeriod] = useState<string>("This Month");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyPoint[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseCat[]>([]);

  useEffect(() => {
    setLoading(true);
    const period = pctParam(activePeriod);

    Promise.all([
      fetch(`/api/reports/overview?period=${period}`).then((r) => r.json()),
      fetch("/api/reports/monthly").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ]).then(([ov, monthly, expenses]) => {
      setOverview(ov && !ov.error ? ov : null);
      setMonthlyData(Array.isArray(monthly) ? monthly : []);

      // Aggregate expenses by category
      if (Array.isArray(expenses)) {
        const map: Record<string, number> = {};
        for (const e of expenses) {
          if (e.categoryName) {
            map[e.categoryName] = (map[e.categoryName] ?? 0) + e.amount;
          }
        }
        const cats = Object.entries(map)
          .map(([categoryName, amount]) => ({ categoryName, amount }))
          .sort((a, b) => b.amount - a.amount);
        setExpensesByCategory(cats);
      }
    }).finally(() => setLoading(false));
  }, [activePeriod]);

  const revenue = overview?.revenue ?? 0;
  const prevRevenue = overview?.prevRevenue ?? 0;
  const expenses = overview?.expenses ?? 0;
  const prevExpenses = overview?.prevExpenses ?? 0;
  const netProfit = overview?.netProfit ?? 0;
  const prevNetProfit = overview?.prevNetProfit ?? 0;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const prevMargin = prevRevenue > 0 ? (prevNetProfit / prevRevenue) * 100 : 0;

  const revChange = percentChange(revenue, prevRevenue);
  const expChange = percentChange(expenses, prevExpenses);
  const profitChange = percentChange(netProfit, prevNetProfit);
  const marginChange = margin - prevMargin;

  const laborCostRatio = revenue > 0 ? (expensesByCategory.find((c) => c.categoryName === "Salaries & Wages")?.amount ?? 0) / revenue * 100 : 0;
  const rentCostRatio = revenue > 0 ? (expensesByCategory.find((c) => c.categoryName === "Rent & Lease")?.amount ?? 0) / revenue * 100 : 0;
  const grossMargin = revenue > 0 ? ((revenue - (expensesByCategory.find((c) => c.categoryName === "Products & Supplies")?.amount ?? 0)) / revenue) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Profit &amp; Loss Report</h1>
          <p className="text-sm text-stone-500 mt-0.5">Financial summary</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 text-sm text-stone-600 border border-[#E7E5E4] rounded-lg px-3 py-2 hover:bg-stone-50 transition-colors">
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-1.5 text-sm text-stone-600 border border-[#E7E5E4] rounded-lg px-3 py-2 hover:bg-stone-50 transition-colors">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* ─── Controls Bar ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-sm overflow-x-auto shrink-0 max-w-full">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${activePeriod === p ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-50"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 text-sm text-stone-600 border border-[#E7E5E4] bg-white rounded-lg px-3 py-2 shadow-sm hover:bg-stone-50 transition-colors">
          All Locations
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#D97706]" />
        </div>
      ) : (
        <>
          {/* ─── Executive Summary Cards ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 border-l-4 border-l-[#059669] bg-gradient-to-br from-white to-emerald-50/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-stone-900">{formatINR(revenue)}</p>
                </div>
                <div className="bg-emerald-100 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-[#059669]" /></div>
              </div>
              <div className="flex items-center gap-1.5">
                {revChange >= 0 ? <ArrowUpRight className="w-4 h-4 text-[#059669]" /> : <ArrowDownRight className="w-4 h-4 text-[#DC2626]" />}
                <span className={`text-sm font-semibold ${revChange >= 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>{formatPercent(revChange)}</span>
                <span className="text-xs text-stone-400">vs prev period</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 border-l-4 border-l-[#DC2626] bg-gradient-to-br from-white to-red-50/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold text-stone-900">{formatINR(expenses)}</p>
                </div>
                <div className="bg-red-100 p-2 rounded-lg"><TrendingDown className="w-5 h-5 text-[#DC2626]" /></div>
              </div>
              <div className="flex items-center gap-1.5">
                {expChange <= 0 ? <ArrowDownRight className="w-4 h-4 text-[#059669]" /> : <ArrowUpRight className="w-4 h-4 text-[#DC2626]" />}
                <span className={`text-sm font-semibold ${expChange <= 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>{formatPercent(expChange)}</span>
                <span className="text-xs text-stone-400">vs prev period</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 border-l-4 border-l-[#D97706] bg-gradient-to-br from-white to-amber-50/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Net Profit</p>
                  <p className="text-3xl font-bold text-stone-900">{formatINR(netProfit)}</p>
                </div>
                <div className="bg-amber-100 p-2 rounded-lg"><DollarSign className="w-5 h-5 text-[#D97706]" /></div>
              </div>
              <div className="flex items-center gap-1.5">
                {profitChange >= 0 ? <ArrowUpRight className="w-4 h-4 text-[#059669]" /> : <ArrowDownRight className="w-4 h-4 text-[#DC2626]" />}
                <span className={`text-sm font-semibold ${profitChange >= 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>{formatPercent(profitChange)}</span>
                <span className="text-xs text-stone-400">vs prev period</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 border-l-4 border-l-[#2563EB] bg-gradient-to-br from-white to-blue-50/30">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Net Margin</p>
                  <p className="text-3xl font-bold text-stone-900">{margin.toFixed(1)}%</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg"><Percent className="w-5 h-5 text-[#2563EB]" /></div>
              </div>
              <div className="flex items-center gap-1.5">
                {marginChange >= 0 ? <ArrowUpRight className="w-4 h-4 text-[#059669]" /> : <ArrowDownRight className="w-4 h-4 text-[#DC2626]" />}
                <span className={`text-sm font-semibold ${marginChange >= 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>{marginChange >= 0 ? "+" : ""}{marginChange.toFixed(1)} pts</span>
                <span className="text-xs text-stone-400">vs prev period</span>
              </div>
            </div>
          </div>

          {/* ─── Expense Breakdown ─── */}
          {expensesByCategory.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <h2 className="font-semibold text-stone-800">Expense Breakdown</h2>
                <span className="text-xs text-stone-400">% of Revenue</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100">
                      <th className="text-left pl-3 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Category</th>
                      <th className="text-right pr-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Amount</th>
                      <th className="text-right pr-3 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">% Rev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expensesByCategory.map((row) => {
                      const pctRev = revenue > 0 ? (row.amount / revenue) * 100 : 0;
                      return (
                        <tr key={row.categoryName} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                          <td className="pl-3 py-2.5 text-sm text-stone-700">{row.categoryName}</td>
                          <td className="pr-4 py-2.5 text-sm text-right font-medium text-stone-800">{formatINR(row.amount)}</td>
                          <td className="pr-3 py-2.5 text-sm text-right text-stone-500">{pctRev.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-50 border-t-2 border-stone-200">
                      <td className="pl-3 py-3 text-sm font-bold text-stone-800">TOTAL EXPENSES</td>
                      <td className="pr-4 py-3 text-sm font-bold text-right text-stone-900">{formatINR(expenses)}</td>
                      <td className="pr-3 py-3 text-sm font-bold text-right text-stone-500">
                        {revenue > 0 ? ((expenses / revenue) * 100).toFixed(1) : "0.0"}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ─── Monthly Trend Chart ─── */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-4">Monthly Trend — Last 12 Months</h2>
            {monthlyData.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-8">No data available yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} formatter={(value) => <span style={{ color: "#78716C", textTransform: "capitalize" }}>{value}</span>} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" fill="#D1FAE5" strokeWidth={2} fillOpacity={0.5} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#DC2626" fill="#FEE2E2" strokeWidth={2} fillOpacity={0.4} />
                  <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#D97706" strokeWidth={2.5} strokeDasharray="6 3" dot={{ fill: "#D97706", r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ─── Key Business Ratios ─── */}
          {revenue > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-stone-800">Key Business Ratios</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <RatioCard
                  label="Labor Cost Ratio"
                  value={laborCostRatio}
                  benchmark="Benchmark: < 35%"
                  status={laborCostRatio < 35 ? "green" : laborCostRatio < 45 ? "amber" : "red"}
                />
                <RatioCard
                  label="Rent Cost Ratio"
                  value={rentCostRatio}
                  benchmark="Benchmark: < 15%"
                  status={rentCostRatio < 15 ? "green" : rentCostRatio < 20 ? "amber" : "red"}
                />
                <RatioCard
                  label="Gross Margin"
                  value={grossMargin}
                  benchmark="Benchmark: > 80%"
                  status={grossMargin > 80 ? "green" : grossMargin > 60 ? "amber" : "red"}
                />
                <RatioCard
                  label="Net Margin"
                  value={margin}
                  benchmark="Benchmark: > 20%"
                  status={margin > 20 ? "green" : margin > 10 ? "amber" : "red"}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
