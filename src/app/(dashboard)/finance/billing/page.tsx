"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ShoppingCart,
  User,
  ChevronDown,
  Plus,
  Minus,
  X,
  Trash2,
  Banknote,
  Smartphone,
  CreditCard,
  Link2,
  Building2,
  Scissors,
  Package,
  Star,
  CheckCircle2,
  Download,
  MessageCircle,
  Printer,
  Clock,
  Tag,
  Percent,
  Receipt,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { formatINR } from "@/lib/utils";
import { useFinanceStore, CartItem } from "@/store/useFinanceStore";
import { buildWhatsAppUrl, buildInvoiceWhatsAppMessage } from "@/lib/utils";

type LiveClient = { id: string; name: string; phone: string; loyaltyPoints: number };
type ServiceCategory = { id: string; name: string; order: number };
type Service = { id: string; name: string; categoryId: string; duration: number; price: number; gstRate: number };
type StaffListItem = { id: string; name: string };

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod = "CASH" | "UPI" | "CARD" | "LINK" | "BANK" | "SPLIT";
type MobileTab = "cart" | "pay";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
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
  return colors[name.charCodeAt(0) % colors.length];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillingPage() {
  const {
    activeBill,
    updateActiveBill,
    addCartItem,
    removeCartItem,
    updateCartItem,
    clearBill,
  } = useFinanceStore();

  const {
    items,
    overallDiscount,
    overallDiscountType,
    tips,
    paymentMethod: storedPaymentMethod,
  } = activeBill;

  // ─── Local UI state ────────────────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState<MobileTab>("cart");
  const [serviceTab, setServiceTab] = useState<"services" | "products">("services");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    (storedPaymentMethod as PaymentMethod) || "CASH"
  );
  const [cashReceived, setCashReceived] = useState<string>("");
  const [upiMarked, setUpiMarked] = useState(false);
  const [cardLast4, setCardLast4] = useState("");
  const [splitMethod1, setSplitMethod1] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [splitMethod2, setSplitMethod2] = useState<"CASH" | "UPI" | "CARD">("UPI");
  const [splitAmount1, setSplitAmount1] = useState<string>("");
  const [splitAmount2, setSplitAmount2] = useState<string>("");
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  // ─── Client selector state ─────────────────────────────────────────────────
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [liveClients, setLiveClients] = useState<LiveClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<LiveClient | null>(null);
  const clientRef = useRef<HTMLDivElement>(null);

  // ─── Services / Categories / Staff ────────────────────────────────────────
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [staffList, setStaffList] = useState<StaffListItem[]>([]);

  useEffect(() => {
    fetch("/api/services").then((r) => r.json()).then((d) => setServices(Array.isArray(d) ? d : []));
    fetch("/api/services/categories").then((r) => r.json()).then((d) => setServiceCategories(Array.isArray(d) ? d : []));
    fetch("/api/staff").then((r) => r.json()).then((d) => setStaffList(Array.isArray(d) ? d : []));
  }, []);

  // Close client dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Live client search
  useEffect(() => {
    if (!clientSearch.trim()) { setLiveClients([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/clients?search=${encodeURIComponent(clientSearch)}`)
        .then((r) => r.json())
        .then((data) => setLiveClients(Array.isArray(data) ? data.slice(0, 8) : []));
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  const filteredClients = liveClients;

  // ─── Filtered services ────────────────────────────────────────────────────
  const filteredServices = useMemo(() => {
    if (activeCategoryId === "all") return services;
    return services.filter((s) => s.categoryId === activeCategoryId);
  }, [activeCategoryId, services]);

  // ─── Cart calculations ────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const itemBase = item.rate * item.quantity;
      const disc =
        item.discountType === "percent"
          ? itemBase * (item.discount / 100)
          : item.discount;
      return sum + (itemBase - disc);
    }, 0);

    const afterOverallDiscount =
      overallDiscountType === "percent"
        ? subtotal * (1 - overallDiscount / 100)
        : subtotal - overallDiscount;

    const taxable = Math.max(0, afterOverallDiscount);
    const loyaltyDiscount = useLoyalty && selectedClient ? Math.min(selectedClient.loyaltyPoints / 2, taxable) : 0;
    const taxableAfterLoyalty = taxable - loyaltyDiscount;
    const gstAmount = taxableAfterLoyalty * 0.18;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const tipAmount = tips || 0;
    const total = taxableAfterLoyalty + gstAmount + tipAmount;

    return {
      subtotal,
      afterOverallDiscount: taxable,
      loyaltyDiscount,
      taxableAfterLoyalty,
      gstAmount,
      cgst,
      sgst,
      total: Math.max(0, total),
    };
  }, [items, overallDiscount, overallDiscountType, tips, useLoyalty, selectedClient]);

  // ─── Add service to cart ──────────────────────────────────────────────────
  function addService(service: Service) {
    const existing = items.find((i) => i.serviceId === service.id);
    if (existing) {
      updateCartItem(existing.id, { quantity: existing.quantity + 1 });
      toast.success(`${service.name} qty updated`);
      return;
    }
    const cartItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: "service",
      serviceId: service.id,
      name: service.name,
      duration: service.duration,
      quantity: 1,
      rate: service.price,
      discount: 0,
      discountType: "flat",
      staffId: activeBill.staffId,
      gstRate: service.gstRate,
    };
    addCartItem(cartItem);
    toast.success(`${service.name} added`);
  }

  // ─── Complete bill ─────────────────────────────────────────────────────────
  async function completeBill() {
    if (items.length === 0) { toast.error("Cart is empty"); return; }
    if (!paymentMethod) { toast.error("Select a payment method"); return; }
    if (paymentMethod === "SPLIT") {
      const s1 = parseFloat(splitAmount1) || 0;
      const s2 = parseFloat(splitAmount2) || 0;
      if (Math.abs(s1 + s2 - totals.total) > 1) {
        toast.error(`Split amounts must sum to ${formatINR(totals.total)}`);
        return;
      }
    }
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeBill.clientId || null,
          walkInName: activeBill.walkInName || null,
          staffId: activeBill.staffId || null,
          items: items.map((item) => {
            const gross = item.rate * item.quantity;
            const discAmt = item.discountType === "percent"
              ? gross * (item.discount / 100)
              : (item.discount || 0);
            const taxable = gross - discAmt;
            const gstRate = item.gstRate || 18;
            const halfGst = taxable * (gstRate / 2 / 100);
            return {
              name: item.name,
              quantity: item.quantity,
              rate: item.rate,
              discount: discAmt,
              cgst: halfGst,
              sgst: halfGst,
              total: taxable + halfGst * 2,
            };
          }),
          subtotal: totals.subtotal,
          taxAmount: totals.gstAmount,
          discount: totals.subtotal - totals.afterOverallDiscount + totals.loyaltyDiscount,
          tips: tips || 0,
          totalAmount: totals.total,
          amountPaid: totals.total,
          paymentMethod,
          status: "PAID",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save invoice");
      setInvoiceNumber(data.invoiceNumber);
      updateActiveBill({ paymentMethod: paymentMethod as typeof activeBill.paymentMethod });
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    }
  }

  // ─── WhatsApp share ───────────────────────────────────────────────────────
  function shareWhatsApp() {
    const client = selectedClient;
    if (!client) {
      toast.error("No client selected for WhatsApp");
      return;
    }
    const msg = buildInvoiceWhatsAppMessage({
      clientName: client.name,
      salonName: "SalonSoft Pro",
      invoiceNumber,
      date: new Date(),
      services: items.map((i) => i.name),
      total: totals.total,
      paymentMethod,
    });
    const url = buildWhatsAppUrl(client.phone, msg);
    window.open(url, "_blank");
  }

  // ─── Change calculation ───────────────────────────────────────────────────
  const change = useMemo(() => {
    const received = parseFloat(cashReceived) || 0;
    return Math.max(0, received - totals.total);
  }, [cashReceived, totals.total]);

  // ─── UPI string ───────────────────────────────────────────────────────────
  const upiString = `upi://pay?pa=salonsoft@upi&pn=SalonSoft+Pro&am=${totals.total.toFixed(2)}&cu=INR`;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  function renderClientSelector() {
    return (
      <div ref={clientRef} className="relative">
        {!isWalkIn ? (
          <>
            <div
              className="flex items-center gap-2 border border-[#E7E5E4] rounded-lg px-3 py-2 cursor-text bg-white"
              onClick={() => setShowClientDropdown(true)}
            >
              <User className="w-4 h-4 text-stone-400 shrink-0" />
              {activeBill.clientId ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(
                      selectedClient?.name ?? ""
                    )}`}
                  >
                    {getInitials(selectedClient?.name ?? "")}
                  </div>
                  <span className="text-sm font-medium truncate">
                    {selectedClient?.name}
                  </span>
                  <span className="text-xs text-stone-400 ml-auto shrink-0">
                    {selectedClient?.phone}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateActiveBill({ clientId: undefined, clientName: undefined, clientPhone: undefined });
                      setSelectedClient(null);
                      setClientSearch("");
                    }}
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <input
                  className="flex-1 outline-none text-sm placeholder:text-stone-400 bg-transparent"
                  placeholder="Search client by name or phone…"
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                />
              )}
            </div>
            {showClientDropdown && !activeBill.clientId && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[#E7E5E4] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 text-left"
                    onClick={() => {
                      updateActiveBill({ clientId: c.id, clientName: c.name, clientPhone: c.phone });
                      setSelectedClient(c);
                      setClientSearch(c.name);
                      setShowClientDropdown(false);
                    }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(c.name)}`}
                    >
                      {getInitials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">{c.name}</p>
                      <p className="text-xs text-stone-400">{c.phone}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                      <Star className="w-3 h-3" />
                      <span>{c.loyaltyPoints} pts</span>
                    </div>
                  </button>
                ))}
                <button
                  className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-[#E7E5E4] hover:bg-amber-50 text-amber-700 text-sm font-medium"
                  onClick={() => {
                    setIsWalkIn(true);
                    setShowClientDropdown(false);
                    updateActiveBill({ clientId: undefined, clientName: undefined });
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Walk-in
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 border border-amber-300 rounded-lg px-3 py-2 bg-amber-50">
              <User className="w-4 h-4 text-amber-500 shrink-0" />
              <input
                className="flex-1 outline-none text-sm bg-transparent placeholder:text-amber-400"
                placeholder="Walk-in customer name…"
                value={walkInName}
                onChange={(e) => {
                  setWalkInName(e.target.value);
                  updateActiveBill({ walkInName: e.target.value, clientName: e.target.value });
                }}
              />
            </div>
            <button
              onClick={() => {
                setIsWalkIn(false);
                setWalkInName("");
                updateActiveBill({ walkInName: undefined, clientName: undefined });
              }}
              className="text-stone-400 hover:text-stone-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderCartLeft() {
    return (
      <div className="flex flex-col gap-4">
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-stone-900">New Bill</h1>
            <a href="#" className="text-xs text-amber-600 hover:underline flex items-center gap-1">
              <Link2 className="w-3.5 h-3.5" />
              Link Appointment
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Client selector */}
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Client</label>
              {renderClientSelector()}
            </div>
            {/* Staff selector */}
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Staff</label>
              <div className="relative">
                <select
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  value={activeBill.staffId ?? ""}
                  onChange={(e) => updateActiveBill({ staffId: e.target.value || undefined })}
                >
                  <option value="">Select staff…</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Services / Products */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-[#E7E5E4]">
            <button
              onClick={() => setServiceTab("services")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                serviceTab === "services"
                  ? "text-stone-900 border-b-2 border-amber-500"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setServiceTab("products")}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                serviceTab === "products"
                  ? "text-stone-900 border-b-2 border-amber-500"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              Products
            </button>
          </div>

          <div className="p-4">
            {serviceTab === "services" ? (
              <>
                {/* Category chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setActiveCategoryId("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeCategoryId === "all"
                        ? "bg-[#1C1917] text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    All
                  </button>
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        activeCategoryId === cat.id
                          ? "bg-[#1C1917] text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Service grid */}
                <div className="grid grid-cols-2 gap-3">
                  {filteredServices.map((svc) => (
                    <button
                      key={svc.id}
                      onClick={() => addService(svc)}
                      className="cursor-pointer hover:border-[#D97706] rounded-xl border border-[#E7E5E4] p-3 transition-all text-left group hover:bg-amber-50"
                    >
                      <p className="text-sm font-medium text-stone-800 group-hover:text-amber-700 leading-tight">
                        {svc.name}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="flex items-center gap-1 text-xs text-stone-400">
                          <Clock className="w-3 h-3" />
                          {svc.duration}m
                        </span>
                        <span className="text-sm font-semibold text-stone-900">
                          {formatINR(svc.price)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                <Package className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No products in inventory</p>
                <p className="text-xs mt-1">Products will appear here once added</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart items */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E7E5E4]">
              <ShoppingCart className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-semibold text-stone-700">
                Cart ({items.length} item{items.length > 1 ? "s" : ""})
              </span>
            </div>
            <div className="divide-y divide-[#E7E5E4]">
              {items.map((item) => {
                const lineBase = item.rate * item.quantity;
                const lineDisc =
                  item.discountType === "percent"
                    ? lineBase * (item.discount / 100)
                    : item.discount;
                const lineTotal = lineBase - lineDisc;
                return (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                        {item.duration && (
                          <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {item.duration} min
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="text-stone-300 hover:text-red-500 transition-colors mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Quantity */}
                      <div>
                        <label className="text-xs text-stone-400 mb-1 block">Qty</label>
                        <div className="flex items-center border border-[#E7E5E4] rounded-lg overflow-hidden">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) updateCartItem(item.id, { quantity: item.quantity - 1 });
                              else removeCartItem(item.id);
                            }}
                            className="px-2 py-1.5 hover:bg-stone-100 text-stone-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                            className="px-2 py-1.5 hover:bg-stone-100 text-stone-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Rate */}
                      <div>
                        <label className="text-xs text-stone-400 mb-1 block">Rate (₹)</label>
                        <input
                          type="number"
                          className="w-full border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                          value={item.rate}
                          onChange={(e) =>
                            updateCartItem(item.id, { rate: parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>

                      {/* Discount */}
                      <div>
                        <label className="text-xs text-stone-400 mb-1 block">Discount</label>
                        <div className="flex">
                          <input
                            type="number"
                            className="flex-1 border border-r-0 border-[#E7E5E4] rounded-l-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 w-0"
                            value={item.discount || ""}
                            placeholder="0"
                            onChange={(e) =>
                              updateCartItem(item.id, { discount: parseFloat(e.target.value) || 0 })
                            }
                          />
                          <button
                            onClick={() =>
                              updateCartItem(item.id, {
                                discountType: item.discountType === "flat" ? "percent" : "flat",
                              })
                            }
                            className="border border-[#E7E5E4] rounded-r-lg px-2 py-1.5 text-xs bg-stone-50 hover:bg-stone-100 text-stone-600 shrink-0"
                          >
                            {item.discountType === "flat" ? "₹" : "%"}
                          </button>
                        </div>
                      </div>

                      {/* Staff override */}
                      <div>
                        <label className="text-xs text-stone-400 mb-1 block">Stylist</label>
                        <div className="relative">
                          <select
                            className="w-full border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-xs bg-white appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-amber-300"
                            value={item.staffId ?? ""}
                            onChange={(e) =>
                              updateCartItem(item.id, { staffId: e.target.value || undefined })
                            }
                          >
                            <option value="">—</option>
                            {staffList.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name.split(" ")[0]}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="flex justify-end mt-2">
                      <span className="text-sm font-semibold text-stone-700">
                        {formatINR(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cart totals */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Bill Summary
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span className="font-medium">{formatINR(totals.subtotal)}</span>
            </div>

            {/* Overall discount */}
            <div className="flex items-center justify-between text-stone-600">
              <div className="flex items-center gap-2 flex-1">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>Overall Discount</span>
                <div className="flex ml-2">
                  <input
                    type="number"
                    className="w-20 border border-[#E7E5E4] rounded-l-md px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                    value={overallDiscount || ""}
                    placeholder="0"
                    onChange={(e) =>
                      updateActiveBill({ overallDiscount: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <button
                    onClick={() =>
                      updateActiveBill({
                        overallDiscountType: overallDiscountType === "flat" ? "percent" : "flat",
                      })
                    }
                    className="border border-l-0 border-[#E7E5E4] rounded-r-md px-2 py-0.5 text-xs bg-stone-50 hover:bg-stone-100"
                  >
                    {overallDiscountType === "flat" ? "₹" : "%"}
                  </button>
                </div>
              </div>
              <span className="font-medium text-red-500">
                -{formatINR(totals.subtotal - totals.afterOverallDiscount)}
              </span>
            </div>

            {useLoyalty && totals.loyaltyDiscount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" />
                  Loyalty Redemption
                </span>
                <span className="font-medium">-{formatINR(totals.loyaltyDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>Taxable Amount</span>
              <span className="font-medium">{formatINR(totals.taxableAfterLoyalty)}</span>
            </div>

            <div className="flex justify-between text-stone-500 text-xs">
              <span>CGST (9%)</span>
              <span>{formatINR(totals.cgst)}</span>
            </div>
            <div className="flex justify-between text-stone-500 text-xs">
              <span>SGST (9%)</span>
              <span>{formatINR(totals.sgst)}</span>
            </div>

            {/* Tips */}
            <div className="flex items-center justify-between text-stone-600">
              <span>Tips</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-stone-400">₹</span>
                <input
                  type="number"
                  className="w-20 border border-[#E7E5E4] rounded-md px-2 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-300"
                  value={tips || ""}
                  placeholder="0"
                  onChange={(e) =>
                    updateActiveBill({ tips: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="border-t border-[#E7E5E4] pt-3 mt-1 flex justify-between items-center">
              <span className="text-base font-bold text-stone-900">Grand Total</span>
              <span className="text-xl font-bold text-amber-600">{formatINR(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Mobile proceed button */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileTab("pay")}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Proceed to Pay →
          </button>
        </div>
      </div>
    );
  }

  function renderPaymentPanel() {
    const paymentOptions: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
      { id: "CASH", label: "Cash", icon: <Banknote className="w-6 h-6" /> },
      { id: "UPI", label: "UPI", icon: <Smartphone className="w-6 h-6" /> },
      { id: "CARD", label: "Card", icon: <CreditCard className="w-6 h-6" /> },
      { id: "LINK", label: "Link", icon: <Link2 className="w-6 h-6" /> },
      { id: "BANK", label: "Bank", icon: <Building2 className="w-6 h-6" /> },
      { id: "SPLIT", label: "Split", icon: <Scissors className="w-6 h-6" /> },
    ];

    return (
      <div className="flex flex-col gap-4">
        {/* Payment method grid */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <h2 className="text-base font-semibold text-stone-800 mb-4">Payment Method</h2>
          <div className="grid grid-cols-3 gap-3">
            {paymentOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPaymentMethod(opt.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === opt.id
                    ? "border-[#D97706] bg-amber-50 text-amber-700"
                    : "border-[#E7E5E4] text-stone-500 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                {opt.icon}
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Method-specific UI */}
          <div className="mt-4">
            {paymentMethod === "CASH" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Amount Received
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium">₹</span>
                    <input
                      type="number"
                      className="w-full border border-[#E7E5E4] rounded-lg pl-7 pr-3 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="0"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                    />
                  </div>
                </div>
                {parseFloat(cashReceived) > 0 && (
                  <div
                    className={`flex justify-between items-center px-4 py-2.5 rounded-lg ${
                      change > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {change >= 0 ? "Change to return" : "Amount short"}
                    </span>
                    <span className="text-lg font-bold">{formatINR(Math.abs(change))}</span>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "UPI" && (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="bg-white p-3 rounded-xl border border-[#E7E5E4] shadow-sm">
                  <QRCodeSVG value={upiString} size={180} />
                </div>
                <p className="text-xs text-stone-400 text-center">
                  Scan to pay {formatINR(totals.total)}
                </p>
                <button
                  onClick={() => {
                    setUpiMarked(true);
                    toast.success("UPI payment marked as received");
                  }}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    upiMarked
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-amber-500 hover:bg-amber-600 text-white"
                  }`}
                >
                  {upiMarked ? "✓ Received" : "Mark as Received"}
                </button>
              </div>
            )}

            {paymentMethod === "CARD" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">
                    Card Last 4 Digits (optional)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="XXXX"
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <button
                  onClick={() => toast.success("Card payment approved")}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold"
                >
                  Approve
                </button>
              </div>
            )}

            {paymentMethod === "LINK" && (
              <div className="text-center py-4">
                <p className="text-sm text-stone-500 mb-3">
                  Send payment link to customer&apos;s phone
                </p>
                <button
                  onClick={() => toast.success("Payment link sent!")}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl text-sm font-semibold"
                >
                  Send Payment Link
                </button>
              </div>
            )}

            {paymentMethod === "BANK" && (
              <div className="text-center py-4">
                <p className="text-sm text-stone-500 mb-1">Bank Transfer</p>
                <p className="text-xs text-stone-400">
                  Mark as paid once transfer is confirmed
                </p>
              </div>
            )}

            {paymentMethod === "SPLIT" && (
              <div className="space-y-3 mt-1">
                <p className="text-xs text-stone-500">Split payment across two methods</p>
                {[
                  {
                    method: splitMethod1,
                    setMethod: setSplitMethod1,
                    amount: splitAmount1,
                    setAmount: setSplitAmount1,
                    label: "Payment 1",
                  },
                  {
                    method: splitMethod2,
                    setMethod: setSplitMethod2,
                    amount: splitAmount2,
                    setAmount: setSplitAmount2,
                    label: "Payment 2",
                  },
                ].map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="relative w-24 shrink-0">
                      <select
                        className="w-full border border-[#E7E5E4] rounded-lg px-2 py-2 text-xs bg-white appearance-none pr-5 focus:outline-none focus:ring-1 focus:ring-amber-300"
                        value={row.method}
                        onChange={(e) => row.setMethod(e.target.value as "CASH" | "UPI" | "CARD")}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">₹</span>
                      <input
                        type="number"
                        className="w-full border border-[#E7E5E4] rounded-lg pl-5 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                        placeholder={row.label}
                        value={row.amount}
                        onChange={(e) => row.setAmount(e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                {splitAmount1 && splitAmount2 && (
                  <div
                    className={`text-xs px-3 py-1.5 rounded-lg ${
                      Math.abs(
                        (parseFloat(splitAmount1) || 0) +
                          (parseFloat(splitAmount2) || 0) -
                          totals.total
                      ) < 1
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {Math.abs(
                      (parseFloat(splitAmount1) || 0) +
                        (parseFloat(splitAmount2) || 0) -
                        totals.total
                    ) < 1
                      ? "✓ Amounts balance"
                      : `Difference: ${formatINR(
                          Math.abs(
                            (parseFloat(splitAmount1) || 0) +
                              (parseFloat(splitAmount2) || 0) -
                              totals.total
                          )
                        )}`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loyalty Points */}
        {selectedClient && (
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-stone-800">Loyalty Points</span>
                </div>
                <p className="text-xs text-stone-500">
                  {selectedClient.name} has{" "}
                  <span className="font-semibold text-amber-600">
                    {selectedClient.loyaltyPoints} points
                  </span>{" "}
                  = {formatINR(selectedClient.loyaltyPoints / 2)} redeemable
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useLoyalty}
                  onChange={(e) => setUseLoyalty(e.target.checked)}
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            {useLoyalty && (
              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg">
                Redeeming {formatINR(Math.min(selectedClient.loyaltyPoints / 2, totals.afterOverallDiscount))} as discount
              </div>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-4 sticky bottom-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                toast.success("Draft saved");
              }}
              className="flex-1 border border-[#E7E5E4] text-stone-600 hover:bg-stone-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={() => {
                if (items.length === 0) { toast.error("Cart is empty"); return; }
                window.print();
              }}
              className="flex-1 border border-[#E7E5E4] text-stone-600 hover:bg-stone-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
            >
              Print Preview
            </button>
            <button
              onClick={completeBill}
              className="flex-1 sm:flex-[2] bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Complete &amp; Invoice →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Mobile tabs */}
      <div className="lg:hidden flex border-b border-[#E7E5E4] bg-white mb-4 rounded-xl overflow-hidden">
        <button
          onClick={() => setMobileTab("cart")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mobileTab === "cart"
              ? "bg-amber-500 text-white"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Cart
          {items.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${mobileTab === "cart" ? "bg-white text-amber-600" : "bg-amber-500 text-white"}`}>
              {items.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setMobileTab("pay")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            mobileTab === "pay"
              ? "bg-amber-500 text-white"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Pay
        </button>
      </div>

      {/* Desktop: split panel */}
      <div className="hidden lg:flex gap-6 h-full">
        <div className="flex-1 min-w-0 overflow-y-auto pb-6">{renderCartLeft()}</div>
        <div className="w-[400px] shrink-0 overflow-y-auto pb-6">{renderPaymentPanel()}</div>
      </div>

      {/* Mobile: single panel */}
      <div className="lg:hidden">
        {mobileTab === "cart" ? renderCartLeft() : renderPaymentPanel()}
      </div>

      {/* ─── Success Modal ────────────────────────────────────────────────── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">Invoice Created!</h2>
              <p className="text-sm text-stone-500 mt-1">
                {invoiceNumber}
              </p>
              {(activeBill.clientName || activeBill.walkInName) && (
                <p className="text-sm font-medium text-stone-700 mt-0.5">
                  {activeBill.clientName ?? activeBill.walkInName}
                </p>
              )}
              <p className="text-2xl font-bold text-amber-600 mt-2">
                {formatINR(totals.total)}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                via {paymentMethod}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => toast("PDF download coming soon", { icon: "📥" })}
                className="flex flex-col items-center gap-1.5 p-3 border border-[#E7E5E4] rounded-xl hover:bg-stone-50 transition-colors"
              >
                <Download className="w-5 h-5 text-stone-500" />
                <span className="text-xs text-stone-600">Download</span>
              </button>
              <button
                onClick={shareWhatsApp}
                className="flex flex-col items-center gap-1.5 p-3 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-xs text-emerald-700">WhatsApp</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex flex-col items-center gap-1.5 p-3 border border-[#E7E5E4] rounded-xl hover:bg-stone-50 transition-colors"
              >
                <Printer className="w-5 h-5 text-stone-500" />
                <span className="text-xs text-stone-600">Print</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowSuccess(false);
                clearBill();
                setPaymentMethod("CASH");
                setCashReceived("");
                setUpiMarked(false);
                setCardLast4("");
                setSplitAmount1("");
                setSplitAmount2("");
                setUseLoyalty(false);
                setIsWalkIn(false);
                setWalkInName("");
                setClientSearch("");
              }}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
