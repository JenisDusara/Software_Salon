"use client";
import { useState, useEffect, useCallback } from "react";
import { Users, Search, Plus, Phone, Star, TrendingUp, X, Mail, User, Loader2 } from "lucide-react";
import { formatINR, formatDate, getInitials, getAvatarColor } from "@/lib/utils";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

type Client = {
  id: string; name: string; phone: string; email: string | null; gender: string | null;
  loyaltyPoints: number; totalSpent: number; visitCount: number; lastVisit: string | null;
};

type NewClient = { name: string; phone: string; email: string; gender: "Male" | "Female" | "Other" | "" };
const DEFAULT_CLIENT: NewClient = { name: "", phone: "", email: "", gender: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewClient>(DEFAULT_CLIENT);
  const [errors, setErrors] = useState<Partial<NewClient>>({});
  const [saving, setSaving] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/clients${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load clients"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchClients(), 300);
    return () => clearTimeout(t);
  }, [fetchClients]);

  function validate() {
    const e: Partial<NewClient> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = "Enter valid 10-digit phone";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter valid email";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim(), email: form.email || null, gender: form.gender || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(`${form.name} added!`);
      setShowModal(false);
      setForm(DEFAULT_CLIENT);
      setErrors({});
      fetchClients();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  const avgSpend = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + c.totalSpent, 0) / clients.length) : 0;
  const newThisMonth = clients.filter((c) => {
    if (!c.lastVisit) return false;
    const d = new Date(c.lastVisit);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Clients</h1>
          <p className="text-[#78716C] text-sm mt-0.5">{clients.length} total clients</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[#D97706] text-white rounded-xl font-medium hover:bg-amber-600 transition text-sm shrink-0">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Client</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: clients.length, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Active (30d)", value: clients.filter((c) => c.lastVisit && (Date.now() - new Date(c.lastVisit).getTime()) < 30 * 86400000).length, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
          { label: "Avg Spend", value: formatINR(avgSpend), icon: Star, color: "bg-amber-50 text-amber-600" },
          { label: "New This Month", value: newThisMonth, icon: Plus, color: "bg-purple-50 text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
            <p className="text-[#78716C] text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
        <input type="text" placeholder="Search clients by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-[#E7E5E4] rounded-xl bg-white text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <div key={client.id} className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 hover:border-[#D97706] transition">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full ${getAvatarColor(client.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {getInitials(client.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#1C1917] truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{client.name}</h3>
                    {client.gender && <span className="text-xs text-[#78716C] shrink-0">{client.gender}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Phone className="w-3 h-3 text-[#78716C]" />
                    <span className="text-[#78716C] text-xs">{client.phone}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-[#E7E5E4]">
                <div className="text-center"><p className="text-[#1C1917] font-semibold text-sm">{client.visitCount}</p><p className="text-[#78716C] text-xs">Visits</p></div>
                <div className="text-center"><p className="text-[#1C1917] font-semibold text-sm">{formatINR(client.totalSpent)}</p><p className="text-[#78716C] text-xs">Spent</p></div>
                <div className="text-center"><p className="text-[#D97706] font-semibold text-sm">{client.loyaltyPoints}</p><p className="text-[#78716C] text-xs">Points</p></div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[#78716C]">Last: {client.lastVisit ? formatDate(new Date(client.lastVisit)) : "Never"}</span>
                <Link href={`/clients/${client.id}`} className="text-xs text-[#D97706] font-medium hover:underline">View Profile →</Link>
              </div>
            </div>
          ))}
          {clients.length === 0 && <div className="col-span-full text-center py-12 text-[#78716C]">No clients found</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4] sticky top-0 bg-white z-10">
              <h2 className="font-bold text-[#1C1917] text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Add New Client</h2>
              <button onClick={() => { setShowModal(false); setErrors({}); setForm(DEFAULT_CLIENT); }} className="p-2 hover:bg-[#F5F5F4] rounded-lg"><X className="w-5 h-5 text-[#78716C]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Priya Sharma"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.name ? "border-red-400" : "border-[#E7E5E4]"}`} />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Phone <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/, "") }))} placeholder="9876543210" maxLength={10}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.phone ? "border-red-400" : "border-[#E7E5E4]"}`} />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Email (optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="priya@gmail.com"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.email ? "border-red-400" : "border-[#E7E5E4]"}`} />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Gender</label>
                <div className="flex gap-2">
                  {(["Female", "Male", "Other"] as const).map((g) => (
                    <button key={g} type="button" onClick={() => setForm((f) => ({ ...f, gender: g }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition ${form.gender === g ? "bg-[#1C1917] text-white border-[#1C1917]" : "border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]"}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowModal(false); setErrors({}); setForm(DEFAULT_CLIENT); }}
                  className="flex-1 py-2.5 border border-[#E7E5E4] rounded-xl text-sm font-medium text-[#78716C] hover:bg-[#F5F5F4] transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-[#D97706] text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
