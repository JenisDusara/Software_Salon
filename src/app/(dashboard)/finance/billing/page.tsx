"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  ShoppingCart, User, ChevronDown, Plus, Minus, X, Trash2,
  Banknote, Smartphone, CreditCard, Link2, Building2, Scissors,
  Package, Star, CheckCircle2, MessageCircle, Printer, Clock,
  Tag, Receipt, Search, UserPlus, Loader2, Calendar,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { formatINR } from "@/lib/utils";
import { useFinanceStore, CartItem } from "@/store/useFinanceStore";
import { buildWhatsAppUrl, buildInvoiceWhatsAppMessage } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type LiveClient = { id: string; name: string; phone: string; loyaltyPoints: number };
type ServiceCategory = { id: string; name: string; order: number };
type Service = { id: string; name: string; categoryId: string; duration: number; price: number; gstRate: number };
type Product = { id: string; name: string; brand?: string; sellingPrice: number; stockLevel: number; gstRate: number };
type StaffListItem = { id: string; name: string };
type PaymentMethod = "CASH" | "UPI" | "CARD" | "LINK" | "BANK" | "SPLIT";
type MobileTab = "cart" | "pay";
type ApptForLink = {
  id: string; clientName: string; serviceName: string;
  staffName: string; time: string; status: string; amount: number;
};
type InvoiceSnapshot = {
  invoiceNumber: string; date: Date; clientName: string; clientPhone: string;
  staffName: string; paymentMethod: string;
  items: { name: string; qty: number; rate: number; discount: number; gstRate: number; taxable: number; cgst: number; sgst: number; total: number }[];
  subtotal: number; overallDiscount: number; loyaltyDiscount: number;
  taxableAmount: number; cgst: number; sgst: number; tips: number; grandTotal: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}
function getAvatarColor(name: string) {
  const colors = ["bg-amber-500","bg-emerald-500","bg-blue-500","bg-purple-500","bg-rose-500","bg-teal-500","bg-orange-500","bg-indigo-500"];
  return colors[name.charCodeAt(0) % colors.length];
}

// ─── Print HTML builder (used for both Print Preview and post-bill print) ─────
function buildPrintHTML(params: {
  invoiceNumber: string; date: Date; clientName: string; clientPhone: string;
  staffName: string; paymentMethod: string;
  items: { name: string; qty: number; rate: number; discount: number; taxable: number }[];
  subtotal: number; overallDiscount: number; loyaltyDiscount: number;
  taxableAmount: number; cgst: number; sgst: number; tips: number; grandTotal: number;
}) {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const rows = params.items.map(i => `
    <tr>
      <td style="padding:6px 4px;border-bottom:1px solid #f5f5f4">${i.name}</td>
      <td style="padding:6px 4px;border-bottom:1px solid #f5f5f4;text-align:center">${i.qty}</td>
      <td style="padding:6px 4px;border-bottom:1px solid #f5f5f4;text-align:right">${fmt(i.rate)}</td>
      <td style="padding:6px 4px;border-bottom:1px solid #f5f5f4;text-align:right;color:#ef4444">${i.discount > 0 ? `-${fmt(i.discount)}` : "—"}</td>
      <td style="padding:6px 4px;border-bottom:1px solid #f5f5f4;text-align:right;font-weight:600">${fmt(i.taxable)}</td>
    </tr>`).join("");
  const row = (label: string, value: string, color = "#44403c", bold = false) =>
    `<div style="display:flex;justify-content:space-between;padding:3px 0;color:${color};${bold ? "font-weight:700" : ""}"><span>${label}</span><span>${value}</span></div>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${params.invoiceNumber}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;font-size:12px;color:#1c1917;background:#fff;padding:20px}
  @media print{body{padding:0}}</style></head><body>
  <div style="max-width:400px;margin:0 auto">
    <div style="text-align:center;border-bottom:2px solid #1c1917;padding-bottom:12px;margin-bottom:12px">
      <div style="width:36px;height:36px;background:#1c1917;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:6px">
        <span style="color:white;font-weight:700;font-size:16px">S</span>
      </div>
      <div style="font-size:16px;font-weight:700">SalonSoft Pro</div>
      <div style="font-size:11px;color:#78716c">Tax Invoice</div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:11px">
      <div><div style="color:#78716c">Invoice No.</div><div style="font-weight:600">${params.invoiceNumber}</div></div>
      <div style="text-align:right"><div style="color:#78716c">Date</div><div style="font-weight:600">${params.date.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</div></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:11px;border-top:1px solid #e7e5e4;padding-top:8px">
      <div><div style="color:#78716c">Bill To</div><div style="font-weight:600">${params.clientName}</div>${params.clientPhone ? `<div style="color:#78716c">${params.clientPhone}</div>` : ""}</div>
      ${params.staffName ? `<div style="text-align:right"><div style="color:#78716c">Served By</div><div style="font-weight:600">${params.staffName}</div></div>` : ""}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;margin:10px 0">
      <thead><tr style="border-bottom:2px solid #1c1917">
        <th style="text-align:left;padding:5px 4px;color:#78716c;font-weight:600">Item</th>
        <th style="text-align:center;padding:5px 4px;color:#78716c;font-weight:600">Qty</th>
        <th style="text-align:right;padding:5px 4px;color:#78716c;font-weight:600">Rate</th>
        <th style="text-align:right;padding:5px 4px;color:#78716c;font-weight:600">Disc</th>
        <th style="text-align:right;padding:5px 4px;color:#78716c;font-weight:600">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="border-top:1px solid #e7e5e4;padding-top:8px;margin-top:4px;font-size:12px">
      ${row("Subtotal", fmt(params.subtotal))}
      ${params.overallDiscount > 0 ? row("Discount", `-${fmt(params.overallDiscount)}`, "#ef4444") : ""}
      ${params.loyaltyDiscount > 0 ? row("Loyalty Redemption", `-${fmt(params.loyaltyDiscount)}`, "#d97706") : ""}
      ${row("Taxable Amount", fmt(params.taxableAmount))}
      ${row("CGST (9%)", fmt(params.cgst), "#78716c")}
      ${row("SGST (9%)", fmt(params.sgst), "#78716c")}
      ${params.tips > 0 ? row("Tips", fmt(params.tips)) : ""}
      <div style="display:flex;justify-content:space-between;border-top:2px solid #1c1917;margin-top:6px;padding-top:6px;font-size:15px">
        <span style="font-weight:700">Grand Total</span>
        <span style="font-weight:700;color:#d97706">${fmt(params.grandTotal)}</span>
      </div>
    </div>
    <div style="text-align:center;margin-top:14px;padding-top:10px;border-top:1px dashed #e7e5e4">
      <span style="display:inline-block;background:#1c1917;color:white;padding:4px 14px;border-radius:99px;font-size:11px;font-weight:600">
        ${params.paymentMethod === "PREVIEW" ? "PREVIEW" : `Paid via ${params.paymentMethod}`}
      </span>
      <div style="color:#78716c;font-size:11px;margin-top:8px">Thank you for visiting! ✂️</div>
    </div>
  </div>
  </body></html>`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillingPage() {
  const { activeBill, updateActiveBill, addCartItem, removeCartItem, updateCartItem, clearBill } = useFinanceStore();
  const { items, overallDiscount, overallDiscountType, tips, paymentMethod: storedPaymentMethod } = activeBill;

  // ─── Local UI state ────────────────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState<MobileTab>("cart");
  const [serviceTab, setServiceTab] = useState<"services" | "products">("services");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [serviceSearch, setServiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>((storedPaymentMethod as PaymentMethod) || "CASH");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [upiMarked, setUpiMarked] = useState(false);
  const [cardLast4, setCardLast4] = useState("");
  const [splitMethod1, setSplitMethod1] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [splitMethod2, setSplitMethod2] = useState<"CASH" | "UPI" | "CARD">("UPI");
  const [splitAmount1, setSplitAmount1] = useState<string>("");
  const [splitAmount2, setSplitAmount2] = useState<string>("");
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [invoiceSnap, setInvoiceSnap] = useState<InvoiceSnapshot | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // ─── Link Appointment state ────────────────────────────────────────────
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptModalList, setApptModalList] = useState<ApptForLink[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [linkedApptId, setLinkedApptId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  // ─── Customer state — initialised from store so navigation doesn't lose it ─
  const [clientSearch, setClientSearch] = useState(() => activeBill.clientName ?? "");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<LiveClient | null>(() =>
    activeBill.clientId
      ? { id: activeBill.clientId, name: activeBill.clientName ?? "", phone: activeBill.clientPhone ?? "", loyaltyPoints: activeBill.clientLoyaltyPoints ?? 0 }
      : null
  );
  // Walk-in mode persisted in store so it survives tab navigation
  const isWalkIn = !!activeBill.isWalkIn;
  const walkInName = activeBill.walkInName ?? "";

  // New client form
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  // Walk-in phone duplicate detection
  const [walkInPhoneDupe, setWalkInPhoneDupe] = useState<LiveClient | null>(null);
  // New-client form phone duplicate detection
  const [newPhoneDupe, setNewPhoneDupe] = useState<LiveClient | null>(null);

  const [liveClients, setLiveClients] = useState<LiveClient[]>([]);
  const clientRef = useRef<HTMLDivElement>(null);

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const [services, setServices] = useState<Service[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staffList, setStaffList] = useState<StaffListItem[]>([]);

  useEffect(() => {
    fetch("/api/services").then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : []));
    fetch("/api/services/categories").then(r => r.json()).then(d => setServiceCategories(Array.isArray(d) ? d : []));
    fetch("/api/staff").then(r => r.json()).then(d => setStaffList(Array.isArray(d) ? d : []));
    fetch("/api/inventory").then(r => r.json()).then(d => setProducts(Array.isArray(d) ? d : []));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
        setShowNewClientForm(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Live client search (debounced)
  useEffect(() => {
    if (!clientSearch.trim()) { setLiveClients([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/clients?search=${encodeURIComponent(clientSearch)}`)
        .then(r => r.json())
        .then(data => setLiveClients(Array.isArray(data) ? data.slice(0, 8) : []));
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  // Walk-in phone duplicate check — fires when user types a 10-digit phone
  const walkInPhone = activeBill.clientPhone ?? "";
  useEffect(() => {
    if (!isWalkIn || !/^\d{10}$/.test(walkInPhone)) { setWalkInPhoneDupe(null); return; }
    const t = setTimeout(() => {
      fetch(`/api/clients?search=${encodeURIComponent(walkInPhone)}`)
        .then(r => r.json())
        .then(data => {
          const match = Array.isArray(data) ? data.find((c: LiveClient) => c.phone === walkInPhone) ?? null : null;
          setWalkInPhoneDupe(match);
        });
    }, 400);
    return () => clearTimeout(t);
  }, [walkInPhone, isWalkIn]);

  // New-client form phone duplicate check
  useEffect(() => {
    if (!showNewClientForm || !/^\d{10}$/.test(newPhone)) { setNewPhoneDupe(null); return; }
    const t = setTimeout(() => {
      fetch(`/api/clients?search=${encodeURIComponent(newPhone)}`)
        .then(r => r.json())
        .then(data => {
          const match = Array.isArray(data) ? data.find((c: LiveClient) => c.phone === newPhone) ?? null : null;
          setNewPhoneDupe(match);
        });
    }, 400);
    return () => clearTimeout(t);
  }, [newPhone, showNewClientForm]);

  // ─── Filtered lists ────────────────────────────────────────────────────────
  const filteredServices = useMemo(() => {
    let list = activeCategoryId === "all" ? services : services.filter(s => s.categoryId === activeCategoryId);
    if (serviceSearch.trim()) {
      const q = serviceSearch.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategoryId, services, serviceSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q));
  }, [products, productSearch]);

  // ─── Cart totals ───────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const base = item.rate * item.quantity;
      const disc = item.discountType === "percent" ? base * (item.discount / 100) : item.discount;
      return sum + (base - disc);
    }, 0);
    const overallDiscAmt = overallDiscountType === "percent"
      ? subtotal * (overallDiscount / 100)
      : overallDiscount;
    const taxable = Math.max(0, subtotal - overallDiscAmt);
    const loyaltyDiscount = useLoyalty && selectedClient
      ? Math.min(selectedClient.loyaltyPoints / 2, taxable) : 0;
    const taxableAfterLoyalty = taxable - loyaltyDiscount;
    const gstAmount = taxableAfterLoyalty * 0.18;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const tipAmount = tips || 0;
    const total = taxableAfterLoyalty + gstAmount + tipAmount;
    return { subtotal, overallDiscAmt, taxable, loyaltyDiscount, taxableAfterLoyalty, gstAmount, cgst, sgst, total: Math.max(0, total) };
  }, [items, overallDiscount, overallDiscountType, tips, useLoyalty, selectedClient]);

  // ─── Add service to cart ───────────────────────────────────────────────────
  function addService(svc: Service) {
    const existing = items.find(i => i.serviceId === svc.id);
    if (existing) { updateCartItem(existing.id, { quantity: existing.quantity + 1 }); toast.success(`${svc.name} qty updated`); return; }
    addCartItem({ id: `c_${Date.now()}_${Math.random().toString(36).slice(2)}`, type: "service", serviceId: svc.id, name: svc.name, duration: svc.duration, quantity: 1, rate: svc.price, discount: 0, discountType: "flat", staffId: activeBill.staffId, gstRate: svc.gstRate });
    toast.success(`${svc.name} added`);
  }

  // ─── Add product to cart ───────────────────────────────────────────────────
  function addProduct(p: Product) {
    const existing = items.find(i => i.productId === p.id);
    if (existing) { updateCartItem(existing.id, { quantity: existing.quantity + 1 }); toast.success(`${p.name} qty updated`); return; }
    addCartItem({ id: `c_${Date.now()}_${Math.random().toString(36).slice(2)}`, type: "product", productId: p.id, name: p.name, quantity: 1, rate: p.sellingPrice, discount: 0, discountType: "flat", staffId: activeBill.staffId, gstRate: p.gstRate });
    toast.success(`${p.name} added`);
  }

  // ─── Customer selection helpers ────────────────────────────────────────────
  function selectClient(c: LiveClient) {
    setSelectedClient(c);
    setClientSearch(c.name);
    setShowClientDropdown(false);
    setShowNewClientForm(false);
    updateActiveBill({ clientId: c.id, clientName: c.name, clientPhone: c.phone, clientLoyaltyPoints: c.loyaltyPoints, walkInName: undefined, isWalkIn: false });
  }

  function clearCustomer() {
    setSelectedClient(null);
    setClientSearch("");
    setLiveClients([]);
    updateActiveBill({ clientId: undefined, clientName: undefined, clientPhone: undefined, clientLoyaltyPoints: undefined, walkInName: undefined, isWalkIn: false });
    setUseLoyalty(false);
  }

  function enterWalkIn() {
    setSelectedClient(null);
    setClientSearch("");
    setLiveClients([]);
    setShowClientDropdown(false);
    setShowNewClientForm(false);
    updateActiveBill({ clientId: undefined, clientName: undefined, clientPhone: undefined, clientLoyaltyPoints: undefined, walkInName: "", isWalkIn: true });
    setUseLoyalty(false);
  }

  async function saveNewClient() {
    if (!newName.trim()) { toast.error("Customer name is required"); return; }
    if (!/^\d{10}$/.test(newPhone)) { toast.error("Phone number must be exactly 10 digits"); return; }
    if (newPhoneDupe) { toast.error(`${newPhone} is already registered as ${newPhoneDupe.name}`); return; }
    setSavingClient(true);
    try {
      const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim(), email: newEmail.trim() || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create client");
      selectClient({ id: data.id, name: data.name, phone: data.phone, loyaltyPoints: data.loyaltyPoints ?? 0 });
      setNewName(""); setNewPhone(""); setNewEmail(""); setNewPhoneDupe(null);
      setShowNewClientForm(false);
      toast.success(`${data.name} added and selected`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingClient(false);
    }
  }

  // ─── Link Appointment helpers ──────────────────────────────────────────────
  async function openApptModal() {
    setShowApptModal(true);
    setLoadingAppts(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const data = await fetch(`/api/appointments?date=${today}`).then(r => r.json());
      const pending = Array.isArray(data)
        ? data.filter((a: ApptForLink) => ["CONFIRMED", "PENDING", "IN_PROGRESS"].includes(a.status))
        : [];
      setApptModalList(pending);
    } catch {
      toast.error("Could not load today's appointments");
    } finally {
      setLoadingAppts(false);
    }
  }

  async function linkAppointment(apptId: string) {
    setLinkingId(apptId);
    try {
      const data = await fetch(`/api/appointments/${apptId}`).then(r => r.json());
      if (data.error) throw new Error(data.error);

      // Clear cart first
      clearBill();

      // Set client
      if (data.clientId) {
        const client: LiveClient = { id: data.clientId, name: data.clientName, phone: data.clientPhone ?? "", loyaltyPoints: data.clientLoyaltyPoints ?? 0 };
        setSelectedClient(client);
        setClientSearch(data.clientName);
        updateActiveBill({ clientId: data.clientId, clientName: data.clientName, clientPhone: data.clientPhone ?? undefined, clientLoyaltyPoints: data.clientLoyaltyPoints ?? 0, isWalkIn: false, walkInName: undefined });
      }

      // Set staff
      if (data.staffId) {
        updateActiveBill({ staffId: data.staffId });
      }

      // Add services to cart
      (data.services ?? []).forEach((svc: { serviceId: string; name: string; price: number; duration: number; gstRate: number }) => {
        addCartItem({
          id: `c_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          type: "service",
          serviceId: svc.serviceId,
          name: svc.name,
          duration: svc.duration,
          quantity: 1,
          rate: svc.price,
          discount: 0,
          discountType: "flat",
          staffId: data.staffId ?? undefined,
          gstRate: svc.gstRate,
        });
      });

      setLinkedApptId(apptId);
      updateActiveBill({ appointmentId: apptId });
      setShowApptModal(false);
      toast.success(`Appointment linked — ${data.clientName}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to link appointment");
    } finally {
      setLinkingId(null);
    }
  }

  // ─── Print helpers ─────────────────────────────────────────────────────────
  function buildCurrentPrintParams(invoiceNumber: string, pmLabel: string) {
    return {
      invoiceNumber,
      date: new Date(),
      clientName: activeBill.clientName ?? activeBill.walkInName ?? "Walk-in",
      clientPhone: activeBill.clientPhone ?? selectedClient?.phone ?? "",
      staffName: staffList.find(s => s.id === activeBill.staffId)?.name ?? "",
      paymentMethod: pmLabel,
      items: items.map(item => {
        const gross = item.rate * item.quantity;
        const discAmt = item.discountType === "percent" ? gross * (item.discount / 100) : (item.discount || 0);
        return { name: item.name, qty: item.quantity, rate: item.rate, discount: discAmt, taxable: gross - discAmt };
      }),
      subtotal: totals.subtotal,
      overallDiscount: totals.overallDiscAmt,
      loyaltyDiscount: totals.loyaltyDiscount,
      taxableAmount: totals.taxableAfterLoyalty,
      cgst: totals.cgst,
      sgst: totals.sgst,
      tips: tips || 0,
      grandTotal: totals.total,
    };
  }

  function openPrintWindow(html: string) {
    const win = window.open("", "_blank", "width=460,height=720");
    if (win) { win.document.write(html); win.document.close(); win.focus(); setTimeout(() => { win.print(); }, 400); }
    else toast.error("Pop-up blocked — please allow pop-ups for this site");
  }

  function printPreview() {
    if (items.length === 0) { toast.error("Cart is empty"); return; }
    openPrintWindow(buildPrintHTML(buildCurrentPrintParams("PREVIEW", "PREVIEW")));
  }

  function printInvoice(snap: InvoiceSnapshot) {
    openPrintWindow(buildPrintHTML({
      ...snap,
      items: snap.items.map(i => ({ name: i.name, qty: i.qty, rate: i.rate, discount: i.discount, taxable: i.taxable })),
    }));
  }

  // ─── Complete bill ─────────────────────────────────────────────────────────
  async function completeBill() {
    if (items.length === 0) { toast.error("Cart is empty"); return; }

    // ── Customer validation ──────────────────────────────────────────────────
    if (!activeBill.clientId && !activeBill.isWalkIn) {
      toast.error("Please select or add a customer before billing");
      return;
    }
    if (activeBill.isWalkIn) {
      if (!activeBill.walkInName?.trim()) {
        toast.error("Enter customer name for walk-in");
        return;
      }
      if (!/^\d{10}$/.test(activeBill.clientPhone ?? "")) {
        toast.error("Walk-in customer phone must be exactly 10 digits");
        return;
      }
      if (walkInPhoneDupe) {
        toast.error(`${activeBill.clientPhone} already belongs to ${walkInPhoneDupe.name} — please use the existing client`);
        return;
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    if (!paymentMethod) { toast.error("Select a payment method"); return; }
    if (paymentMethod === "SPLIT") {
      const s1 = parseFloat(splitAmount1) || 0;
      const s2 = parseFloat(splitAmount2) || 0;
      if (Math.abs(s1 + s2 - totals.total) > 1) { toast.error(`Split amounts must sum to ${formatINR(totals.total)}`); return; }
    }
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: activeBill.clientId || null,
          walkInName: activeBill.walkInName || null,
          staffId: activeBill.staffId || null,
          items: items.map(item => {
            const gross = item.rate * item.quantity;
            const discAmt = item.discountType === "percent" ? gross * (item.discount / 100) : (item.discount || 0);
            const taxable = gross - discAmt;
            const halfGst = taxable * ((item.gstRate || 18) / 2 / 100);
            return { name: item.name, quantity: item.quantity, rate: item.rate, discount: discAmt, cgst: halfGst, sgst: halfGst, total: taxable + halfGst * 2 };
          }),
          subtotal: totals.subtotal,
          taxAmount: totals.gstAmount,
          discount: totals.overallDiscAmt + totals.loyaltyDiscount,
          tips: tips || 0,
          totalAmount: totals.total,
          amountPaid: totals.total,
          paymentMethod,
          status: "PAID",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save invoice");

      // Auto-mark appointment as COMPLETED when bill is done
      if (activeBill.appointmentId) {
        // Explicit link — mark that appointment directly
        fetch(`/api/appointments/${activeBill.appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "COMPLETED" }),
        }).catch(() => {});
      } else if (activeBill.clientId) {
        // No explicit link — find any IN_PROGRESS or CONFIRMED appointment
        // for this client today and auto-complete it
        const today = new Date().toISOString().split("T")[0];
        fetch(`/api/appointments?date=${today}`)
          .then((r) => r.json())
          .then((appts: any[]) => {
            if (!Array.isArray(appts)) return;
            const match = appts.find(
              (a) =>
                a.clientId === activeBill.clientId &&
                (a.status === "IN_PROGRESS" || a.status === "CONFIRMED" || a.status === "PENDING")
            );
            if (match) {
              fetch(`/api/appointments/${match.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "COMPLETED" }),
              }).catch(() => {});
            }
          })
          .catch(() => {});
      }

      const snap: InvoiceSnapshot = {
        invoiceNumber: data.invoiceNumber, date: new Date(),
        clientName: activeBill.clientName ?? activeBill.walkInName ?? "Walk-in",
        clientPhone: activeBill.clientPhone ?? selectedClient?.phone ?? "",
        staffName: staffList.find(s => s.id === activeBill.staffId)?.name ?? "",
        paymentMethod,
        items: items.map(item => {
          const gross = item.rate * item.quantity;
          const discAmt = item.discountType === "percent" ? gross * (item.discount / 100) : (item.discount || 0);
          const taxable = gross - discAmt;
          const halfGst = taxable * ((item.gstRate || 18) / 2 / 100);
          return { name: item.name, qty: item.quantity, rate: item.rate, discount: discAmt, gstRate: item.gstRate || 18, taxable, cgst: halfGst, sgst: halfGst, total: taxable + halfGst * 2 };
        }),
        subtotal: totals.subtotal, overallDiscount: totals.overallDiscAmt, loyaltyDiscount: totals.loyaltyDiscount,
        taxableAmount: totals.taxableAfterLoyalty, cgst: totals.cgst, sgst: totals.sgst, tips: tips || 0, grandTotal: totals.total,
      };
      setInvoiceSnap(snap);
      setShowSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to create invoice");
    }
  }

  function resetBill() {
    setShowSuccess(false);
    clearBill();
    setPaymentMethod("CASH");
    setCashReceived("");
    setUpiMarked(false);
    setCardLast4("");
    setSplitAmount1(""); setSplitAmount2("");
    setUseLoyalty(false);
    setSelectedClient(null);
    setClientSearch("");
    setLiveClients([]);
    setInvoiceSnap(null);
    setLinkedApptId(null);
  }

  function shareWhatsApp() {
    if (!selectedClient) { toast.error("No client selected for WhatsApp"); return; }
    if (!invoiceSnap) return;
    const msg = buildInvoiceWhatsAppMessage({ clientName: selectedClient.name, salonName: "SalonSoft Pro", invoiceNumber: invoiceSnap.invoiceNumber, date: new Date(), services: items.map(i => i.name), total: totals.total, paymentMethod });
    window.open(buildWhatsAppUrl(selectedClient.phone, msg), "_blank");
  }

  const change = useMemo(() => Math.max(0, (parseFloat(cashReceived) || 0) - totals.total), [cashReceived, totals.total]);
  const upiString = `upi://pay?pa=salonsoft@upi&pn=SalonSoft+Pro&am=${totals.total.toFixed(2)}&cu=INR`;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function renderClientSelector() {
    const hasSelection = !!activeBill.clientId;
    return (
      <div ref={clientRef} className="relative">
        {isWalkIn ? (
          /* Walk-in mode */
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-2">
                {/* Name */}
                <div className="flex items-center gap-2 border border-amber-300 rounded-lg px-3 py-2 bg-amber-50">
                  <User className="w-4 h-4 text-amber-500 shrink-0" />
                  <input
                    autoFocus
                    className="flex-1 outline-none text-sm bg-transparent placeholder:text-amber-400"
                    placeholder="Customer name *"
                    value={walkInName}
                    onChange={e => updateActiveBill({ walkInName: e.target.value })}
                  />
                </div>
                {/* Phone */}
                <div className={`flex items-center gap-2 border rounded-lg px-3 py-2 ${walkInPhoneDupe ? "border-orange-300 bg-orange-50" : "border-amber-300 bg-amber-50"}`}>
                  <span className="text-amber-500 text-sm font-medium shrink-0">📱</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className="flex-1 outline-none text-sm bg-transparent placeholder:text-amber-400"
                    placeholder="Phone number * (10 digits)"
                    value={walkInPhone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      updateActiveBill({ clientPhone: val || undefined });
                    }}
                  />
                  {walkInPhone.length === 10 && !walkInPhoneDupe && (
                    <span className="text-emerald-500 text-xs shrink-0">✓</span>
                  )}
                </div>
              </div>
              <button onClick={clearCustomer} className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors self-start mt-1" title="Remove walk-in">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Duplicate phone warning */}
            {walkInPhoneDupe && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs">
                <p className="text-orange-700 font-medium mb-1.5">
                  📋 {walkInPhone} is already registered as <strong>{walkInPhoneDupe.name}</strong>
                </p>
                <button
                  onClick={() => selectClient(walkInPhoneDupe)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-1.5 font-semibold transition-colors"
                >
                  Use existing client — {walkInPhoneDupe.name}
                </button>
              </div>
            )}
            {/* Phone length hint */}
            {walkInPhone.length > 0 && walkInPhone.length < 10 && !walkInPhoneDupe && (
              <p className="text-xs text-amber-600 pl-1">{10 - walkInPhone.length} more digit{10 - walkInPhone.length !== 1 ? "s" : ""} needed</p>
            )}
          </div>
        ) : hasSelection ? (
          /* Client selected */
          <div className="flex items-center gap-2 border border-emerald-300 rounded-lg px-3 py-2 bg-emerald-50">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(selectedClient?.name ?? "")}`}>
              {getInitials(selectedClient?.name ?? "")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate">{selectedClient?.name}</p>
              <p className="text-xs text-stone-500">{selectedClient?.phone}</p>
            </div>
            {selectedClient && selectedClient.loyaltyPoints > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                <Star className="w-3 h-3" />{selectedClient.loyaltyPoints} pts
              </div>
            )}
            <button onClick={clearCustomer} className="text-stone-400 hover:text-red-500 transition-colors ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Search mode */
          <>
            <div className="flex items-center gap-2 border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-amber-300 focus-within:border-amber-300 transition">
              <User className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                className="flex-1 outline-none text-sm placeholder:text-stone-400 bg-transparent"
                placeholder="Search client by name or phone…"
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); setShowNewClientForm(false); }}
                onFocus={() => setShowClientDropdown(true)}
              />
              {clientSearch && (
                <button onClick={() => { setClientSearch(""); setLiveClients([]); }} className="text-stone-300 hover:text-stone-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {showClientDropdown && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-[#E7E5E4] rounded-xl shadow-xl overflow-hidden">
                {/* Matching clients */}
                {liveClients.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto">
                    {liveClients.map(c => (
                      <button key={c.id} onMouseDown={e => { e.preventDefault(); selectClient(c); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 text-left transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${getAvatarColor(c.name)}`}>
                          {getInitials(c.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-800">{c.name}</p>
                          <p className="text-xs text-stone-400">{c.phone}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                          <Star className="w-3 h-3" />{c.loyaltyPoints} pts
                        </div>
                      </button>
                    ))}
                  </div>
                ) : clientSearch.trim() ? (
                  <div className="px-4 py-3 text-sm text-stone-400 text-center">No clients found for &ldquo;{clientSearch}&rdquo;</div>
                ) : null}

                {/* Divider + action buttons */}
                <div className={`border-t border-[#E7E5E4] ${showNewClientForm ? "" : "flex"}`}>
                  {!showNewClientForm ? (
                    <>
                      <button onMouseDown={e => { e.preventDefault(); setShowNewClientForm(true); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-blue-50 text-blue-600 text-sm font-medium transition-colors border-r border-[#E7E5E4]">
                        <UserPlus className="w-4 h-4" />Create New Client
                      </button>
                      <button onMouseDown={e => { e.preventDefault(); enterWalkIn(); }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 hover:bg-amber-50 text-amber-700 text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" />Add Walk-in
                      </button>
                    </>
                  ) : (
                    /* Inline new client form */
                    <div className="p-3 space-y-2">
                      <p className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-blue-500" />New Client
                      </p>
                      <input autoFocus className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)} />
                      {/* Phone with duplicate detection */}
                      <div>
                        <input
                          type="tel" inputMode="numeric" maxLength={10}
                          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${newPhoneDupe ? "border-orange-300 focus:ring-orange-300 bg-orange-50" : "border-[#E7E5E4] focus:ring-amber-300"}`}
                          placeholder="Phone * (10 digits)"
                          value={newPhone}
                          onChange={e => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        />
                        {newPhone.length > 0 && newPhone.length < 10 && (
                          <p className="text-xs text-stone-400 mt-0.5 pl-1">{10 - newPhone.length} more digit{10 - newPhone.length !== 1 ? "s" : ""} needed</p>
                        )}
                        {newPhoneDupe && (
                          <div className="mt-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-2 text-xs">
                            <p className="text-orange-700 font-medium mb-1">Already registered as <strong>{newPhoneDupe.name}</strong></p>
                            <button onMouseDown={e => { e.preventDefault(); selectClient(newPhoneDupe); setShowNewClientForm(false); setNewName(""); setNewPhone(""); setNewEmail(""); }}
                              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-md py-1 font-semibold transition-colors">
                              Use {newPhoneDupe.name} instead
                            </button>
                          </div>
                        )}
                      </div>
                      <input className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300" placeholder="Email (optional)" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                      <div className="flex gap-2">
                        <button onMouseDown={e => { e.preventDefault(); setShowNewClientForm(false); setNewName(""); setNewPhone(""); setNewEmail(""); setNewPhoneDupe(null); }}
                          className="flex-1 border border-[#E7E5E4] rounded-lg py-2 text-sm text-stone-500 hover:bg-stone-50 transition-colors">Cancel</button>
                        <button onMouseDown={e => { e.preventDefault(); saveNewClient(); }} disabled={savingClient || !!newPhoneDupe}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-semibold transition-colors">
                          {savingClient ? "Saving…" : "Save & Select"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function renderCartLeft() {
    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-stone-900">New Bill</h1>
            {linkedApptId ? (
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 text-amber-700 font-medium px-2.5 py-1 rounded-full">
                  <Link2 className="w-3 h-3" />Appointment Linked
                </span>
                <button
                  onClick={() => { setLinkedApptId(null); updateActiveBill({ appointmentId: undefined }); }}
                  className="text-stone-400 hover:text-red-500 transition"
                  title="Unlink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openApptModal}
                className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg transition font-medium"
              >
                <Link2 className="w-3.5 h-3.5" />Link Appointment
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Client</label>
              {renderClientSelector()}
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Staff</label>
              <div className="relative">
                <select className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  value={activeBill.staffId ?? ""} onChange={e => updateActiveBill({ staffId: e.target.value || undefined })}>
                  <option value="">Select staff…</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Services / Products */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm">
          <div className="flex border-b border-[#E7E5E4]">
            {(["services", "products"] as const).map(tab => (
              <button key={tab} onClick={() => setServiceTab(tab)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${serviceTab === tab ? "text-stone-900 border-b-2 border-amber-500" : "text-stone-400 hover:text-stone-600"}`}>
                {tab}
              </button>
            ))}
          </div>
          <div className="p-4">
            {serviceTab === "services" ? (
              <>
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                  <input className="w-full border border-[#E7E5E4] rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Search services…" value={serviceSearch} onChange={e => setServiceSearch(e.target.value)} />
                  {serviceSearch && (
                    <button onClick={() => setServiceSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Category chips — hide when searching */}
                {!serviceSearch && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={() => setActiveCategoryId("all")}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategoryId === "all" ? "bg-[#1C1917] text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                      All
                    </button>
                    {serviceCategories.map(cat => (
                      <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategoryId === cat.id ? "bg-[#1C1917] text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
                {filteredServices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-stone-400">
                    <Search className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm font-medium">{serviceSearch ? `No results for "${serviceSearch}"` : "No services yet"}</p>
                    {serviceSearch && <button onClick={() => setServiceSearch("")} className="mt-2 text-xs text-amber-600 hover:underline">Clear search</button>}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredServices.map(svc => (
                      <button key={svc.id} onClick={() => addService(svc)}
                        className="cursor-pointer hover:border-amber-400 rounded-xl border border-[#E7E5E4] p-3 transition-all text-left group hover:bg-amber-50">
                        <p className="text-sm font-medium text-stone-800 group-hover:text-amber-700 leading-tight">{svc.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="flex items-center gap-1 text-xs text-stone-400"><Clock className="w-3 h-3" />{svc.duration}m</span>
                          <span className="text-sm font-semibold text-stone-900">{formatINR(svc.price)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Product search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                  <input className="w-full border border-[#E7E5E4] rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="Search products…" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                  {productSearch && (
                    <button onClick={() => setProductSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-stone-400">
                    <Package className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No products in inventory</p>
                    <p className="text-xs mt-1">Add products in Inventory to sell them here</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-stone-400">
                    <Search className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-sm font-medium">No results for &ldquo;{productSearch}&rdquo;</p>
                    <button onClick={() => setProductSearch("")} className="mt-2 text-xs text-amber-600 hover:underline">Clear search</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map(p => (
                      <button key={p.id} onClick={() => addProduct(p)}
                        className="cursor-pointer hover:border-amber-400 rounded-xl border border-[#E7E5E4] p-3 transition-all text-left group hover:bg-amber-50">
                        <p className="text-sm font-medium text-stone-800 group-hover:text-amber-700 leading-tight">{p.name}</p>
                        {p.brand && <p className="text-xs text-stone-400 mt-0.5">{p.brand}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-stone-400">Stock: {p.stockLevel}</span>
                          <span className="text-sm font-semibold text-stone-900">{formatINR(p.sellingPrice)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cart items */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E7E5E4]">
              <ShoppingCart className="w-4 h-4 text-stone-500" />
              <span className="text-sm font-semibold text-stone-700">Cart ({items.length} item{items.length !== 1 ? "s" : ""})</span>
            </div>
            <div className="divide-y divide-[#E7E5E4]">
              {items.map(item => {
                const lineBase = item.rate * item.quantity;
                const lineDisc = item.discountType === "percent" ? lineBase * (item.discount / 100) : item.discount;
                const lineTotal = lineBase - lineDisc;
                return (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{item.name}</p>
                        {item.duration && (
                          <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{item.duration} min</p>
                        )}
                      </div>
                      <button onClick={() => removeCartItem(item.id)} className="text-stone-300 hover:text-red-500 transition-colors mt-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-stone-400 mb-1 block">Qty</label>
                        <div className="flex items-center border border-[#E7E5E4] rounded-lg overflow-hidden">
                          <button onClick={() => item.quantity > 1 ? updateCartItem(item.id, { quantity: item.quantity - 1 }) : removeCartItem(item.id)}
                            className="px-2 py-1.5 hover:bg-stone-100 text-stone-600"><Minus className="w-3 h-3" /></button>
                          <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                            className="px-2 py-1.5 hover:bg-stone-100 text-stone-600"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-stone-400 mb-1 block">Rate (₹)</label>
                        <input type="number" className="w-full border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                          value={item.rate} onChange={e => updateCartItem(item.id, { rate: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="text-xs text-stone-400 mb-1 block">Discount</label>
                        <div className="flex">
                          <input type="number" className="flex-1 border border-r-0 border-[#E7E5E4] rounded-l-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 w-0"
                            value={item.discount || ""} placeholder="0"
                            onChange={e => updateCartItem(item.id, { discount: parseFloat(e.target.value) || 0 })} />
                          <button onClick={() => updateCartItem(item.id, { discountType: item.discountType === "flat" ? "percent" : "flat", discount: 0 })}
                            className="border border-[#E7E5E4] rounded-r-lg px-2 py-1.5 text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-stone-600 shrink-0 w-8">
                            {item.discountType === "flat" ? "₹" : "%"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-stone-400 mb-1 block">Stylist</label>
                        <div className="relative">
                          <select className="w-full border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-xs bg-white appearance-none pr-6 focus:outline-none focus:ring-2 focus:ring-amber-300"
                            value={item.staffId ?? ""} onChange={e => updateCartItem(item.id, { staffId: e.target.value || undefined })}>
                            <option value="">—</option>
                            {staffList.map(s => <option key={s.id} value={s.id}>{s.name.split(" ")[0]}</option>)}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="text-sm font-semibold text-stone-700">{formatINR(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bill Summary */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4" />Bill Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span><span className="font-medium">{formatINR(totals.subtotal)}</span>
            </div>

            {/* Overall discount */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-stone-600">
                <div className="flex items-center gap-2 flex-1">
                  <Tag className="w-3.5 h-3.5 text-stone-400" />
                  <span>Discount</span>
                  <div className="flex ml-2">
                    <input type="number" className="w-20 border border-[#E7E5E4] rounded-l-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                      value={overallDiscount || ""} placeholder="0"
                      onChange={e => updateActiveBill({ overallDiscount: parseFloat(e.target.value) || 0 })} />
                    <button onClick={() => updateActiveBill({ overallDiscountType: overallDiscountType === "flat" ? "percent" : "flat", overallDiscount: 0 })}
                      className="border border-l-0 border-[#E7E5E4] rounded-r-md px-2.5 py-1 text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-stone-700">
                      {overallDiscountType === "flat" ? "₹" : "%"}
                    </button>
                  </div>
                </div>
                <span className="font-medium text-red-500">
                  {totals.overallDiscAmt > 0 ? `-${formatINR(totals.overallDiscAmt)}` : "—"}
                </span>
              </div>
              {/* Show ₹ equivalent when in % mode */}
              {overallDiscountType === "percent" && overallDiscount > 0 && (
                <p className="text-xs text-stone-400 ml-6">= {formatINR(totals.overallDiscAmt)} off subtotal</p>
              )}
            </div>

            {useLoyalty && totals.loyaltyDiscount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" />Loyalty Redemption</span>
                <span className="font-medium">-{formatINR(totals.loyaltyDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between text-stone-600">
              <span>Taxable Amount</span><span className="font-medium">{formatINR(totals.taxableAfterLoyalty)}</span>
            </div>
            <div className="flex justify-between text-stone-500 text-xs">
              <span>CGST (9%)</span><span>{formatINR(totals.cgst)}</span>
            </div>
            <div className="flex justify-between text-stone-500 text-xs">
              <span>SGST (9%)</span><span>{formatINR(totals.sgst)}</span>
            </div>

            <div className="flex items-center justify-between text-stone-600">
              <span>Tips</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-stone-400">₹</span>
                <input type="number" className="w-20 border border-[#E7E5E4] rounded-md px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-300"
                  value={tips || ""} placeholder="0" onChange={e => updateActiveBill({ tips: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="border-t border-[#E7E5E4] pt-3 mt-1 flex justify-between items-center">
              <span className="text-base font-bold text-stone-900">Grand Total</span>
              <span className="text-xl font-bold text-amber-600">{formatINR(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Mobile proceed */}
        <div className="lg:hidden">
          <button onClick={() => setMobileTab("pay")}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors">
            Proceed to Pay →
          </button>
        </div>
      </div>
    );
  }

  function renderPaymentPanel() {
    const paymentOptions: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
      { id: "CASH", label: "Cash", icon: <Banknote className="w-5 h-5" /> },
      { id: "UPI", label: "UPI", icon: <Smartphone className="w-5 h-5" /> },
      { id: "CARD", label: "Card", icon: <CreditCard className="w-5 h-5" /> },
      { id: "LINK", label: "Link", icon: <Link2 className="w-5 h-5" /> },
      { id: "BANK", label: "Bank", icon: <Building2 className="w-5 h-5" /> },
      { id: "SPLIT", label: "Split", icon: <Scissors className="w-5 h-5" /> },
    ];
    return (
      <div className="flex flex-col gap-4">
        {/* Customer summary strip */}
        {(activeBill.clientName || activeBill.walkInName) && (
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm px-4 py-3 flex items-center gap-3">
            <User className="w-4 h-4 text-stone-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate">
                {activeBill.clientName ?? activeBill.walkInName}
                {activeBill.isWalkIn && <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Walk-in</span>}
              </p>
              {activeBill.clientPhone && <p className="text-xs text-stone-400">{activeBill.clientPhone}</p>}
            </div>
          </div>
        )}

        {/* Payment methods */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
          <h2 className="text-base font-semibold text-stone-800 mb-4">Payment Method</h2>
          <div className="grid grid-cols-3 gap-3">
            {paymentOptions.map(opt => (
              <button key={opt.id} onClick={() => setPaymentMethod(opt.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === opt.id ? "border-amber-500 bg-amber-50 text-amber-700" : "border-[#E7E5E4] text-stone-500 hover:border-stone-300 hover:bg-stone-50"}`}>
                {opt.icon}
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4">
            {paymentMethod === "CASH" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Amount Received</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium">₹</span>
                    <input type="number" className="w-full border border-[#E7E5E4] rounded-lg pl-7 pr-3 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-amber-300"
                      placeholder="0" value={cashReceived} onChange={e => setCashReceived(e.target.value)} />
                  </div>
                </div>
                {parseFloat(cashReceived) > 0 && (
                  <div className={`flex justify-between items-center px-4 py-2.5 rounded-lg ${change > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    <span className="text-sm font-medium">{change >= 0 ? "Change to return" : "Amount short"}</span>
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
                <p className="text-xs text-stone-400 text-center">Scan to pay {formatINR(totals.total)}</p>
                <button onClick={() => { setUpiMarked(true); toast.success("UPI payment marked as received"); }}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${upiMarked ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-amber-500 hover:bg-amber-600 text-white"}`}>
                  {upiMarked ? "✓ Received" : "Mark as Received"}
                </button>
              </div>
            )}
            {paymentMethod === "CARD" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-500 mb-1">Card Last 4 Digits (optional)</label>
                  <input type="text" maxLength={4} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    placeholder="XXXX" value={cardLast4} onChange={e => setCardLast4(e.target.value.replace(/\D/g, ""))} />
                </div>
                <button onClick={() => toast.success("Card payment approved")}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold">Approve</button>
              </div>
            )}
            {paymentMethod === "LINK" && (
              <div className="text-center py-4">
                <p className="text-sm text-stone-500 mb-3">Send payment link to customer&apos;s phone</p>
                <button onClick={() => toast.success("Payment link sent!")}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">Send Payment Link</button>
              </div>
            )}
            {paymentMethod === "BANK" && (
              <div className="text-center py-4">
                <p className="text-sm text-stone-500 mb-1">Bank Transfer</p>
                <p className="text-xs text-stone-400">Mark as paid once transfer is confirmed</p>
              </div>
            )}
            {paymentMethod === "SPLIT" && (
              <div className="space-y-3 mt-1">
                <p className="text-xs text-stone-500">Split payment across two methods</p>
                {[{ method: splitMethod1, setMethod: setSplitMethod1, amount: splitAmount1, setAmount: setSplitAmount1, label: "Payment 1" },
                  { method: splitMethod2, setMethod: setSplitMethod2, amount: splitAmount2, setAmount: setSplitAmount2, label: "Payment 2" }
                ].map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="relative w-24 shrink-0">
                      <select className="w-full border border-[#E7E5E4] rounded-lg px-2 py-2 text-xs bg-white appearance-none pr-5 focus:outline-none focus:ring-1 focus:ring-amber-300"
                        value={row.method} onChange={e => row.setMethod(e.target.value as "CASH"|"UPI"|"CARD")}>
                        <option value="CASH">Cash</option><option value="UPI">UPI</option><option value="CARD">Card</option>
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">₹</span>
                      <input type="number" className="w-full border border-[#E7E5E4] rounded-lg pl-5 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                        placeholder={row.label} value={row.amount} onChange={e => row.setAmount(e.target.value)} />
                    </div>
                  </div>
                ))}
                {splitAmount1 && splitAmount2 && (
                  <div className={`text-xs px-3 py-1.5 rounded-lg ${Math.abs((parseFloat(splitAmount1)||0)+(parseFloat(splitAmount2)||0)-totals.total) < 1 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {Math.abs((parseFloat(splitAmount1)||0)+(parseFloat(splitAmount2)||0)-totals.total) < 1
                      ? "✓ Amounts balance"
                      : `Difference: ${formatINR(Math.abs((parseFloat(splitAmount1)||0)+(parseFloat(splitAmount2)||0)-totals.total))}`}
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
                <div className="flex items-center gap-2 mb-1"><Star className="w-4 h-4 text-amber-500" /><span className="text-sm font-semibold text-stone-800">Loyalty Points</span></div>
                <p className="text-xs text-stone-500">
                  {selectedClient.name} has <span className="font-semibold text-amber-600">{selectedClient.loyaltyPoints} pts</span> = {formatINR(selectedClient.loyaltyPoints / 2)} redeemable
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={useLoyalty} onChange={e => setUseLoyalty(e.target.checked)} />
                <div className="w-11 h-6 bg-stone-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            {useLoyalty && (
              <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg">
                Redeeming {formatINR(Math.min(selectedClient.loyaltyPoints / 2, totals.taxable))} as discount
              </div>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-4 sticky bottom-0">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => toast.success("Draft saved")}
              className="flex items-center justify-center gap-1.5 border border-[#E7E5E4] text-stone-600 hover:bg-stone-50 font-medium py-2.5 rounded-xl text-sm transition-colors">
              Save Draft
            </button>
            <button onClick={printPreview}
              className="flex items-center justify-center gap-1.5 border border-[#E7E5E4] text-stone-600 hover:bg-stone-50 font-medium py-2.5 rounded-xl text-sm transition-colors">
              <Printer className="w-4 h-4" />Preview
            </button>
            <button onClick={completeBill}
              className="col-span-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              Complete →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* Mobile tabs */}
      <div className="lg:hidden flex border-b border-[#E7E5E4] bg-white mb-4 rounded-xl overflow-hidden">
        <button onClick={() => setMobileTab("cart")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mobileTab === "cart" ? "bg-amber-500 text-white" : "text-stone-500 hover:text-stone-700"}`}>
          <ShoppingCart className="w-4 h-4" />Cart
          {items.length > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${mobileTab === "cart" ? "bg-white text-amber-600" : "bg-amber-500 text-white"}`}>{items.length}</span>}
        </button>
        <button onClick={() => setMobileTab("pay")}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${mobileTab === "pay" ? "bg-amber-500 text-white" : "text-stone-500 hover:text-stone-700"}`}>
          <CreditCard className="w-4 h-4" />Pay
        </button>
      </div>

      {/* Desktop split panel */}
      <div className="hidden lg:flex gap-6 h-full">
        <div className="flex-1 min-w-0 overflow-y-auto pb-6">{renderCartLeft()}</div>
        <div className="w-[380px] shrink-0 overflow-y-auto pb-6">{renderPaymentPanel()}</div>
      </div>

      {/* Mobile single panel */}
      <div className="lg:hidden">
        {mobileTab === "cart" ? renderCartLeft() : renderPaymentPanel()}
      </div>

      {/* ─── Link Appointment Modal ───────────────────────────────────────── */}
      {showApptModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowApptModal(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E4]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-[#1C1917] text-base">Link Appointment</h2>
              </div>
              <button onClick={() => setShowApptModal(false)} className="p-1.5 hover:bg-[#F5F5F4] rounded-lg transition">
                <X className="w-4 h-4 text-[#78716C]" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingAppts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                </div>
              ) : apptModalList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                    <Calendar className="w-5 h-5 text-stone-400" />
                  </div>
                  <p className="text-sm font-medium text-stone-700">No pending appointments today</p>
                  <p className="text-xs text-stone-400 mt-1">Only Confirmed / In Progress appointments can be linked</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-stone-400 mb-3">Select an appointment to auto-fill client, staff and services</p>
                  {apptModalList.map((appt) => {
                    const isLinking = linkingId === appt.id;
                    const isLinked = linkedApptId === appt.id;
                    return (
                      <button
                        key={appt.id}
                        onClick={() => !isLinking && !isLinked && linkAppointment(appt.id)}
                        disabled={isLinking}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                          isLinked
                            ? "border-amber-400 bg-amber-50"
                            : "border-[#E7E5E4] hover:border-amber-300 hover:bg-amber-50/40"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <span className="text-amber-700 text-xs font-bold">
                            {appt.clientName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-[#1C1917] truncate">{appt.clientName}</p>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full shrink-0">
                              {appt.time}
                            </span>
                          </div>
                          <p className="text-xs text-[#78716C] truncate mt-0.5">{appt.serviceName}</p>
                          {appt.staffName && (
                            <p className="text-[10px] text-stone-400 mt-0.5">with {appt.staffName}</p>
                          )}
                        </div>
                        {/* Right */}
                        <div className="shrink-0 text-right">
                          {isLinking ? (
                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          ) : isLinked ? (
                            <CheckCircle2 className="w-4 h-4 text-amber-500" />
                          ) : (
                            <span className="text-xs font-semibold text-[#1C1917]">{formatINR(appt.amount)}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Invoice Receipt Modal ─────────────────────────────────────────── */}
      {showSuccess && invoiceSnap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {}} />
          <div className="relative w-full max-w-md z-10 flex flex-col max-h-[95vh]">

            {/* Action bar */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold text-sm">Invoice Created!</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => printInvoice(invoiceSnap)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-stone-700 rounded-lg text-xs font-medium transition">
                  <Printer className="w-3.5 h-3.5" />Print
                </button>
                <button onClick={shareWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition">
                  <MessageCircle className="w-3.5 h-3.5" />WhatsApp
                </button>
                <button onClick={resetBill} className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Invoice receipt */}
            <div ref={invoiceRef} className="bg-white rounded-2xl shadow-2xl overflow-y-auto">
              <div className="text-center px-6 pt-6 pb-4 border-b border-dashed border-stone-200">
                <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <p className="font-bold text-stone-900 text-base">SalonSoft Pro</p>
                <p className="text-xs text-stone-500 mt-0.5">Tax Invoice</p>
              </div>

              <div className="px-6 py-3 flex justify-between text-xs border-b border-stone-100">
                <div><p className="text-stone-400 mb-0.5">Invoice No.</p><p className="font-semibold text-stone-900">{invoiceSnap.invoiceNumber}</p></div>
                <div className="text-right"><p className="text-stone-400 mb-0.5">Date</p>
                  <p className="font-semibold text-stone-900">{invoiceSnap.date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>

              <div className="px-6 py-3 flex justify-between text-xs border-b border-stone-100">
                <div>
                  <p className="text-stone-400 mb-0.5">Bill To</p>
                  <p className="font-semibold text-stone-900">{invoiceSnap.clientName}</p>
                  {invoiceSnap.clientPhone && <p className="text-stone-500">{invoiceSnap.clientPhone}</p>}
                  {activeBill.isWalkIn && <p className="text-amber-600 text-xs">Walk-in</p>}
                </div>
                {invoiceSnap.staffName && (
                  <div className="text-right"><p className="text-stone-400 mb-0.5">Served By</p><p className="font-semibold text-stone-900">{invoiceSnap.staffName}</p></div>
                )}
              </div>

              <div className="px-6 py-3 border-b border-stone-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left text-stone-400 font-medium pb-2">Item</th>
                      <th className="text-center text-stone-400 font-medium pb-2">Qty</th>
                      <th className="text-right text-stone-400 font-medium pb-2">Rate</th>
                      <th className="text-right text-stone-400 font-medium pb-2">Disc</th>
                      <th className="text-right text-stone-400 font-medium pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceSnap.items.map((item, i) => (
                      <tr key={i} className="border-b border-stone-50">
                        <td className="py-2 text-stone-800 font-medium">{item.name}</td>
                        <td className="py-2 text-center text-stone-600">{item.qty}</td>
                        <td className="py-2 text-right text-stone-600">{formatINR(item.rate)}</td>
                        <td className="py-2 text-right text-red-500">{item.discount > 0 ? `-${formatINR(item.discount)}` : "—"}</td>
                        <td className="py-2 text-right font-semibold text-stone-900">{formatINR(item.taxable)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 space-y-1.5 text-xs border-b border-stone-100">
                <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{formatINR(invoiceSnap.subtotal)}</span></div>
                {invoiceSnap.overallDiscount > 0 && (
                  <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatINR(invoiceSnap.overallDiscount)}</span></div>
                )}
                {invoiceSnap.loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-600"><span>Loyalty Redemption</span><span>-{formatINR(invoiceSnap.loyaltyDiscount)}</span></div>
                )}
                <div className="flex justify-between text-stone-600"><span>Taxable Amount</span><span>{formatINR(invoiceSnap.taxableAmount)}</span></div>
                <div className="flex justify-between text-stone-400"><span>CGST (9%)</span><span>{formatINR(invoiceSnap.cgst)}</span></div>
                <div className="flex justify-between text-stone-400"><span>SGST (9%)</span><span>{formatINR(invoiceSnap.sgst)}</span></div>
                {invoiceSnap.tips > 0 && <div className="flex justify-between text-stone-600"><span>Tips</span><span>{formatINR(invoiceSnap.tips)}</span></div>}
                <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                  <span className="font-bold text-stone-900 text-sm">Grand Total</span>
                  <span className="font-bold text-amber-600 text-lg">{formatINR(invoiceSnap.grandTotal)}</span>
                </div>
              </div>

              <div className="px-6 py-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-full text-xs font-medium">
                  {invoiceSnap.paymentMethod === "CASH" && <Banknote className="w-3.5 h-3.5" />}
                  {invoiceSnap.paymentMethod === "UPI" && <Smartphone className="w-3.5 h-3.5" />}
                  {invoiceSnap.paymentMethod === "CARD" && <CreditCard className="w-3.5 h-3.5" />}
                  {invoiceSnap.paymentMethod === "LINK" && <Link2 className="w-3.5 h-3.5" />}
                  {invoiceSnap.paymentMethod === "BANK" && <Building2 className="w-3.5 h-3.5" />}
                  {invoiceSnap.paymentMethod === "SPLIT" && <Scissors className="w-3.5 h-3.5" />}
                  Paid via {invoiceSnap.paymentMethod}
                </span>
                <p className="text-xs text-stone-400 mt-3">Thank you for visiting! ✂️</p>
              </div>

              <div className="px-6 pb-5">
                <button onClick={resetBill}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  New Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
