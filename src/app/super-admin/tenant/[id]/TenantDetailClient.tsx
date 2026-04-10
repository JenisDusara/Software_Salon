"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Users, Receipt, Scissors,
  TrendingUp, UserCheck, Phone, Mail, Calendar,
  CheckCircle, XCircle, RefreshCcw, Trash2, Edit3,
  IndianRupee, LogOut, LayoutDashboard
} from "lucide-react";
import { signOut } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

const PLANS = ["TRIAL", "BASIC", "PRO", "ENTERPRISE"];

const planColor: Record<string, string> = {
  TRIAL: "bg-stone-100 text-stone-600",
  BASIC: "bg-blue-100 text-blue-700",
  PRO: "bg-amber-100 text-amber-700",
  ENTERPRISE: "bg-purple-100 text-purple-700",
};

type TenantDetail = {
  tenant: {
    id: string; businessName: string; ownerName: string; ownerEmail: string;
    ownerPhone: string | null; city: string | null; subscriptionPlan: string;
    isActive: boolean; createdAt: string;
    branches: { id: string; name: string; city: string | null }[];
  };
  staff: { id: string; name: string | null; email: string | null; phone: string | null; role: string; isActive: boolean; createdAt: string }[];
  clients: { id: string; name: string; phone: string; totalSpent: number; visitCount: number; lastVisit: string | null; createdAt: string }[];
  invoices: { id: string; invoiceNumber: string; totalAmount: number; status: string; paymentMethod: string | null; date: string; client: { name: string } | null; walkInName: string | null }[];
  services: { id: string; name: string; price: number; duration: number; isActive: boolean }[];
  stats: { totalRevenue: number; totalInvoices: number; totalClients: number; totalStaff: number; monthRevenue: number };
};

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const [data, setData] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "clients" | "staff" | "invoices" | "services">("overview");
  const [editingPlan, setEditingPlan] = useState(false);
  const [newPlan, setNewPlan] = useState("");
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setData(json);
      setNewPlan(json.tenant.subscriptionPlan);
    } catch {
      toast.error("Failed to load tenant data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleToggleActive() {
    if (!data) return;
    const newStatus = !data.tenant.isActive;
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(newStatus ? "Tenant activated" : "Tenant deactivated");
      fetchData();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handlePlanChange() {
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionPlan: newPlan }),
      });
      if (!res.ok) throw new Error();
      toast.success("Plan updated");
      setEditingPlan(false);
      fetchData();
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setSaving(false);
    }
  }

  async function handleManageDashboard() {
    if (!data) return;
    setSwitching(true);
    try {
      const res = await fetch("/api/super-admin/switch-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: data.tenant.id, businessName: data.tenant.businessName }),
      });
      if (!res.ok) throw new Error();
      router.push("/dashboard");
    } catch {
      toast.error("Failed to switch tenant");
      setSwitching(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to DELETE "${data?.tenant.businessName}"? This will remove ALL their data permanently.`)) return;
    try {
      const res = await fetch(`/api/super-admin/tenants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Tenant deleted");
      router.push("/super-admin");
    } catch {
      toast.error("Failed to delete");
    }
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-[#78716C]">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-red-500">Failed to load tenant</div>
      </div>
    );
  }

  const { tenant, staff, clients, invoices, services, stats } = data;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "clients", label: `Clients (${clients.length})` },
    { key: "staff", label: `Staff (${staff.length})` },
    { key: "invoices", label: `Invoices (${invoices.length})` },
    { key: "services", label: `Services (${services.length})` },
  ] as const;

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-[#1C1917] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/super-admin")} className="text-stone-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D97706] rounded-lg flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">{tenant.businessName}</p>
              <p className="text-stone-400 text-xs">Super Admin — Tenant Detail</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-3 py-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition text-sm"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tenant Info Bar */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 mb-6">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1C1917] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg">{tenant.businessName.charAt(0)}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-lg font-bold text-[#1C1917]">{tenant.businessName}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColor[tenant.subscriptionPlan] ?? "bg-stone-100 text-stone-600"}`}>
                    {tenant.subscriptionPlan}
                  </span>
                  {tenant.isActive
                    ? <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="w-3 h-3" /> Active</span>
                    : <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="w-3 h-3" /> Inactive</span>
                  }
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-[#78716C]">
                  {tenant.ownerEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{tenant.ownerEmail}</span>}
                  {tenant.ownerPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{tenant.ownerPhone}</span>}
                  {tenant.city && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{tenant.city}</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {fmtDate(tenant.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={fetchData} className="p-2 text-[#78716C] hover:bg-[#F5F5F4] rounded-lg transition">
                <RefreshCcw className="w-4 h-4" />
              </button>

              {/* Manage Dashboard — impersonate this tenant */}
              <button
                onClick={handleManageDashboard}
                disabled={switching}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#D97706] text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-60"
              >
                <LayoutDashboard className="w-4 h-4" />
                {switching ? "Opening..." : "Manage Dashboard"}
              </button>

              {/* Plan change */}
              {editingPlan ? (
                <div className="flex items-center gap-2">
                  <select
                    value={newPlan}
                    onChange={e => setNewPlan(e.target.value)}
                    className="text-sm border border-[#E7E5E4] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  >
                    {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button onClick={handlePlanChange} disabled={saving}
                    className="px-3 py-1.5 bg-[#D97706] text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition disabled:opacity-60">
                    Save
                  </button>
                  <button onClick={() => setEditingPlan(false)} className="px-3 py-1.5 bg-[#F5F5F4] text-[#78716C] rounded-lg text-sm">
                    Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingPlan(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E7E5E4] text-[#1C1917] rounded-lg text-sm hover:bg-[#F5F5F4] transition">
                  <Edit3 className="w-3.5 h-3.5" /> Change Plan
                </button>
              )}

              <button onClick={handleToggleActive} disabled={saving}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-60 ${
                  tenant.isActive
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                }`}>
                {tenant.isActive ? <><XCircle className="w-3.5 h-3.5" /> Deactivate</> : <><CheckCircle className="w-3.5 h-3.5" /> Activate</>}
              </button>

              <button onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Revenue", value: fmt(stats.totalRevenue), icon: IndianRupee, color: "text-emerald-600" },
            { label: "This Month", value: fmt(stats.monthRevenue), icon: TrendingUp, color: "text-blue-600" },
            { label: "Total Invoices", value: stats.totalInvoices, icon: Receipt, color: "text-amber-600" },
            { label: "Clients", value: stats.totalClients, icon: Users, color: "text-purple-600" },
            { label: "Staff", value: stats.totalStaff, icon: UserCheck, color: "text-[#1C1917]" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-[#E7E5E4] p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#78716C] uppercase tracking-wide">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm">
          <div className="flex gap-1 p-2 border-b border-[#E7E5E4] overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === t.key
                    ? "bg-[#1C1917] text-white"
                    : "text-[#78716C] hover:bg-[#F5F5F4]"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Branches */}
                <div>
                  <h3 className="font-semibold text-[#1C1917] mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Branches ({tenant.branches.length})
                  </h3>
                  {tenant.branches.length === 0 ? (
                    <p className="text-sm text-[#78716C]">No branches</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {tenant.branches.map(b => (
                        <div key={b.id} className="flex items-center gap-3 p-3 bg-[#FAFAF9] rounded-lg border border-[#E7E5E4]">
                          <div className="w-8 h-8 bg-[#1C1917] rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#1C1917]">{b.name}</p>
                            {b.city && <p className="text-xs text-[#78716C]">{b.city}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Invoices */}
                <div>
                  <h3 className="font-semibold text-[#1C1917] mb-3 flex items-center gap-2">
                    <Receipt className="w-4 h-4" /> Recent Invoices
                  </h3>
                  {invoices.length === 0 ? (
                    <p className="text-sm text-[#78716C]">No invoices yet</p>
                  ) : (
                    <div className="divide-y divide-[#E7E5E4]">
                      {invoices.slice(0, 8).map(inv => (
                        <div key={inv.id} className="flex items-center justify-between py-2.5">
                          <div>
                            <p className="text-sm font-medium text-[#1C1917]">{inv.invoiceNumber}</p>
                            <p className="text-xs text-[#78716C]">{inv.client?.name ?? inv.walkInName ?? "Walk-in"} · {fmtDate(inv.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#1C1917]">{fmt(inv.totalAmount)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              inv.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                              inv.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-600"
                            }`}>{inv.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CLIENTS TAB */}
            {activeTab === "clients" && (
              <div>
                {clients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#78716C]">
                    <Users className="w-10 h-10 mb-3 opacity-30" />
                    <p>No clients yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E7E5E4]">
                    {clients.map(c => (
                      <div key={c.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F5F5F4] flex items-center justify-center text-sm font-semibold text-[#1C1917]">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#1C1917]">{c.name}</p>
                            <p className="text-xs text-[#78716C]">{c.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#1C1917]">{fmt(c.totalSpent)}</p>
                          <p className="text-xs text-[#78716C]">{c.visitCount} visits</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STAFF TAB */}
            {activeTab === "staff" && (
              <div>
                {staff.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#78716C]">
                    <UserCheck className="w-10 h-10 mb-3 opacity-30" />
                    <p>No staff yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E7E5E4]">
                    {staff.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1C1917] flex items-center justify-center text-white text-sm font-semibold">
                            {(s.name ?? s.email ?? "?").charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-[#1C1917]">{s.name ?? "—"}</p>
                            <p className="text-xs text-[#78716C]">{s.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F5F4] text-[#78716C]">{s.role}</span>
                          <p className="text-xs text-[#A8A29E] mt-1">
                            {s.isActive ? <span className="text-emerald-600">Active</span> : <span className="text-red-500">Inactive</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === "invoices" && (
              <div>
                {invoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#78716C]">
                    <Receipt className="w-10 h-10 mb-3 opacity-30" />
                    <p>No invoices yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E7E5E4]">
                    {invoices.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-sm text-[#1C1917]">{inv.invoiceNumber}</p>
                          <p className="text-xs text-[#78716C]">
                            {inv.client?.name ?? inv.walkInName ?? "Walk-in"} · {inv.paymentMethod ?? "—"} · {fmtDate(inv.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-[#1C1917]">{fmt(inv.totalAmount)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            inv.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                            inv.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-600"
                          }`}>{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SERVICES TAB */}
            {activeTab === "services" && (
              <div>
                {services.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#78716C]">
                    <Scissors className="w-10 h-10 mb-3 opacity-30" />
                    <p>No services yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E7E5E4]">
                    {services.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium text-sm text-[#1C1917]">{s.name}</p>
                          <p className="text-xs text-[#78716C]">{s.duration} min</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-[#1C1917]">{fmt(s.price)}</p>
                          <p className={`text-xs ${s.isActive ? "text-emerald-600" : "text-red-500"}`}>
                            {s.isActive ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
