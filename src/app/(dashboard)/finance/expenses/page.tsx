"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  TrendingDown,
  Trophy,
  ArrowDownUp,
  Plus,
  Download,
  ChevronDown,
  ChevronUp,
  LayoutList,
  Grid3X3,
  Pencil,
  Trash2,
  RefreshCcw,
  PauseCircle,
  PlayCircle,
  X,
  Check,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatINR, formatDate } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "@/data/sampleData";

type Expense = {
  id: string;
  categoryId: string;
  categoryName: string;
  description: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  vendorName: string | null;
  isRecurring: boolean;
  recurringFreq: string | null;
};

const PAYMENT_METHODS = ["Cash", "Bank", "Card", "UPI"];
const FREQUENCIES = ["Monthly", "Weekly", "Yearly"];

const PIE_COLORS = [
  "#EF4444", "#8B5CF6", "#3B82F6", "#EAB308",
  "#EC4899", "#6B7280", "#14B8A6", "#F97316",
  "#6366F1", "#06B6D4", "#22C55E", "#94A3B8",
];

function isThisMonth(date: Date) {
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function nextDueDate(freq: string | null): string {
  if (!freq) return "—";
  const now = new Date();
  if (freq === "MONTHLY") {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return formatDate(next);
  }
  if (freq === "WEEKLY") {
    const next = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return formatDate(next);
  }
  if (freq === "YEARLY") {
    const next = new Date(now.getFullYear() + 1, now.getMonth(), 1);
    return formatDate(next);
  }
  return "—";
}

interface EditExpenseModalProps {
  expense: Expense;
  onSave: (updated: Expense) => void;
  onClose: () => void;
}

function EditExpenseModal({ expense, onSave, onClose }: EditExpenseModalProps) {
  const [form, setForm] = useState({ ...expense });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === form.categoryId);
    onSave({ ...form, categoryName: cat?.name ?? form.categoryName });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl border border-[#E7E5E4] shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[#1C1917] text-base">Edit Expense</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F5F5F4] transition-colors"
          >
            <X className="w-4 h-4 text-[#78716C]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#78716C] mb-1">
                Date
              </label>
              <input
                type="date"
                value={
                  form.date instanceof Date
                    ? form.date.toISOString().slice(0, 10)
                    : String(form.date).slice(0, 10)
                }
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: new Date(e.target.value) }))
                }
                className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#78716C] mb-1">
                Category
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9]"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#78716C] mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9]"
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#78716C] mb-1">
                Payment
              </label>
              <select
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentMethod: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m.toUpperCase()}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1">
              Vendor (optional)
            </label>
            <input
              type="text"
              value={form.vendorName ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  vendorName: e.target.value || null,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9]"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#E7E5E4] rounded-xl text-sm text-[#78716C] hover:bg-[#F5F5F4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E7E5E4] rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="font-medium text-[#1C1917]">{payload[0].name}</p>
        <p className="text-[#78716C]">{formatINR(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [recurringOpen, setRecurringOpen] = useState(true);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      if (Array.isArray(data)) {
        setExpenses(data.map((e) => ({
          ...e,
          categoryName: EXPENSE_CATEGORIES.find((c) => c.id === e.categoryId)?.name ?? e.categoryName ?? e.categoryId,
          date: new Date(e.date),
        })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  const [pausedRecurring, setPausedRecurring] = useState<Set<string>>(new Set());
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Quick add form state
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0].id);
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [formVendor, setFormVendor] = useState("");
  const [formPayment, setFormPayment] = useState("CASH");
  const [formRecurring, setFormRecurring] = useState(false);
  const [formFrequency, setFormFrequency] = useState("MONTHLY");
  const [formNotes, setFormNotes] = useState("");

  // Stats
  const thisMonthExpenses = expenses.filter((e) => isThisMonth(new Date(e.date)));
  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);

  // Largest category
  const categoryTotals = useMemo(() => {
    const map: Record<string, { name: string; amount: number; icon: string; color: string }> = {};
    expenses.forEach((exp) => {
      if (!map[exp.categoryId]) {
        const cat = EXPENSE_CATEGORIES.find((c) => c.id === exp.categoryId);
        map[exp.categoryId] = {
          name: exp.categoryName,
          amount: 0,
          icon: cat?.icon ?? "💰",
          color: cat?.color ?? "bg-slate-100 text-slate-700",
        };
      }
      map[exp.categoryId].amount += exp.amount;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const largestCategory = categoryTotals[0] ?? { name: "—", amount: 0 };
  const totalAll = expenses.reduce((s, e) => s + e.amount, 0);

  // Pie chart data
  const pieData = categoryTotals.map((c, idx) => ({
    name: c.name,
    value: c.amount,
    color: PIE_COLORS[idx % PIE_COLORS.length],
    icon: c.icon,
    colorClass: c.color,
  }));

  const recurringExpenses = expenses.filter((e) => e.isRecurring);

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!formDescription.trim()) { toast.error("Enter a description"); return; }
    const amt = parseFloat(formAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === formCategory);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: formCategory,
          categoryName: cat?.name ?? formCategory,
          description: formDescription.trim(),
          amount: amt,
          date: formDate,
          paymentMethod: formPayment,
          vendorName: formVendor.trim() || null,
          isRecurring: formRecurring,
          recurringFreq: formRecurring ? formFrequency : null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchExpenses();
      toast.success("Expense added successfully");
      setFormDescription(""); setFormAmount(""); setFormVendor(""); setFormNotes("");
      setFormRecurring(false); setAdvancedOpen(false);
    } catch { toast.error("Failed to add expense"); }
  }

  async function handleDeleteExpense(id: string) {
    try {
      await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Expense deleted");
    } catch { toast.error("Failed to delete expense"); }
  }

  async function handleSaveEdit(updated: Expense) {
    const cat = EXPENSE_CATEGORIES.find((c) => c.id === updated.categoryId);
    try {
      await fetch(`/api/expenses/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updated,
          categoryName: cat?.name ?? updated.categoryName,
          date: updated.date instanceof Date ? updated.date.toISOString() : updated.date,
        }),
      });
      await fetchExpenses();
      setEditingExpense(null);
      toast.success("Expense updated");
    } catch { toast.error("Failed to update expense"); }
  }

  function togglePause(id: string) {
    setPausedRecurring((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success("Recurring expense resumed");
      } else {
        next.add(id);
        toast.success("Recurring expense paused");
      }
      return next;
    });
  }

  const LAST_MONTH_TOTAL = 275550; // demo value

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Toaster position="top-right" />
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onSave={handleSaveEdit}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]">Expenses</h1>
          <p className="text-sm text-[#78716C] mt-0.5">
            Track and manage all business expenses
          </p>
        </div>
        <button
          onClick={() => toast("Export coming soon", { icon: "📊" })}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#E7E5E4] bg-white hover:bg-[#F5F5F4] text-[#1C1917] text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total this month */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide">
              Total Expenses
            </p>
            <div className="p-2 rounded-lg bg-red-50">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-[#1C1917]">{formatINR(totalThisMonth)}</p>
          <p className="text-xs text-[#78716C] mt-1">This month</p>
        </div>

        {/* Largest category */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide">
              Largest Category
            </p>
            <div className="p-2 rounded-lg bg-purple-50">
              <Trophy className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-[#1C1917]">
            {formatINR(largestCategory.amount)}
          </p>
          <p className="text-xs text-[#78716C] mt-1">{largestCategory.name}</p>
        </div>

        {/* vs last month */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide">
              vs Last Month
            </p>
            <div className="p-2 rounded-lg bg-amber-50">
              <ArrowDownUp className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-600">
            {totalThisMonth > LAST_MONTH_TOTAL ? "+" : ""}
            {(((totalThisMonth - LAST_MONTH_TOTAL) / LAST_MONTH_TOTAL) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-[#78716C] mt-1">
            Last month: {formatINR(LAST_MONTH_TOTAL)}
          </p>
        </div>
      </div>

      {/* Quick Add Expense */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-[#1C1917] text-base mb-4">Add Expense</h2>
        <form onSubmit={handleAddExpense}>
          {/* Main row */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="px-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9] text-[#1C1917] sm:w-40"
            />
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="px-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9] text-[#1C1917] sm:w-52"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9] text-[#1C1917] placeholder-[#A8A29E]"
              required
            />
            <div className="relative sm:w-36">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#78716C] font-medium">
                ₹
              </span>
              <input
                type="number"
                placeholder="Amount"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                min={1}
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9] text-[#1C1917] placeholder-[#A8A29E]"
                required
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className="flex items-center gap-1.5 text-xs text-[#78716C] hover:text-[#1C1917] transition-colors mb-2"
          >
            {advancedOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            Advanced options
          </button>

          {advancedOpen && (
            <div className="pt-3 border-t border-[#E7E5E4] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Vendor / Supplier name"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  className="px-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9] text-[#1C1917] placeholder-[#A8A29E]"
                />
                <select
                  value={formPayment}
                  onChange={(e) => setFormPayment(e.target.value)}
                  className="px-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9] text-[#1C1917]"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m.toUpperCase()}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setFormRecurring(!formRecurring)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                        formRecurring
                          ? "bg-amber-500 border-amber-500"
                          : "border-[#E7E5E4]"
                      }`}
                    >
                      {formRecurring && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-[#78716C]">Recurring</span>
                  </label>
                  {formRecurring && (
                    <select
                      value={formFrequency}
                      onChange={(e) => setFormFrequency(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9] text-[#1C1917]"
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f.toUpperCase()}>
                          {f}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-[#FAFAF9] text-[#1C1917] placeholder-[#A8A29E] resize-none"
              />
            </div>
          )}
        </form>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* Left: Expense list (60%) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E4]">
              <h2 className="font-semibold text-[#1C1917] text-sm">
                All Expenses
                <span className="ml-2 px-2 py-0.5 rounded-full bg-[#F5F5F4] text-[#78716C] text-xs font-medium">
                  {expenses.length}
                </span>
              </h2>
              <div className="flex items-center gap-1 border border-[#E7E5E4] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-[#1C1917] text-white"
                      : "text-[#78716C] hover:bg-[#F5F5F4]"
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === "card"
                      ? "bg-[#1C1917] text-white"
                      : "text-[#78716C] hover:bg-[#F5F5F4]"
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table view */}
            {viewMode === "table" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E7E5E4] bg-[#FAFAF9]">
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                        Category
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                        Description
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide hidden sm:table-cell">
                        Vendor
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide hidden md:table-cell">
                        Payment
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-10 text-[#78716C]"
                        >
                          No expenses yet
                        </td>
                      </tr>
                    )}
                    {expenses.map((exp) => {
                      const cat = EXPENSE_CATEGORIES.find(
                        (c) => c.id === exp.categoryId
                      );
                      return (
                        <tr
                          key={exp.id}
                          className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors"
                        >
                          <td className="px-4 py-3 text-[#78716C] whitespace-nowrap text-xs">
                            {formatDate(exp.date)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cat?.color ?? "bg-slate-100 text-slate-700"}`}
                            >
                              <span>{cat?.icon}</span>
                              <span className="hidden sm:inline">{exp.categoryName}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#1C1917] max-w-[140px]">
                            <p className="truncate text-sm">{exp.description}</p>
                            {exp.isRecurring && (
                              <span className="text-xs text-blue-600 flex items-center gap-0.5">
                                <RefreshCcw className="w-3 h-3" />
                                {exp.recurringFreq}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#78716C] text-sm hidden sm:table-cell max-w-[100px]">
                            <span className="truncate block">{exp.vendorName ?? "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#1C1917]">
                            {formatINR(exp.amount)}
                          </td>
                          <td className="px-4 py-3 text-[#78716C] text-xs hidden md:table-cell">
                            {exp.paymentMethod}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingExpense(exp)}
                                className="p-1.5 rounded-lg hover:bg-[#F5F5F4] transition-colors text-[#78716C] hover:text-[#1C1917]"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-[#78716C] hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Card view */}
            {viewMode === "card" && (
              <div className="p-4 space-y-2.5">
                {expenses.length === 0 && (
                  <p className="text-center py-8 text-[#78716C] text-sm">
                    No expenses yet
                  </p>
                )}
                {expenses.map((exp) => {
                  const cat = EXPENSE_CATEGORIES.find((c) => c.id === exp.categoryId);
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center gap-3 p-3 bg-[#FAFAF9] rounded-lg border border-[#E7E5E4] hover:border-[#A8A29E] transition-colors"
                    >
                      <span className="text-xl">{cat?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${cat?.color ?? "bg-slate-100 text-slate-700"}`}
                          >
                            {exp.categoryName}
                          </span>
                          {exp.isRecurring && (
                            <RefreshCcw className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        <p className="text-sm text-[#1C1917] font-medium truncate">
                          {exp.description}
                        </p>
                        <p className="text-xs text-[#78716C]">
                          {exp.vendorName && `${exp.vendorName} · `}
                          {formatDate(exp.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#1C1917] text-sm">
                          {formatINR(exp.amount)}
                        </p>
                        <p className="text-xs text-[#78716C]">{exp.paymentMethod}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1 rounded hover:bg-white transition-colors text-[#78716C]"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 rounded hover:bg-red-50 transition-colors text-[#78716C] hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Category breakdown (40%) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
            <h2 className="font-semibold text-[#1C1917] text-sm mb-5">
              By Category
            </h2>

            {/* Donut chart */}
            <div className="relative flex items-center justify-center mb-5" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-xs text-[#78716C]">Total</p>
                <p className="font-bold text-[#1C1917] text-base">
                  {formatINR(totalAll)}
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5">
              {categoryTotals.map((cat, idx) => {
                const pct = totalAll > 0 ? ((cat.amount / totalAll) * 100).toFixed(1) : "0";
                return (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-xs flex-1 text-[#78716C] truncate">
                      {cat.icon} {cat.name}
                    </span>
                    <span className="text-xs font-medium text-[#1C1917]">
                      {formatINR(cat.amount)}
                    </span>
                    <span className="text-xs text-[#A8A29E] w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recurring Expenses section */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        <button
          onClick={() => setRecurringOpen(!recurringOpen)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAFAF9] transition-colors"
        >
          <div className="flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-[#1C1917] text-sm">
              Recurring Expenses
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
              {recurringExpenses.length}
            </span>
          </div>
          {recurringOpen ? (
            <ChevronUp className="w-4 h-4 text-[#78716C]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#78716C]" />
          )}
        </button>

        {recurringOpen && (
          <div className="border-t border-[#E7E5E4]">
            {recurringExpenses.length === 0 ? (
              <p className="text-center py-8 text-[#78716C] text-sm">
                No recurring expenses set up
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E7E5E4] bg-[#FAFAF9]">
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                        Category
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                        Description
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                        Frequency
                      </th>
                      <th className="text-right px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                        Amount
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide hidden sm:table-cell">
                        Next Due
                      </th>
                      <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringExpenses.map((exp) => {
                      const cat = EXPENSE_CATEGORIES.find(
                        (c) => c.id === exp.categoryId
                      );
                      const isPaused = pausedRecurring.has(exp.id);
                      return (
                        <tr
                          key={exp.id}
                          className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cat?.color ?? "bg-slate-100 text-slate-700"}`}
                            >
                              <span>{cat?.icon}</span>
                              <span className="hidden sm:inline">{exp.categoryName}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[#1C1917] text-sm">
                            {exp.description}
                          </td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-xs text-blue-600">
                              <RefreshCcw className="w-3 h-3" />
                              {exp.recurringFreq}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#1C1917]">
                            {formatINR(exp.amount)}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#78716C] hidden sm:table-cell">
                            {isPaused ? "—" : nextDueDate(exp.recurringFreq)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                isPaused
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {isPaused ? "Paused" : "Active"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => togglePause(exp.id)}
                                className="p-1.5 rounded-lg hover:bg-[#F5F5F4] transition-colors text-[#78716C] hover:text-amber-600"
                                title={isPaused ? "Resume" : "Pause"}
                              >
                                {isPaused ? (
                                  <PlayCircle className="w-4 h-4" />
                                ) : (
                                  <PauseCircle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingExpense(exp)}
                                className="p-1.5 rounded-lg hover:bg-[#F5F5F4] transition-colors text-[#78716C]"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
