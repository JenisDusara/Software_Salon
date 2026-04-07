import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Indian Number Formatting ────────────────────────────────────────────────

/** Format number as Indian currency: ₹1,23,456 */
export function formatINR(amount: number): string {
  if (isNaN(amount)) return "₹0";
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

/** Format number with Indian comma style (no ₹ symbol) */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat("en-IN").format(num);
}

// ─── Date/Time Formatting ─────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "hh:mm a");
}

export function daysAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(dueDate: Date | string | null): boolean {
  if (!dueDate) return false;
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  return isBefore(d, startOfDay(new Date()));
}

// ─── Text Utilities ───────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

// ─── GST Calculations ─────────────────────────────────────────────────────────

export interface GSTBreakdown {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

export function calculateGST(amount: number, gstRate: number, isInterState = false): GSTBreakdown {
  const taxableAmount = amount;
  const totalTax = (taxableAmount * gstRate) / 100;
  const halfTax = totalTax / 2;

  return {
    taxableAmount,
    cgst: isInterState ? 0 : halfTax,
    sgst: isInterState ? 0 : halfTax,
    igst: isInterState ? totalTax : 0,
    totalTax,
    grandTotal: taxableAmount + totalTax,
  };
}

/** Reverse calculate to get base amount from GST-inclusive price */
export function reverseGST(totalWithGST: number, gstRate: number): number {
  return totalWithGST / (1 + gstRate / 100);
}

// ─── Invoice Number Generation ────────────────────────────────────────────────

export function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(sequence).padStart(4, "0")}`;
}

// ─── Color Utilities ──────────────────────────────────────────────────────────

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    OVERDUE: "bg-red-100 text-red-700 border-red-200",
    DRAFT: "bg-stone-100 text-stone-600 border-stone-200",
    CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
    PARTIAL: "bg-blue-100 text-blue-700 border-blue-200",
    CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    NO_SHOW: "bg-red-100 text-red-700 border-red-200",
  };
  return map[status] ?? "bg-gray-100 text-gray-500 border-gray-200";
}

export function getAvatarColor(name: string): string {
  const colors = [
    "bg-amber-500",
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-indigo-500",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

// ─── WhatsApp ────────────────────────────────────────────────────────────────

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const withCountry = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function buildInvoiceWhatsAppMessage(params: {
  clientName: string;
  salonName: string;
  invoiceNumber: string;
  date: Date;
  services: string[];
  total: number;
  paymentMethod: string;
}): string {
  const { clientName, salonName, invoiceNumber, date, services, total, paymentMethod } = params;
  return (
    `Hi ${clientName}! 🙏\n\n` +
    `Thank you for visiting *${salonName}*!\n\n` +
    `*Invoice #${invoiceNumber}*\n` +
    `Date: ${formatDate(date)}\n` +
    `Services: ${services.join(", ")}\n` +
    `Amount: *${formatINR(total)}*\n\n` +
    `Payment: ${paymentMethod} ✅\n\n` +
    `We look forward to seeing you again! ✨`
  );
}

// ─── Percentage change ───────────────────────────────────────────────────────

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatPercent(value: number, decimals = 1): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}
