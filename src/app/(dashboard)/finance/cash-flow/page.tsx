"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart,
} from "recharts";
import {
  Banknote, Smartphone, CreditCard, Clock, ChevronDown, ChevronUp,
  MessageCircle, CheckCircle, AlertTriangle, Calendar, Loader2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { formatINR, buildWhatsAppUrl } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TodayFlow = {
  cash: number; upi: number; card: number; split: number; other: number;
  totalInflows: number; totalOutflows: number;
};
type HistoryRow = { date: string; day: string; opening: number; inflows: number; outflows: number; closing: number };
type PendingInv = {
  id: string; invoiceNumber: string; clientName: string; clientPhone: string;
  totalAmount: number; amountPaid: number; dueDate: string | null; status: string;
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-stone-700 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span className="text-stone-500">{p.name}:</span>
          <span className="font-medium text-stone-800">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CashFlowPage() {
  const [openingBalance, setOpeningBalance] = useState(0);
  const [openingInput, setOpeningInput] = useState("0");
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [todayFlow, setTodayFlow] = useState<TodayFlow | null>(null);
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<PendingInv[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [flowRes, histRes, invRes] = await Promise.all([
        fetch("/api/cashflow/today").then((r) => r.json()),
        fetch("/api/cashflow/history?days=7").then((r) => r.json()),
        fetch("/api/invoices?status=PENDING").then((r) => r.json()),
      ]);

      if (flowRes && !flowRes.error) setTodayFlow(flowRes);
      if (Array.isArray(histRes)) setHistoryData(histRes);
      if (Array.isArray(invRes)) {
        const pending = invRes.filter((inv: any) =>
          ["PENDING", "OVERDUE", "PARTIAL"].includes(inv.status)
        );
        setPendingInvoices(pending);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cashInflow = todayFlow?.cash ?? 0;
  const upiInflow = todayFlow?.upi ?? 0;
  const cardInflow = todayFlow?.card ?? 0;
  const totalInflows = todayFlow?.totalInflows ?? 0;
  const totalOutflows = todayFlow?.totalOutflows ?? 0;
  const closingBalance = openingBalance + totalInflows - totalOutflows;
  const expectedClosing = openingBalance + totalInflows - totalOutflows;
  const difference = closingBalance - expectedClosing;

  const pendingWithOverdue = pendingInvoices.map((inv) => {
    const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
    const daysOverdue = dueDate ? Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))) : 0;
    return { ...inv, daysOverdue };
  }).sort((a, b) => b.daysOverdue - a.daysOverdue);

  const paymentMethods = [
    { label: "Cash", icon: <Banknote className="w-5 h-5" />, amount: cashInflow, color: "text-[#059669]", bg: "bg-emerald-100" },
    { label: "UPI", icon: <Smartphone className="w-5 h-5" />, amount: upiInflow, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Card", icon: <CreditCard className="w-5 h-5" />, amount: cardInflow, color: "text-purple-600", bg: "bg-purple-100" },
    {
      label: "Pending",
      icon: <Clock className="w-5 h-5" />,
      amount: pendingInvoices.reduce((s, i) => s + (i.totalAmount - i.amountPaid), 0),
      color: "text-[#D97706]",
      bg: "bg-amber-100",
    },
  ];

  const weeklyChartData = historyData.map((row) => ({
    day: row.day,
    inflows: row.inflows,
    outflows: row.outflows,
    balance: row.closing,
  }));

  const handleCloseDay = () => {
    toast.success("Day closed and saved successfully!", {
      duration: 3000,
      style: { background: "#1C1917", color: "#fff", borderRadius: "10px", fontSize: "14px" },
      iconTheme: { primary: "#D97706", secondary: "#fff" },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D97706]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Toaster position="top-right" />

      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Cash Flow</h1>
        <p className="text-sm text-stone-500 mt-0.5">Daily register &amp; cash movement</p>
      </div>

      {/* ─── Today's Register Card ─── */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D97706]" />
              Today&apos;s Register
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {today.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={handleCloseDay}
            className="bg-[#D97706] hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
          >
            Close Day &amp; Save
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-4">
            {/* Opening Balance */}
            <div className="flex items-center justify-between py-3 border-b border-stone-100">
              <span className="text-sm font-medium text-stone-600">Opening Balance</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-stone-500 mr-1">₹</span>
                <input
                  type="number"
                  value={openingInput}
                  onChange={(e) => {
                    setOpeningInput(e.target.value);
                    const parsed = parseInt(e.target.value, 10);
                    if (!isNaN(parsed)) setOpeningBalance(parsed);
                  }}
                  className="w-28 text-right text-sm font-semibold text-stone-800 border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Inflows */}
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Inflows Today</p>
              <div className="space-y-2">
                {[
                  { label: "+ Cash collected", amount: cashInflow },
                  { label: "+ UPI collected", amount: upiInflow },
                  { label: "+ Card collected", amount: cardInflow },
                ].map(({ label, amount }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">{label}</span>
                    <span className="font-medium text-stone-800">{formatINR(amount)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <span className="text-sm font-semibold text-stone-700">Total Inflows</span>
                  <span className="text-sm font-bold text-[#059669]">{formatINR(totalInflows)}</span>
                </div>
              </div>
            </div>

            {/* Outflows */}
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Outflows Today</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">- Expenses today</span>
                  <span className="font-medium text-stone-800">{formatINR(totalOutflows)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <span className="text-sm font-semibold text-stone-700">Total Outflows</span>
                  <span className="text-sm font-bold text-[#DC2626]">{formatINR(totalOutflows)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — closing */}
          <div className="flex flex-col justify-center bg-stone-50 rounded-xl p-6 space-y-4">
            <div className="text-center">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Closing Balance</p>
              <p className="text-5xl font-extrabold text-stone-900 tracking-tight">{formatINR(closingBalance)}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-stone-500">
                <span>Expected</span>
                <span className="font-medium text-stone-700">{formatINR(expectedClosing)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Difference</span>
                <span className={`flex items-center gap-1.5 font-bold ${difference === 0 ? "text-[#059669]" : "text-[#DC2626]"}`}>
                  {formatINR(difference)}
                  {difference === 0 ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Payment Method Cards ─── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {paymentMethods.map(({ label, icon, amount, color, bg }) => {
          const pct = totalInflows > 0 ? (amount / totalInflows) * 100 : 0;
          return (
            <div key={label} className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
                <span className="text-sm font-semibold text-stone-600">{label}</span>
              </div>
              <p className={`text-2xl font-bold mb-3 ${color}`}>{formatINR(amount)}</p>
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#D97706] rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <p className="text-xs text-stone-400 mt-1.5">{pct.toFixed(1)}% of total inflows</p>
            </div>
          );
        })}
      </div>

      {/* ─── Weekly Chart ─── */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
        <h2 className="font-semibold text-stone-800 mb-4">Last 7 Days — Daily Cash Flow</h2>
        {weeklyChartData.every((d) => d.inflows === 0 && d.outflows === 0) ? (
          <p className="text-sm text-stone-500 text-center py-8">No cash flow data for the last 7 days</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={weeklyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={{ stroke: "#E7E5E4" }} />
              <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#78716C" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} formatter={(value) => <span style={{ color: "#78716C" }}>{value}</span>} />
              <Bar dataKey="inflows" name="Inflows" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="outflows" name="Outflows" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line type="monotone" dataKey="balance" name="Cumulative Balance" stroke="#D97706" strokeWidth={2.5} dot={{ fill: "#D97706", r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ─── Pending Collections ─── */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800">Pending Collections</h2>
          <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            {pendingWithOverdue.length} outstanding
          </span>
        </div>

        {pendingWithOverdue.length === 0 ? (
          <p className="text-sm text-stone-500 text-center py-8">No pending collections</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-100">
                  <th className="text-left pl-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Client</th>
                  <th className="text-left py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Invoice</th>
                  <th className="text-right py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Due</th>
                  <th className="text-right py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Overdue</th>
                  <th className="pr-4 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody>
                {pendingWithOverdue.map((inv) => {
                  const isHighlighted = inv.daysOverdue > 7;
                  const due = inv.totalAmount - inv.amountPaid;
                  const waMsg = `Hi ${inv.clientName}! 🙏 Gentle reminder about your outstanding amount of ${formatINR(due)} for Invoice #${inv.invoiceNumber}. Please arrange payment at your earliest convenience. Thank you!`;
                  const waUrl = buildWhatsAppUrl(inv.clientPhone, waMsg);
                  return (
                    <tr key={inv.id} className={`border-b border-stone-100 transition-colors ${isHighlighted ? "bg-red-50 hover:bg-red-100/60" : "hover:bg-stone-50"}`}>
                      <td className="pl-4 py-3 text-sm">
                        <p className="font-medium text-stone-800">{inv.clientName}</p>
                        <p className="text-xs text-stone-400">{inv.clientPhone}</p>
                      </td>
                      <td className="py-3 text-xs text-stone-500 font-mono">{inv.invoiceNumber}</td>
                      <td className="py-3 text-sm text-right font-semibold text-stone-800">{formatINR(due)}</td>
                      <td className="py-3 text-sm text-right">
                        {inv.daysOverdue > 0 ? (
                          <span className={`font-semibold ${isHighlighted ? "text-[#DC2626]" : "text-[#D97706]"}`}>{inv.daysOverdue}d</span>
                        ) : (
                          <span className="text-stone-400 text-xs">Due soon</span>
                        )}
                      </td>
                      <td className="pr-4 py-3 text-right">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-[#D97706] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Remind
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Historical Cash Flow (collapsible) ─── */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        <button
          onClick={() => setHistoryExpanded(!historyExpanded)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors"
        >
          <h2 className="font-semibold text-stone-800">Historical Cash Flow</h2>
          <div className="flex items-center gap-2 text-stone-400">
            <span className="text-sm">Last 7 days</span>
            {historyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {historyExpanded && (
          <div className="border-t border-stone-100 overflow-x-auto">
            {historyData.length === 0 ? (
              <p className="text-sm text-stone-500 text-center py-6">No historical data available</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="text-left pl-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Date</th>
                    <th className="text-right pr-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Opening</th>
                    <th className="text-right pr-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Inflows</th>
                    <th className="text-right pr-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Outflows</th>
                    <th className="text-right pr-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Closing</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((row) => (
                    <tr key={row.date} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                      <td className="pl-5 py-3 text-sm font-medium text-stone-700">{row.date}</td>
                      <td className="pr-5 py-3 text-sm text-right text-stone-500">{formatINR(row.opening)}</td>
                      <td className="pr-5 py-3 text-sm text-right font-medium text-[#059669]">{formatINR(row.inflows)}</td>
                      <td className="pr-5 py-3 text-sm text-right font-medium text-[#DC2626]">{formatINR(row.outflows)}</td>
                      <td className="pr-5 py-3 text-sm text-right font-bold text-stone-900">{formatINR(row.closing)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
