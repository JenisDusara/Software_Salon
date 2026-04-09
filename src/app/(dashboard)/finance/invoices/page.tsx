"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  MoreVertical,
  X,
  Eye,
  Trash2,
  CheckCircle,
  Share2,
  MessageCircle,
  ChevronDown,
  Printer,
  Filter,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  formatINR,
  formatDate,
  getInitials,
  getStatusColor,
  getAvatarColor,
  isOverdue,
  daysAgo,
} from "@/lib/utils";
type Invoice = {
  id: string; invoiceNumber: string; clientId: string | null; clientName: string; clientPhone: string;
  staffName: string;
  items: Array<{ description: string; quantity: number; rate: number; discount: number; cgst: number; sgst: number; total: number }>;
  subtotal: number; taxAmount: number; discount: number; tips: number;
  totalAmount: number; amountPaid: number; paymentMethod: string | null;
  status: string; date: string; dueDate: string | null;
};

const STATUS_CHIPS = ["All", "Paid", "Pending", "Overdue", "Draft"] as const;
type StatusChip = (typeof STATUS_CHIPS)[number];

const DATE_FILTERS = ["Today", "This Week", "This Month"] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

function paymentIcon(method: string | null) {
  if (!method) return null;
  if (method === "CASH") return "💵";
  if (method === "UPI") return "📱";
  if (method === "CARD") return "💳";
  if (method === "SPLIT") return "🔀";
  return "💰";
}

function paymentLabel(method: string | null) {
  if (!method) return "—";
  const map: Record<string, string> = {
    CASH: "Cash",
    UPI: "UPI",
    CARD: "Card",
    SPLIT: "Split",
    BANK: "Bank",
  };
  return map[method] ?? method;
}

function isToday(date: Date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isThisWeek(date: Date) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

function isThisMonth(date: Date) {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function ActionsMenu({
  invoice,
  onView,
  onMarkPaid,
  onDelete,
}: {
  invoice: Invoice;
  onView: () => void;
  onMarkPaid: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const whatsappMsg = `Hi ${invoice.clientName}! Your invoice ${invoice.invoiceNumber} for ${formatINR(invoice.totalAmount)} is ready. Thank you for visiting SalonSoft Pro! 🙏`;
  const waUrl = `https://wa.me/91${invoice.clientPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-lg hover:bg-[#F5F5F4] transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-[#78716C]" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-48 bg-white rounded-xl border border-[#E7E5E4] shadow-lg py-1 overflow-hidden">
          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#1C1917] hover:bg-[#FAFAF9] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onView();
            }}
          >
            <Eye className="w-4 h-4 text-[#78716C]" />
            View
          </button>
          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#1C1917] hover:bg-[#FAFAF9] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              toast.success("Download coming soon");
            }}
          >
            <Download className="w-4 h-4 text-[#78716C]" />
            Download PDF
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-[#1C1917] hover:bg-[#FAFAF9] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            Share WhatsApp
          </a>
          {invoice.status !== "PAID" && (
            <button
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onMarkPaid();
              }}
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Mark as Paid
            </button>
          )}
          <div className="border-t border-[#E7E5E4] my-1" />
          <button
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function InvoiceDetailPanel({
  invoice,
  onClose,
  onMarkPaid,
  onDelete,
}: {
  invoice: Invoice;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const whatsappMsg = `Hi ${invoice.clientName}! Your invoice ${invoice.invoiceNumber} for ${formatINR(invoice.totalAmount)} is ready. Thank you for visiting SalonSoft Pro! 🙏`;
  const waUrl = `https://wa.me/91${invoice.clientPhone}?text=${encodeURIComponent(whatsappMsg)}`;
  const initials = getInitials(invoice.clientName);
  const avatarColor = getAvatarColor(invoice.clientName);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-start justify-between p-5 border-b border-[#E7E5E4]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[#1C1917] text-base">
              {invoice.invoiceNumber}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}
            >
              {invoice.status}
            </span>
          </div>
          <p className="text-xs text-[#78716C]">{formatDate(invoice.date)}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[#F5F5F4] transition-colors"
        >
          <X className="w-4 h-4 text-[#78716C]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Salon info */}
        <div className="text-center pb-4 border-b border-dashed border-[#E7E5E4]">
          <div className="w-10 h-10 rounded-xl bg-[#1C1917] flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <p className="font-semibold text-[#1C1917] text-sm">SalonSoft Pro</p>
          <p className="text-xs text-[#78716C]">123, Linking Road, Bandra West, Mumbai</p>
          <p className="text-xs text-[#78716C]">GST: 27AABCS1681G1ZF</p>
        </div>

        {/* Client info */}
        <div className="flex items-center gap-3 p-3 bg-[#FAFAF9] rounded-lg">
          <div
            className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
          >
            {initials}
          </div>
          <div>
            <p className="font-medium text-[#1C1917] text-sm">{invoice.clientName}</p>
            <p className="text-xs text-[#78716C]">{invoice.clientPhone}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-[#78716C]">Staff</p>
            <p className="text-xs font-medium text-[#1C1917]">{invoice.staffName}</p>
          </div>
        </div>

        {/* Items table */}
        <div>
          <h4 className="text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-2">
            Services
          </h4>
          <div className="space-y-0 border border-[#E7E5E4] rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2 bg-[#F5F5F4] text-xs font-medium text-[#78716C]">
              <span>Description</span>
              <span className="text-right">Rate</span>
              <span className="text-right">Total</span>
            </div>
            {invoice.items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_auto_auto] gap-2 px-3 py-2.5 border-t border-[#E7E5E4] text-sm"
              >
                <span className="text-[#1C1917]">{item.description}</span>
                <span className="text-right text-[#78716C]">{formatINR(item.rate)}</span>
                <span className="text-right font-medium text-[#1C1917]">
                  {formatINR(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2 border-t border-dashed border-[#E7E5E4] pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#78716C]">Subtotal</span>
            <span className="text-[#1C1917]">{formatINR(invoice.subtotal)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#78716C]">Discount</span>
              <span className="text-red-600">- {formatINR(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[#78716C]">GST (18%)</span>
            <span className="text-[#1C1917]">{formatINR(invoice.taxAmount)}</span>
          </div>
          {invoice.tips > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[#78716C]">Tips</span>
              <span className="text-emerald-600">+ {formatINR(invoice.tips)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t border-[#E7E5E4] pt-2 mt-1">
            <span className="text-[#1C1917]">Total</span>
            <span className="text-[#1C1917]">{formatINR(invoice.totalAmount)}</span>
          </div>
          {invoice.amountPaid < invoice.totalAmount && (
            <div className="flex justify-between text-sm">
              <span className="text-[#78716C]">Amount Paid</span>
              <span className="text-emerald-600">{formatINR(invoice.amountPaid)}</span>
            </div>
          )}
          {invoice.amountPaid < invoice.totalAmount && (
            <div className="flex justify-between text-sm font-medium">
              <span className="text-amber-700">Balance Due</span>
              <span className="text-amber-700">
                {formatINR(invoice.totalAmount - invoice.amountPaid)}
              </span>
            </div>
          )}
        </div>

        {/* Payment info */}
        <div className="flex items-center justify-between p-3 bg-[#FAFAF9] rounded-lg">
          <span className="text-xs text-[#78716C]">Payment Method</span>
          <span className="text-sm font-medium text-[#1C1917] flex items-center gap-1.5">
            <span>{paymentIcon(invoice.paymentMethod)}</span>
            {paymentLabel(invoice.paymentMethod)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-[#E7E5E4] space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toast.success("Download coming soon")}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#E7E5E4] text-sm text-[#1C1917] hover:bg-[#F5F5F4] transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
        {invoice.status !== "PAID" && (
          <button
            onClick={() => onMarkPaid(invoice.id)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Mark as Paid
          </button>
        )}
        <button
          onClick={() => onDelete(invoice.id)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Invoice
        </button>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusChip>("All");
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilter | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data.map((inv: Invoice) => ({
          ...inv,
          status: inv.status === "PENDING" && isOverdue(inv.dueDate) ? "OVERDUE" : inv.status,
        })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Stats calculations
  const paidInvoices = invoices.filter((i) => i.status === "PAID");
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  const outstandingInvoices = invoices.filter(
    (i) => i.status === "PENDING" || i.status === "PARTIAL"
  );
  const outstandingAmount = outstandingInvoices.reduce(
    (sum, i) => sum + (i.totalAmount - i.amountPaid),
    0
  );

  const overdueInvoices = invoices.filter((i) => i.status === "OVERDUE");
  const overdueAmount = overdueInvoices.reduce(
    (sum, i) => sum + (i.totalAmount - i.amountPaid),
    0
  );

  const thisMonthInvoices = invoices.filter((i) => isThisMonth(new Date(i.date)));
  const invoiceCountThisMonth = thisMonthInvoices.length;

  // Filtering
  const filtered = invoices.filter((inv) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.clientName.toLowerCase().includes(q);

    const matchesStatus =
      activeStatus === "All" ||
      (activeStatus === "Paid" && inv.status === "PAID") ||
      (activeStatus === "Pending" && inv.status === "PENDING") ||
      (activeStatus === "Overdue" && inv.status === "OVERDUE") ||
      (activeStatus === "Draft" && inv.status === "DRAFT");

    const invDate = new Date(inv.date);
    const matchesDate =
      !activeDateFilter ||
      (activeDateFilter === "Today" && isToday(invDate)) ||
      (activeDateFilter === "This Week" && isThisWeek(invDate)) ||
      (activeDateFilter === "This Month" && isThisMonth(invDate));

    return matchesSearch && matchesStatus && matchesDate;
  });

  async function handleMarkPaid(id: string) {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return;
    try {
      await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID", amountPaid: inv.totalAmount, paymentMethod: inv.paymentMethod ?? "CASH" }),
      });
      setInvoices((prev) => prev.map((i) => i.id === id ? { ...i, status: "PAID", amountPaid: i.totalAmount } : i));
      if (selectedInvoice?.id === id) setSelectedInvoice((prev) => prev ? { ...prev, status: "PAID", amountPaid: prev.totalAmount } : null);
      toast.success("Invoice marked as paid");
    } catch { toast.error("Failed to update invoice"); }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
      toast.success("Invoice deleted");
    } catch { toast.error("Failed to delete invoice"); }
  }

  const stats = [
    {
      label: "Total Revenue",
      value: formatINR(totalRevenue),
      sub: `${paidInvoices.length} paid invoices`,
      icon: TrendingUp,
      iconClass: "text-emerald-600",
      bgClass: "bg-emerald-50",
    },
    {
      label: "Outstanding",
      value: formatINR(outstandingAmount),
      sub: `${outstandingInvoices.length} invoices pending`,
      icon: Clock,
      iconClass: "text-amber-600",
      bgClass: "bg-amber-50",
    },
    {
      label: "Overdue",
      value: formatINR(overdueAmount),
      sub: `${overdueInvoices.length} overdue invoices`,
      icon: AlertTriangle,
      iconClass: "text-red-600",
      bgClass: "bg-red-50",
    },
    {
      label: "This Month",
      value: String(invoiceCountThisMonth),
      sub: "invoices raised",
      icon: FileText,
      iconClass: "text-blue-600",
      bgClass: "bg-blue-50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Toaster position="top-right" />

      <div className={`flex gap-0 transition-all duration-300 ${selectedInvoice ? "pr-0" : ""}`}>
        {/* Main content */}
        <div className={`flex-1 min-w-0 transition-all duration-300 ${selectedInvoice ? "md:mr-[420px]" : ""}`}>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917]">Invoices</h1>
              <p className="text-sm text-[#78716C] mt-0.5">
                Manage and track all client invoices
              </p>
            </div>
            <a
              href="/finance/billing"
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-xs font-medium text-[#78716C] uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <div className={`p-2 rounded-lg ${stat.bgClass}`}>
                    <stat.icon className={`w-4 h-4 ${stat.iconClass}`} />
                  </div>
                </div>
                <p className="text-xl font-bold text-[#1C1917]">{stat.value}</p>
                <p className="text-xs text-[#78716C] mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Filters bar */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-4 mb-4">
            <div className="flex flex-col gap-3">
              {/* Row 1: Search + Export */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input
                    type="text"
                    placeholder="Search by invoice # or client name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-[#E7E5E4] rounded-lg bg-[#FAFAF9] focus:outline-none focus:ring-2 focus:ring-amber-400 text-[#1C1917] placeholder-[#A8A29E]"
                  />
                </div>
                <button
                  onClick={() => toast("Export coming soon", { icon: "📊" })}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#78716C] border border-[#E7E5E4] rounded-lg hover:bg-[#F5F5F4] transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  Excel
                </button>
                <button
                  onClick={() => toast("Export coming soon", { icon: "📄" })}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#78716C] border border-[#E7E5E4] rounded-lg hover:bg-[#F5F5F4] transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
              </div>

              {/* Row 2: Status chips + Date filters */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {STATUS_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setActiveStatus(chip)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        activeStatus === chip
                          ? "bg-[#1C1917] text-white border-[#1C1917]"
                          : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#A8A29E]"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  {DATE_FILTERS.map((df) => (
                    <button
                      key={df}
                      onClick={() =>
                        setActiveDateFilter(activeDateFilter === df ? null : df)
                      }
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        activeDateFilter === df
                          ? "bg-[#1C1917] text-white border-[#1C1917]"
                          : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#A8A29E]"
                      }`}
                    >
                      {df}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Result count */}
          <p className="text-xs text-[#78716C] mb-3 px-1">
            Showing {filtered.length} of {invoices.length} invoices
          </p>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7E5E4] bg-[#FAFAF9]">
                  <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                    Invoice #
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                    Client
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                    Services
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                    Payment
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-[#78716C] uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#78716C]">
                      No invoices found
                    </td>
                  </tr>
                )}
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9] cursor-pointer transition-colors"
                    onClick={() => setSelectedInvoice(inv as Invoice)}
                  >
                    {/* Invoice # */}
                    <td className="px-4 py-3.5">
                      <button
                        className="font-bold text-amber-600 hover:text-amber-700 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv as Invoice);
                        }}
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-[#78716C] whitespace-nowrap">
                      {formatDate(inv.date)}
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-full ${getAvatarColor(inv.clientName)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                        >
                          {getInitials(inv.clientName)}
                        </div>
                        <div>
                          <p className="font-medium text-[#1C1917] leading-tight">
                            {inv.clientName}
                          </p>
                          <p className="text-xs text-[#78716C]">{inv.clientPhone}</p>
                        </div>
                      </div>
                    </td>

                    {/* Services */}
                    <td className="px-4 py-3.5">
                      <span className="text-[#1C1917]">{inv.items[0].description}</span>
                      {inv.items.length > 1 && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-[#F5F5F4] text-[#78716C] text-xs">
                          +{inv.items.length - 1} more
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5 text-right">
                      <p className="font-bold text-[#1C1917]">
                        {formatINR(inv.totalAmount)}
                      </p>
                      <p className="text-xs text-[#78716C]">
                        Tax: {formatINR(inv.taxAmount)}
                      </p>
                    </td>

                    {/* Payment */}
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 text-[#78716C]">
                        <span>{paymentIcon(inv.paymentMethod)}</span>
                        <span>{paymentLabel(inv.paymentMethod)}</span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inv.status)}`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <ActionsMenu
                        invoice={inv as Invoice}
                        onView={() => setSelectedInvoice(inv as Invoice)}
                        onMarkPaid={() => handleMarkPaid(inv.id)}
                        onDelete={() => handleDelete(inv.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="block md:hidden space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-[#78716C] bg-white rounded-xl border border-[#E7E5E4]">
                No invoices found
              </div>
            )}
            {filtered.map((inv) => {
              const whatsappMsg = `Hi ${inv.clientName}! Your invoice ${inv.invoiceNumber} for ${formatINR(inv.totalAmount)} is ready. Thank you! 🙏`;
              const waUrl = `https://wa.me/91${inv.clientPhone}?text=${encodeURIComponent(whatsappMsg)}`;
              return (
                <div
                  key={inv.id}
                  className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-4"
                  onClick={() => setSelectedInvoice(inv as Invoice)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-amber-600 text-sm">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(inv.status)}`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-7 h-7 rounded-full ${getAvatarColor(inv.clientName)} flex items-center justify-center text-white text-xs font-semibold`}
                    >
                      {getInitials(inv.clientName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1C1917]">
                        {inv.clientName}
                      </p>
                      <p className="text-xs text-[#78716C]">
                        {inv.items[0].description}
                        {inv.items.length > 1 && ` +${inv.items.length - 1}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1C1917]">
                      {formatINR(inv.totalAmount)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#78716C]">
                        {formatDate(inv.date)}
                      </span>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel — slide in from right */}
        <div
          className={`fixed top-0 right-0 h-full z-40 bg-white border-l border-[#E7E5E4] shadow-2xl transition-transform duration-300 ease-in-out
            w-full md:w-[420px]
            ${selectedInvoice ? "translate-x-0" : "translate-x-full"}`}
        >
          {selectedInvoice && (
            <InvoiceDetailPanel
              invoice={selectedInvoice}
              onClose={() => setSelectedInvoice(null)}
              onMarkPaid={handleMarkPaid}
              onDelete={handleDelete}
            />
          )}
        </div>

        {/* Overlay for mobile */}
        {selectedInvoice && (
          <div
            className="fixed inset-0 bg-black/20 z-30 md:hidden"
            onClick={() => setSelectedInvoice(null)}
          />
        )}
      </div>
    </div>
  );
}
