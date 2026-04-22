"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, Star, Calendar, TrendingUp,
  MessageCircle, Edit2, Gift, Clock, Scissors, Loader2,
} from "lucide-react";
import { formatINR, formatDate, getInitials, getAvatarColor, buildWhatsAppUrl } from "@/lib/utils";

type InvoiceItem = { id: string; description: string; quantity: number; rate: number; total: number };
type Invoice = {
  id: string; invoiceNumber: string; date: string; status: string;
  totalAmount: number; amountPaid: number; paymentMethod: string | null;
  staff: { name: string } | null;
  items: InvoiceItem[];
};
type Client = {
  id: string; name: string; phone: string; email: string | null; gender: string | null;
  loyaltyPoints: number; totalSpent: number; visitCount: number; lastVisit: string | null;
  createdAt: string;
  invoices: Invoice[];
};

function getTierInfo(points: number) {
  if (points >= 500) return { label: "Gold", color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
  if (points >= 200) return { label: "Silver", color: "bg-stone-100 text-stone-600", dot: "bg-stone-400" };
  return { label: "Bronze", color: "bg-orange-100 text-orange-700", dot: "bg-orange-400" };
}

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        setClient(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-[#78716C]">Client not found.</p>
        <Link href="/clients" className="text-[#D97706] font-medium hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
      </div>
    );
  }

  const tier = getTierInfo(client.loyaltyPoints);
  const avgSpend = client.visitCount > 0 ? Math.round(client.totalSpent / client.visitCount) : 0;
  const waMsg = `Hi ${client.name}! 👋 Hope you are doing well! We would love to see you again at SalonSoft Pro. Book your next appointment today! ✨`;
  const waUrl = buildWhatsAppUrl(client.phone, waMsg);
  const memberSince = new Date(client.createdAt).getFullYear();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#1C1917] transition">
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className={`w-20 h-20 rounded-2xl ${getAvatarColor(client.name)} flex items-center justify-center text-white font-bold text-2xl shrink-0`}>
            {getInitials(client.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {client.name}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${tier.color}`}>
                <span className={`w-2 h-2 rounded-full ${tier.dot}`} />
                {tier.label} Member
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-[#78716C]">
              <a href={`tel:${client.phone}`} className="flex items-center gap-1.5 hover:text-[#1C1917]">
                <Phone className="w-4 h-4" /> {client.phone}
              </a>
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-[#1C1917]">
                  <Mail className="w-4 h-4" /> {client.email}
                </a>
              )}
              {client.gender && <span>{client.gender}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <button className="flex items-center gap-2 px-3 py-2 border border-[#E7E5E4] text-[#78716C] rounded-xl text-sm font-medium hover:bg-[#FAFAF9] transition">
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Visits", value: client.visitCount, icon: Calendar, color: "bg-blue-50 text-blue-600" },
          { label: "Total Spent", value: formatINR(client.totalSpent), icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
          { label: "Avg per Visit", value: formatINR(avgSpend), icon: Scissors, color: "bg-purple-50 text-purple-600" },
          { label: "Loyalty Points", value: client.loyaltyPoints, icon: Star, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
            <p className="text-[#78716C] text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bottom two-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visit History */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4]">
            <div>
              <h2 className="font-semibold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Visit History
              </h2>
              <p className="text-xs text-[#78716C] mt-0.5">{client.invoices.length} visits recorded</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          {client.invoices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F5F5F4] flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-5 h-5 text-[#A8A29E]" />
              </div>
              <p className="text-[#78716C] text-sm font-medium">No visits recorded yet</p>
              <p className="text-[#A8A29E] text-xs mt-1">Client's visit history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E5E4]">
              {client.invoices.map((inv) => {
                const d = new Date(inv.date);
                const day = d.getDate();
                const month = d.toLocaleString("en-IN", { month: "short" });
                const year = d.getFullYear();
                const nowYear = new Date().getFullYear();
                return (
                  <div key={inv.id} className="flex items-start gap-4 p-4 hover:bg-[#FAFAF9] transition group">
                    {/* Date column */}
                    <div className="shrink-0 w-12 text-center">
                      <div className="text-xl font-bold text-[#1C1917] leading-none">{day}</div>
                      <div className="text-xs text-[#78716C] mt-0.5">{month}</div>
                      {year !== nowYear && <div className="text-xs text-[#A8A29E]">{year}</div>}
                    </div>

                    {/* Divider dot */}
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <div className={`w-3 h-3 rounded-full border-2 ${inv.status === "PAID" ? "border-emerald-500 bg-emerald-100" : "border-amber-400 bg-amber-100"}`} />
                      <div className="w-px flex-1 bg-[#E7E5E4] mt-1 min-h-[20px]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      {/* Staff badge */}
                      {inv.staff && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-5 h-5 rounded-full bg-[#1C1917] flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">
                              {inv.staff.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-[#1C1917]">{inv.staff.name}</span>
                          <span className="text-xs text-[#A8A29E]">· served</span>
                        </div>
                      )}

                      {/* Service chips */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {inv.items.length > 0 ? inv.items.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">
                            <Scissors className="w-3 h-3 text-amber-500 shrink-0" />
                            {item.description}
                          </span>
                        )) : (
                          <span className="text-xs text-[#78716C]">Visit</span>
                        )}
                      </div>

                      {/* Invoice ref */}
                      <p className="text-xs text-[#A8A29E]">{inv.invoiceNumber}</p>
                    </div>

                    {/* Amount + status */}
                    <div className="shrink-0 text-right">
                      <p className="font-bold text-[#1C1917] text-sm">{formatINR(inv.totalAmount)}</p>
                      <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${
                        inv.status === "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : inv.status === "OVERDUE"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {inv.status}
                      </span>
                      {inv.amountPaid < inv.totalAmount && inv.status !== "PAID" && (
                        <p className="text-[10px] text-amber-600 mt-0.5">Due {formatINR(inv.totalAmount - inv.amountPaid)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Loyalty Card */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Loyalty Points</h3>
              <Gift className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-4xl font-bold mb-1">{client.loyaltyPoints}</p>
            <p className="text-amber-100 text-sm">≈ {formatINR(Math.floor(client.loyaltyPoints / 100) * 50)} redeemable</p>
            <div className="mt-4 h-1.5 bg-amber-400/50 rounded-full">
              <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, (client.loyaltyPoints % 500) / 5)}%` }} />
            </div>
            <p className="text-amber-100 text-xs mt-1.5">
              {Math.max(0, 500 - (client.loyaltyPoints % 500))} points to next {tier.label === "Gold" ? "Gold renewal" : tier.label === "Silver" ? "Gold" : "Silver"}
            </p>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5">
            <h3 className="font-semibold text-[#1C1917] mb-3 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Quick Info
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#78716C]">Last visit</span>
                <span className="font-medium text-[#1C1917]">
                  {client.lastVisit ? formatDate(new Date(client.lastVisit)) : "Never"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#78716C]">Member since</span>
                <span className="font-medium text-[#1C1917]">{memberSince}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#78716C]">Total invoices</span>
                <span className="font-medium text-[#1C1917]">{client.invoices.length}</span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 space-y-2">
            <h3 className="font-semibold text-[#1C1917] mb-3 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Quick Actions
            </h3>
            <Link href="/appointments"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[#FAFAF9] transition text-sm text-[#1C1917]">
              <Calendar className="w-4 h-4 text-[#D97706]" />
              Book Appointment
            </Link>
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[#FAFAF9] transition text-sm text-[#1C1917]">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              Send WhatsApp
            </a>
            <Link href="/finance/billing"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[#FAFAF9] transition text-sm text-[#1C1917]">
              <Clock className="w-4 h-4 text-blue-500" />
              Create Bill
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
