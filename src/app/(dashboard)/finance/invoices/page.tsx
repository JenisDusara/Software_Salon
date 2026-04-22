"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Plus, TrendingUp, Clock, AlertTriangle, FileText,
  Download, MoreVertical, X, Eye, Trash2, CheckCircle,
  Share2, MessageCircle, ChevronDown, Printer, Filter, UserPlus, UserCheck,
  Users, Footprints,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Invoice PDF generator ─────────────────────────────────────────────────────
function openInvoicePDF(inv: Invoice) {
  const fmt = (n: number) =>
    `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const rows = inv.items
    .map(
      (it) => `
    <tr>
      <td style="padding:7px 6px;border-bottom:1px solid #f5f5f4;font-size:12px">${it.description}</td>
      <td style="padding:7px 6px;border-bottom:1px solid #f5f5f4;text-align:center;font-size:12px">${it.quantity}</td>
      <td style="padding:7px 6px;border-bottom:1px solid #f5f5f4;text-align:right;font-size:12px">${fmt(it.rate)}</td>
      <td style="padding:7px 6px;border-bottom:1px solid #f5f5f4;text-align:right;font-size:12px;color:#ef4444">${it.discount > 0 ? `-${fmt(it.discount)}` : "—"}</td>
      <td style="padding:7px 6px;border-bottom:1px solid #f5f5f4;text-align:right;font-size:12px">${fmt(it.cgst)}</td>
      <td style="padding:7px 6px;border-bottom:1px solid #f5f5f4;text-align:right;font-size:12px">${fmt(it.sgst)}</td>
      <td style="padding:7px 6px;border-bottom:1px solid #f5f5f4;text-align:right;font-weight:600;font-size:12px">${fmt(it.total)}</td>
    </tr>`
    )
    .join("");

  const row = (label: string, value: string, color = "#44403c", bold = false) =>
    `<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;color:${color};${bold ? "font-weight:700" : ""}">
      <span>${label}</span><span>${value}</span>
    </div>`;

  const payMap: Record<string, string> = { CASH: "Cash", UPI: "UPI", CARD: "Card", SPLIT: "Split", BANK: "Bank Transfer" };
  const payLabel = inv.paymentMethod ? (payMap[inv.paymentMethod] ?? inv.paymentMethod) : "—";
  const invDate = new Date(inv.date);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${inv.invoiceNumber}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1c1917;background:#f5f5f4;min-height:100vh}
    .topbar{background:#1c1917;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10}
    .topbar-left{display:flex;align-items:center;gap:10px}
    .topbar-logo{width:32px;height:32px;background:#d97706;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:white}
    .topbar-title{color:#e7e5e4;font-size:14px;font-weight:600}
    .topbar-sub{color:#78716c;font-size:11px;margin-top:1px}
    .dl-btn{background:#d97706;color:white;border:none;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:7px;transition:background .15s}
    .dl-btn:hover{background:#b45309}
    .dl-btn svg{width:15px;height:15px}
    .card{max-width:680px;margin:24px auto;background:white;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);padding:28px;margin-bottom:40px}
    @media print{.topbar{display:none!important}.card{margin:0;border-radius:0;box-shadow:none;padding:20px}@page{margin:12px}}
  </style>
  </head><body>

  <!-- Download bar (hidden on print) -->
  <div class="topbar">
    <div class="topbar-left">
      <div class="topbar-logo">S</div>
      <div>
        <div class="topbar-title">SalonSoft Pro — ${inv.invoiceNumber}</div>
        <div class="topbar-sub">${invDate.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
      </div>
    </div>
    <button class="dl-btn" onclick="window.print()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Download / Print
    </button>
  </div>
  <div class="card">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #1c1917;padding-bottom:14px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:40px;height:40px;background:#1c1917;border-radius:10px;display:flex;align-items:center;justify-content:center">
          <span style="color:white;font-weight:800;font-size:18px">S</span>
        </div>
        <div>
          <div style="font-size:16px;font-weight:700">SalonSoft Pro</div>
          <div style="font-size:11px;color:#78716c">GST Tax Invoice</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:18px;font-weight:800;color:#d97706">${inv.invoiceNumber}</div>
        <div style="font-size:11px;color:#78716c;margin-top:2px">
          ${invDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </div>
        <div style="margin-top:4px;display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;
          background:${inv.status === "PAID" ? "#d1fae5" : "#fef3c7"};
          color:${inv.status === "PAID" ? "#065f46" : "#92400e"}">
          ${inv.status}
        </div>
      </div>
    </div>

    <!-- Bill To & Staff -->
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;gap:16px">
      <div style="flex:1;background:#fafaf9;border-radius:8px;padding:12px">
        <div style="font-size:10px;font-weight:600;color:#78716c;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Bill To</div>
        <div style="font-size:14px;font-weight:700">${inv.clientName}</div>
        ${inv.clientPhone ? `<div style="font-size:12px;color:#78716c;margin-top:2px">${inv.clientPhone}</div>` : ""}
        <div style="margin-top:4px">
          <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;
            background:${inv.isWalkIn ? "#fef3c7" : "#d1fae5"};
            color:${inv.isWalkIn ? "#92400e" : "#065f46"}">
            ${inv.isWalkIn ? "Walk-in" : "Registered Client"}
          </span>
        </div>
      </div>
      ${inv.staffName ? `
      <div style="background:#fafaf9;border-radius:8px;padding:12px;min-width:140px;text-align:right">
        <div style="font-size:10px;font-weight:600;color:#78716c;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Served By</div>
        <div style="font-size:14px;font-weight:700">${inv.staffName}</div>
      </div>` : ""}
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr style="background:#1c1917">
          <th style="text-align:left;padding:8px 6px;font-size:11px;color:#e7e5e4;font-weight:600">Service / Item</th>
          <th style="text-align:center;padding:8px 6px;font-size:11px;color:#e7e5e4;font-weight:600">Qty</th>
          <th style="text-align:right;padding:8px 6px;font-size:11px;color:#e7e5e4;font-weight:600">Rate</th>
          <th style="text-align:right;padding:8px 6px;font-size:11px;color:#e7e5e4;font-weight:600">Disc</th>
          <th style="text-align:right;padding:8px 6px;font-size:11px;color:#e7e5e4;font-weight:600">CGST</th>
          <th style="text-align:right;padding:8px 6px;font-size:11px;color:#e7e5e4;font-weight:600">SGST</th>
          <th style="text-align:right;padding:8px 6px;font-size:11px;color:#e7e5e4;font-weight:600">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- Totals -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <div style="min-width:260px">
        ${row("Subtotal", fmt(inv.subtotal))}
        ${inv.discount > 0 ? row("Discount", `-${fmt(inv.discount)}`, "#ef4444") : ""}
        ${row("Total GST (18%)", fmt(inv.taxAmount), "#78716c")}
        ${inv.tips > 0 ? row("Tips", `+${fmt(inv.tips)}`, "#059669") : ""}
        <div style="display:flex;justify-content:space-between;border-top:2px solid #1c1917;margin-top:6px;padding-top:8px;font-size:16px;font-weight:800">
          <span>Grand Total</span><span style="color:#d97706">${fmt(inv.totalAmount)}</span>
        </div>
        ${inv.amountPaid < inv.totalAmount ? row("Amount Paid", fmt(inv.amountPaid), "#059669") : ""}
        ${inv.amountPaid < inv.totalAmount ? row("Balance Due", fmt(inv.totalAmount - inv.amountPaid), "#d97706", true) : ""}
      </div>
    </div>

    <!-- Payment & Footer -->
    <div style="border-top:1px dashed #e7e5e4;padding-top:12px;display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:12px;color:#78716c">
        Payment: <strong style="color:#1c1917">${payLabel}</strong>
      </div>
      <div style="text-align:center">
        <span style="display:inline-block;background:#1c1917;color:white;padding:4px 16px;border-radius:99px;font-size:11px;font-weight:600">
          ${inv.status === "PAID" ? "✓ PAID" : inv.status}
        </span>
        <div style="color:#78716c;font-size:11px;margin-top:6px">Thank you for visiting! ✂️</div>
      </div>
    </div>

  </div>
  </body></html>`;

  const win = window.open("", "_blank", "width=780,height=900");
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    toast.error("Pop-up blocked — please allow pop-ups for this site");
  }
}
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
  isWalkIn: boolean; // true = walk-in, false = registered client
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

const CLIENT_TYPE_FILTERS = ["All", "Walk-in", "Registered"] as const;
type ClientTypeFilter = (typeof CLIENT_TYPE_FILTERS)[number];

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
  onPDF,
  onMarkPaid,
  onDelete,
}: {
  invoice: Invoice;
  onView: () => void;
  onPDF: () => void;
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
              onPDF();
            }}
          >
            <Download className="w-4 h-4 text-[#78716C]" />
            Open PDF
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
  onRegisterClient,
  onPDF,
}: {
  invoice: Invoice;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
  onRegisterClient: (invoice: Invoice) => void;
  onPDF: () => void;
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
        </div>

        {/* Client info */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-[#FAFAF9] rounded-lg">
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold text-sm`}>
                {initials}
              </div>
              {/* Walk-in / Client indicator dot */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${invoice.isWalkIn ? "bg-amber-400" : "bg-emerald-500"}`}>
                {invoice.isWalkIn
                  ? <span className="text-white text-[7px] font-bold">W</span>
                  : <span className="text-white text-[7px] font-bold">✓</span>}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-medium text-[#1C1917] text-sm">{invoice.clientName}</p>
                {invoice.isWalkIn
                  ? <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 border border-amber-200">Walk-in</span>
                  : <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200"><UserCheck className="w-2.5 h-2.5" />Registered</span>
                }
              </div>
              <p className="text-xs text-[#78716C]">{invoice.clientPhone || "No phone"}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-[#78716C]">Staff</p>
              <p className="text-xs font-medium text-[#1C1917]">{invoice.staffName || "—"}</p>
            </div>
          </div>
          {/* Register walk-in as client */}
          {invoice.isWalkIn && (
            <button
              onClick={() => onRegisterClient(invoice)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register as Permanent Client
            </button>
          )}
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
            onClick={onPDF}
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

function RegisterClientModal({
  invoice,
  onClose,
  onSave,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSave: (invoice: Invoice, name: string, phone: string, email: string) => Promise<void>;
}) {
  const [name, setName] = useState(invoice.clientName ?? "");
  const [phone, setPhone] = useState(invoice.clientPhone ?? "");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [phoneDupe, setPhoneDupe] = useState<string | null>(null);

  useEffect(() => {
    if (!/^\d{10}$/.test(phone)) { setPhoneDupe(null); return; }
    const t = setTimeout(() => {
      fetch(`/api/clients?search=${encodeURIComponent(phone)}`)
        .then((r) => r.json())
        .then((data) => {
          const match = Array.isArray(data) ? data.find((c: any) => c.phone === phone) ?? null : null;
          setPhoneDupe(match ? match.name : null);
        });
    }, 400);
    return () => clearTimeout(t);
  }, [phone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!/^\d{10}$/.test(phone)) { toast.error("Phone must be exactly 10 digits"); return; }
    if (phoneDupe) { toast.error(`${phone} is already registered to ${phoneDupe}`); return; }
    setSaving(true);
    await onSave(invoice, name.trim(), phone, email.trim());
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserPlus className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1C1917] text-sm">Register as Permanent Client</h3>
              <p className="text-xs text-[#78716C]">From walk-in invoice {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F5F5F4] transition-colors">
            <X className="w-4 h-4 text-[#78716C]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client full name"
              className="w-full px-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">Phone Number * (10 digits)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile number"
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-[#1C1917] ${phoneDupe ? "border-red-400 bg-red-50" : "border-[#E7E5E4]"}`}
            />
            {phoneDupe && (
              <p className="text-xs text-red-600 mt-1">{phone} is already registered to <strong>{phoneDupe}</strong></p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-[#78716C] mb-1.5">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full px-3 py-2.5 text-sm border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-[#1C1917]"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm border border-[#E7E5E4] rounded-lg text-[#78716C] hover:bg-[#F5F5F4] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !!phoneDupe}
              className="flex-1 px-4 py-2.5 text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
            >
              {saving ? "Registering..." : "Register Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusChip>("All");
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilter | null>(null);
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientTypeFilter>("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [registeringInvoice, setRegisteringInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (Array.isArray(data)) {
        setInvoices(data.map((inv: any) => ({
          ...inv,
          isWalkIn: !inv.clientId,
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

  // Walk-in vs Registered breakdown
  const walkInInvoices = invoices.filter((i) => i.isWalkIn);
  const registeredInvoices = invoices.filter((i) => !i.isWalkIn);
  const walkInPct = invoices.length > 0 ? Math.round((walkInInvoices.length / invoices.length) * 100) : 0;
  const registeredPct = 100 - walkInPct;

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

    const matchesClientType =
      clientTypeFilter === "All" ||
      (clientTypeFilter === "Walk-in" && inv.isWalkIn) ||
      (clientTypeFilter === "Registered" && !inv.isWalkIn);

    return matchesSearch && matchesStatus && matchesDate && matchesClientType;
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

  async function handleSaveRegistration(invoice: Invoice, name: string, phone: string, email: string) {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email: email || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to register client"); return; }
      // Mark invoice as linked to new client locally
      setInvoices((prev) => prev.map((inv) =>
        inv.id === invoice.id ? { ...inv, isWalkIn: false, clientId: data.id, clientName: name, clientPhone: phone } : inv
      ));
      if (selectedInvoice?.id === invoice.id) {
        setSelectedInvoice((prev) => prev ? { ...prev, isWalkIn: false, clientId: data.id, clientName: name, clientPhone: phone } : null);
      }
      setRegisteringInvoice(null);
      toast.success(`${name} registered as a permanent client`);
    } catch { toast.error("Failed to register client"); }
  }

  const topStats = [
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {topStats.map((stat) => (
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

          {/* Walk-in vs Registered breakdown card */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C1917]">Walk-in vs Registered Clients</p>
                  <p className="text-xs text-[#78716C]">Based on {invoices.length} total invoices</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-xs text-[#78716C]">Walk-in</p>
                  <p className="text-lg font-bold text-amber-600">{walkInInvoices.length}</p>
                </div>
                <div className="w-px h-8 bg-[#E7E5E4]" />
                <div>
                  <p className="text-xs text-[#78716C]">Registered</p>
                  <p className="text-lg font-bold text-emerald-600">{registeredInvoices.length}</p>
                </div>
              </div>
            </div>

            {/* Split bar */}
            {invoices.length > 0 ? (
              <div>
                <div className="flex rounded-full overflow-hidden h-3 mb-2">
                  <div
                    className="bg-amber-400 transition-all duration-500"
                    style={{ width: `${walkInPct}%` }}
                    title={`Walk-in: ${walkInPct}%`}
                  />
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${registeredPct}%` }}
                    title={`Registered: ${registeredPct}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[#78716C]">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                      Walk-in — <strong className="text-[#1C1917]">{walkInPct}%</strong>
                      <button
                        onClick={() => setClientTypeFilter(clientTypeFilter === "Walk-in" ? "All" : "Walk-in")}
                        className={`ml-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold transition ${clientTypeFilter === "Walk-in" ? "bg-amber-100 border-amber-300 text-amber-700" : "border-[#E7E5E4] text-[#78716C] hover:border-amber-300"}`}
                      >
                        {clientTypeFilter === "Walk-in" ? "Filtered ✓" : "Filter"}
                      </button>
                    </span>
                    <span className="flex items-center gap-1.5 text-[#78716C]">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Registered — <strong className="text-[#1C1917]">{registeredPct}%</strong>
                      <button
                        onClick={() => setClientTypeFilter(clientTypeFilter === "Registered" ? "All" : "Registered")}
                        className={`ml-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold transition ${clientTypeFilter === "Registered" ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "border-[#E7E5E4] text-[#78716C] hover:border-emerald-300"}`}
                      >
                        {clientTypeFilter === "Registered" ? "Filtered ✓" : "Filter"}
                      </button>
                    </span>
                  </div>
                  {walkInPct > 60 && (
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      Tip: {walkInPct}% walk-ins — consider loyalty program
                    </span>
                  )}
                  {registeredPct > 60 && (
                    <span className="text-emerald-600 font-semibold">
                      {registeredPct}% are returning clients
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#78716C] text-center py-2">No invoice data yet</p>
            )}
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

              {/* Row 3: Client type filter */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#F5F5F4]">
                <span className="text-xs text-[#78716C] font-medium shrink-0">Client Type:</span>
                <div className="flex items-center gap-1.5">
                  {CLIENT_TYPE_FILTERS.map((f) => {
                    const count = f === "Walk-in" ? walkInInvoices.length : f === "Registered" ? registeredInvoices.length : invoices.length;
                    const activeStyle = f === "Walk-in"
                      ? "bg-amber-500 text-white border-amber-500"
                      : f === "Registered"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-[#1C1917] text-white border-[#1C1917]";
                    return (
                      <button
                        key={f}
                        onClick={() => setClientTypeFilter(f)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          clientTypeFilter === f
                            ? activeStyle
                            : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#A8A29E]"
                        }`}
                      >
                        {f === "Walk-in" && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
                        {f === "Registered" && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
                        {f}
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${clientTypeFilter === f ? "bg-white/20" : "bg-[#F5F5F4] text-[#78716C]"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Result count */}
          <p className="text-xs text-[#78716C] mb-3 px-1 flex items-center gap-2">
            <span>Showing {filtered.length} of {invoices.length} invoices</span>
            {clientTypeFilter !== "All" && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${clientTypeFilter === "Walk-in" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                {clientTypeFilter === "Walk-in" ? "🚶 Walk-in only" : "✓ Registered only"}
                <button onClick={() => setClientTypeFilter("All")} className="ml-0.5 hover:opacity-70">×</button>
              </span>
            )}
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
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-[#1C1917] leading-tight">{inv.clientName}</p>
                            {inv.isWalkIn
                              ? <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Walk-in</span>
                              : <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Client</span>
                            }
                          </div>
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
                      <div className="flex items-center gap-1.5 justify-end">
                        {/* Receipt sticker */}
                        <button
                          onClick={() => openInvoicePDF(inv as Invoice)}
                          title="Open Invoice PDF"
                          className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 shadow-sm flex items-center justify-center hover:bg-amber-100 hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
                        >
                          <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                          </svg>
                        </button>
                        <ActionsMenu
                          invoice={inv as Invoice}
                          onView={() => setSelectedInvoice(inv as Invoice)}
                          onPDF={() => openInvoicePDF(inv as Invoice)}
                          onMarkPaid={() => handleMarkPaid(inv.id)}
                          onDelete={() => handleDelete(inv.id)}
                        />
                      </div>
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
                      className={`w-7 h-7 rounded-full ${getAvatarColor(inv.clientName)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
                    >
                      {getInitials(inv.clientName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-[#1C1917]">{inv.clientName}</p>
                        {inv.isWalkIn
                          ? <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Walk-in</span>
                          : <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">Client</span>
                        }
                      </div>
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
                      <button
                        onClick={(e) => { e.stopPropagation(); openInvoicePDF(inv as Invoice); }}
                        title="Open Invoice PDF"
                        className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 shadow-sm flex items-center justify-center hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all"
                      >
                        <svg className="w-3.5 h-3.5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                      </button>
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
              onRegisterClient={(inv) => setRegisteringInvoice(inv)}
              onPDF={() => openInvoicePDF(selectedInvoice)}
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

      {/* Register walk-in as client modal */}
      {registeringInvoice && (
        <RegisterClientModal
          invoice={registeringInvoice}
          onClose={() => setRegisteringInvoice(null)}
          onSave={handleSaveRegistration}
        />
      )}
    </div>
  );
}
