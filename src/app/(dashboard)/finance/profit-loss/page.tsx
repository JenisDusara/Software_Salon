"use client";

import { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle,
  Circle,
} from "lucide-react";
import { formatINR, formatPercent, percentChange } from "@/lib/utils";
import { MONTHLY_REVENUE_DATA } from "@/data/sampleData";

// ─── Data ─────────────────────────────────────────────────────────────────────

const thisMonth = { revenue: 423500, expenses: 287200, profit: 136300 };
const lastMonth = { revenue: 353500, expenses: 295000, profit: 58500 };
const margin = (thisMonth.profit / thisMonth.revenue) * 100;
const lastMargin = (lastMonth.profit / lastMonth.revenue) * 100;

const REVENUE_ROWS = [
  {
    category: "Service Revenue",
    thisP: 377500,
    lastP: 317500,
    isParent: true,
    children: [
      { category: "Haircuts", thisP: 112000, lastP: 98500 },
      { category: "Hair Coloring", thisP: 89500, lastP: 82000 },
      { category: "Beard & Grooming", thisP: 45000, lastP: 41200 },
      { category: "Skin & Facial", thisP: 67800, lastP: 71000 },
      { category: "Bridal Services", thisP: 35000, lastP: 0 },
      { category: "Other", thisP: 28200, lastP: 24800 },
    ],
  },
  { category: "Product Sales", thisP: 23000, lastP: 19000, isParent: false },
  { category: "Membership Revenue", thisP: 15000, lastP: 12000, isParent: false },
  { category: "Gift Vouchers", thisP: 8000, lastP: 5500, isParent: false },
];

const EXPENSE_ROWS = [
  { category: "Salaries & Wages", amount: 145000, lastAmount: 138000 },
  { category: "Rent & Lease", amount: 65000, lastAmount: 65000 },
  { category: "Products & Supplies", amount: 30500, lastAmount: 32000 },
  { category: "Utilities", amount: 10000, lastAmount: 9800 },
  { category: "Marketing & Ads", amount: 5000, lastAmount: 8000 },
  { category: "Equipment & Tools", amount: 7200, lastAmount: 5000 },
  { category: "Professional Services", amount: 8000, lastAmount: 8000 },
  { category: "Maintenance", amount: 3500, lastAmount: 2200 },
  { category: "Staff Benefits", amount: 2500, lastAmount: 2000 },
  { category: "Miscellaneous", amount: 850, lastAmount: 1000 },
  { category: "Other", amount: 9650, lastAmount: 24000 },
];

const PERIODS = ["This Month", "Last Month", "This Quarter", "This Year", "Custom"] as const;

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

// ─── Revenue Row Component ─────────────────────────────────────────────────────

function RevenueRow({
  category,
  thisP,
  lastP,
  indent = false,
  isBridal = false,
}: {
  category: string;
  thisP: number;
  lastP: number;
  indent?: boolean;
  isBridal?: boolean;
}) {
  const diff = thisP - lastP;
  const pct = lastP === 0 ? null : percentChange(thisP, lastP);
  const isNew = lastP === 0;
  const isNeg = diff < 0;

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
      <td className={`py-2.5 text-sm text-stone-700 ${indent ? "pl-8" : "pl-3 font-medium"}`}>
        {indent && <span className="text-stone-400 mr-1">↳</span>}
        {category}
      </td>
      <td className="py-2.5 pr-4 text-sm text-right font-medium text-stone-800">
        {formatINR(thisP)}
      </td>
      <td className="py-2.5 pr-4 text-sm text-right text-stone-500">
        {lastP === 0 ? "—" : formatINR(lastP)}
      </td>
      <td className={`py-2.5 pr-4 text-sm text-right font-medium ${isNeg ? "text-[#DC2626]" : "text-[#059669]"}`}>
        {isNew ? "" : `${isNeg ? "" : "+"}${formatINR(Math.abs(diff))}`}
      </td>
      <td className="py-2.5 pr-3 text-sm text-right">
        {isNew ? (
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">New</span>
        ) : (
          <span className={`font-medium ${isNeg ? "text-[#DC2626]" : "text-[#059669]"}`}>
            {pct !== null ? formatPercent(pct) : "—"}
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Ratio Card ───────────────────────────────────────────────────────────────

function RatioCard({
  label,
  value,
  benchmark,
  status,
  unit = "%",
}: {
  label: string;
  value: number;
  benchmark: string;
  status: "green" | "amber" | "red";
  unit?: string;
}) {
  const dot =
    status === "green"
      ? "bg-[#059669]"
      : status === "amber"
      ? "bg-[#D97706]"
      : "bg-[#DC2626]";
  const textColor =
    status === "green"
      ? "text-[#059669]"
      : status === "amber"
      ? "text-[#D97706]"
      : "text-[#DC2626]";

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</p>
        <span className={`w-2.5 h-2.5 rounded-full mt-0.5 ${dot}`} />
      </div>
      <p className={`text-3xl font-bold ${textColor} mb-1`}>
        {value.toFixed(1)}{unit}
      </p>
      <p className="text-xs text-stone-400">{benchmark}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfitLossPage() {
  const [activePeriod, setActivePeriod] = useState<string>("This Month");
  const [expandedRevenue, setExpandedRevenue] = useState(true);

  const revChange = percentChange(thisMonth.revenue, lastMonth.revenue);
  const expChange = percentChange(thisMonth.expenses, lastMonth.expenses);
  const profitChange = percentChange(thisMonth.profit, lastMonth.profit);
  const marginChange = margin - lastMargin;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Profit & Loss Report</h1>
          <p className="text-sm text-stone-500 mt-0.5">Financial summary — April 2025</p>
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
        <div className="flex items-center bg-white border border-[#E7E5E4] rounded-lg overflow-hidden shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                activePeriod === p
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
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

      {/* ─── Executive Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 border-l-4 border-l-[#059669] bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-stone-900">{formatINR(thisMonth.revenue)}</p>
            </div>
            <div className="bg-emerald-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#059669]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-[#059669]" />
            <span className="text-sm font-semibold text-[#059669]">{formatPercent(revChange)}</span>
            <span className="text-xs text-stone-400">vs prev month</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 border-l-4 border-l-[#DC2626] bg-gradient-to-br from-white to-red-50/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-stone-900">{formatINR(thisMonth.expenses)}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-[#DC2626]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowDownRight className="w-4 h-4 text-[#059669]" />
            <span className="text-sm font-semibold text-[#059669]">{formatPercent(expChange)}</span>
            <span className="text-xs text-stone-400">vs prev month</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 border-l-4 border-l-[#D97706] bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Net Profit</p>
              <p className="text-3xl font-bold text-stone-900">{formatINR(thisMonth.profit)}</p>
            </div>
            <div className="bg-amber-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-[#D97706]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-[#059669]" />
            <span className="text-sm font-semibold text-[#059669]">{formatPercent(profitChange)}</span>
            <span className="text-xs text-stone-400">vs prev month</span>
          </div>
        </div>

        {/* Margin */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 border-l-4 border-l-[#2563EB] bg-gradient-to-br from-white to-blue-50/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Net Margin</p>
              <p className="text-3xl font-bold text-stone-900">{margin.toFixed(1)}%</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Percent className="w-5 h-5 text-[#2563EB]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-[#059669]" />
            <span className="text-sm font-semibold text-[#059669]">+{marginChange.toFixed(1)} pts</span>
            <span className="text-xs text-stone-400">vs prev month</span>
          </div>
        </div>
      </div>

      {/* ─── Two Column: Revenue + Expense Tables ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800">Revenue Breakdown</h2>
            <button
              onClick={() => setExpandedRevenue(!expandedRevenue)}
              className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
            >
              {expandedRevenue ? "Collapse" : "Expand"} subcategories
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left pl-3 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Category</th>
                  <th className="text-right pr-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">This Period</th>
                  <th className="text-right pr-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Last Period</th>
                  <th className="text-right pr-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Change</th>
                  <th className="text-right pr-3 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">%</th>
                </tr>
              </thead>
              <tbody>
                {REVENUE_ROWS.map((row) => (
                  <>
                    <RevenueRow
                      key={row.category}
                      category={row.category}
                      thisP={row.thisP}
                      lastP={row.lastP}
                      indent={false}
                    />
                    {expandedRevenue &&
                      row.children?.map((child) => (
                        <RevenueRow
                          key={child.category}
                          category={child.category}
                          thisP={child.thisP}
                          lastP={child.lastP}
                          indent={true}
                          isBridal={child.lastP === 0}
                        />
                      ))}
                  </>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 border-t-2 border-stone-200">
                  <td className="pl-3 py-3 text-sm font-bold text-stone-800">TOTAL REVENUE</td>
                  <td className="pr-4 py-3 text-sm font-bold text-right text-stone-900">{formatINR(thisMonth.revenue)}</td>
                  <td className="pr-4 py-3 text-sm font-bold text-right text-stone-500">{formatINR(lastMonth.revenue)}</td>
                  <td className="pr-4 py-3 text-sm font-bold text-right text-[#059669]">+{formatINR(thisMonth.revenue - lastMonth.revenue)}</td>
                  <td className="pr-3 py-3 text-sm font-bold text-right text-[#059669]">{formatPercent(revChange)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Expense Breakdown */}
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
                  <th className="text-right pr-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">% Rev</th>
                  <th className="text-right pr-3 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">vs Last</th>
                </tr>
              </thead>
              <tbody>
                {EXPENSE_ROWS.map((row) => {
                  const pctRev = (row.amount / thisMonth.revenue) * 100;
                  const diff = row.amount - row.lastAmount;
                  const isNeg = diff > 0;
                  return (
                    <tr key={row.category} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="pl-3 py-2.5 text-sm text-stone-700">{row.category}</td>
                      <td className="pr-4 py-2.5 text-sm text-right font-medium text-stone-800">{formatINR(row.amount)}</td>
                      <td className="pr-4 py-2.5 text-sm text-right text-stone-500">{pctRev.toFixed(1)}%</td>
                      <td className={`pr-3 py-2.5 text-sm text-right font-medium ${isNeg ? "text-[#DC2626]" : "text-[#059669]"}`}>
                        {diff === 0 ? "—" : `${isNeg ? "+" : ""}${formatINR(Math.abs(diff))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-stone-50 border-t-2 border-stone-200">
                  <td className="pl-3 py-3 text-sm font-bold text-stone-800">TOTAL EXPENSES</td>
                  <td className="pr-4 py-3 text-sm font-bold text-right text-stone-900">{formatINR(thisMonth.expenses)}</td>
                  <td className="pr-4 py-3 text-sm font-bold text-right text-stone-500">
                    {((thisMonth.expenses / thisMonth.revenue) * 100).toFixed(1)}%
                  </td>
                  <td className={`pr-3 py-3 text-sm font-bold text-right ${thisMonth.expenses < lastMonth.expenses ? "text-[#059669]" : "text-[#DC2626]"}`}>
                    {formatPercent(expChange)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Monthly Trend Chart ─── */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
        <h2 className="font-semibold text-stone-800 mb-4">Monthly Trend — Last 12 Months</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={MONTHLY_REVENUE_DATA} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#78716C" }}
              tickLine={false}
              axisLine={{ stroke: "#E7E5E4" }}
            />
            <YAxis
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#78716C" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              formatter={(value) => (
                <span style={{ color: "#78716C", textTransform: "capitalize" }}>{value}</span>
              )}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#059669"
              fill="#D1FAE5"
              strokeWidth={2}
              fillOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#DC2626"
              fill="#FEE2E2"
              strokeWidth={2}
              fillOpacity={0.4}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="Net Profit"
              stroke="#D97706"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={{ fill: "#D97706", r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ─── GST Summary + Key Ratios ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* GST Summary */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
          <div className="bg-[#059669] px-5 py-3">
            <h2 className="font-semibold text-white text-sm">GST Summary — April 2025</h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: "Taxable Revenue", value: "₹3,58,898", bold: false },
              { label: "CGST Collected (9%)", value: "₹32,301", bold: false },
              { label: "SGST Collected (9%)", value: "₹32,301", bold: false },
              { label: "Total GST Collected", value: "₹64,602", bold: true },
              { label: "GST on Expenses", value: "₹14,580", bold: false },
              { label: "Net GST Payable", value: "₹50,022", bold: true, highlight: true },
              { label: "Due Date", value: "20 May 2025", bold: false },
            ].map(({ label, value, bold, highlight }) => (
              <div
                key={label}
                className={`flex items-center justify-between py-2 ${
                  highlight ? "border-t border-b border-emerald-100 bg-emerald-50 -mx-5 px-5" : ""
                }`}
              >
                <span className="text-sm text-stone-600">{label}</span>
                <span
                  className={`text-sm ${bold ? "font-bold text-stone-900" : "text-stone-700"} ${
                    highlight ? "text-[#059669] font-bold text-base" : ""
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
            <button className="mt-2 flex items-center gap-1.5 text-sm font-medium text-[#059669] hover:text-emerald-700 transition-colors">
              <Download className="w-4 h-4" />
              Download GSTR-1
            </button>
          </div>
        </div>

        {/* Key Business Ratios */}
        <div className="space-y-4">
          <h2 className="font-semibold text-stone-800">Key Business Ratios</h2>
          <div className="grid grid-cols-2 gap-4">
            <RatioCard
              label="Labor Cost Ratio"
              value={34.2}
              benchmark="Benchmark: < 35%"
              status="green"
            />
            <RatioCard
              label="Rent Cost Ratio"
              value={15.3}
              benchmark="Benchmark: < 15%"
              status="amber"
            />
            <RatioCard
              label="Gross Margin"
              value={89.7}
              benchmark="Benchmark: > 80%"
              status="green"
            />
            <RatioCard
              label="Net Margin"
              value={32.2}
              benchmark="Benchmark: > 20%"
              status="green"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
