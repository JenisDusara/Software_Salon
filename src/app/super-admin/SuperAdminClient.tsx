"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus, X, Building2, Users, LogOut, Eye, EyeOff,
  CheckCircle, RefreshCcw, Scissors, ChevronRight
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type Tenant = {
  id: string;
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string | null;
  city: string | null;
  subscriptionPlan: string;
  isActive: boolean;
  createdAt: string;
  branches: { id: string; name: string; city: string | null }[];
  users: { id: string; name: string | null; email: string | null }[];
};

const DEFAULT_FORM = {
  businessName: "",
  ownerName: "",
  ownerEmail: "",
  ownerPhone: "",
  city: "",
  plan: "BASIC",
  branchName: "",
  password: "",
};

const PLANS = ["TRIAL", "BASIC", "PRO", "ENTERPRISE"];

export default function SuperAdminPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/tenants");
      const data = await res.json();
      if (Array.isArray(data)) setTenants(data);
    } catch {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.businessName || !form.ownerEmail || !form.password) {
      toast.error("Business name, email and password required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Client salon created!");
      setShowModal(false);
      setForm(DEFAULT_FORM);
      fetchTenants();
    } catch (err: any) {
      toast.error(err.message || "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  const planColor: Record<string, string> = {
    TRIAL: "bg-stone-100 text-stone-600",
    BASIC: "bg-blue-100 text-blue-700",
    PRO: "bg-amber-100 text-amber-700",
    ENTERPRISE: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-[#1C1917] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#D97706] rounded-lg flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">SalonSoft Pro</p>
            <p className="text-stone-400 text-xs">Super Admin Panel</p>
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

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-[#E7E5E4] p-5">
            <p className="text-xs text-[#78716C] uppercase tracking-wide mb-1">Total Clients</p>
            <p className="text-3xl font-bold text-[#1C1917]">{tenants.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E7E5E4] p-5">
            <p className="text-xs text-[#78716C] uppercase tracking-wide mb-1">Active</p>
            <p className="text-3xl font-bold text-emerald-600">{tenants.filter(t => t.isActive).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 col-span-2 sm:col-span-1">
            <p className="text-xs text-[#78716C] uppercase tracking-wide mb-1">Pro / Enterprise</p>
            <p className="text-3xl font-bold text-amber-600">
              {tenants.filter(t => ["PRO", "ENTERPRISE"].includes(t.subscriptionPlan)).length}
            </p>
          </div>
        </div>

        {/* Clients list */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4]">
            <h2 className="font-bold text-[#1C1917]">Salon Clients</h2>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); fetchTenants(); }} className="p-2 text-[#78716C] hover:bg-[#F5F5F4] rounded-lg transition">
                <RefreshCcw className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-[#D97706] text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition"
              >
                <Plus className="w-4 h-4" /> Add Client
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-[#78716C]">Loading...</div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#78716C]">
              <Building2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium">No clients yet</p>
              <p className="text-sm mt-1">Click "Add Client" to onboard your first salon</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E7E5E4]">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  onClick={() => router.push(`/super-admin/tenant/${tenant.id}`)}
                  className="flex items-start gap-4 p-5 hover:bg-[#FAFAF9] transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1C1917] flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">
                      {tenant.businessName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-[#1C1917]">{tenant.businessName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColor[tenant.subscriptionPlan] ?? "bg-stone-100 text-stone-600"}`}>
                        {tenant.subscriptionPlan}
                      </span>
                      {tenant.isActive ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-red-500">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-[#78716C]">{tenant.ownerEmail}</p>
                    {tenant.city && <p className="text-xs text-[#A8A29E] mt-0.5">{tenant.city}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-xs text-[#78716C] mb-1">
                        <Building2 className="w-3 h-3" />
                        <span>{tenant.branches.length} branch{tenant.branches.length !== 1 ? "es" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[#78716C]">
                        <Users className="w-3 h-3" />
                        <span>{tenant.users.length} admin{tenant.users.length !== 1 ? "s" : ""}</span>
                      </div>
                      <p className="text-xs text-[#A8A29E] mt-1">
                        {new Date(tenant.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#A8A29E]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4] sticky top-0 bg-white z-10">
              <h2 className="font-bold text-[#1C1917] text-lg">Add New Client</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#F5F5F4] rounded-lg">
                <X className="w-5 h-5 text-[#78716C]" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Salon / Business Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                    placeholder="e.g. Priya Beauty Salon"
                    className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Owner Name</label>
                  <input
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Login Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={form.ownerEmail}
                    onChange={(e) => setForm((f) => ({ ...f, ownerEmail: e.target.value }))}
                    placeholder="owner@salon.in"
                    className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.ownerPhone}
                    onChange={(e) => setForm((f) => ({ ...f, ownerPhone: e.target.value }))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Login Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Min 6 characters"
                      className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] pr-10"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Plan</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white"
                  >
                    {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Branch Name</label>
                  <input
                    type="text"
                    value={form.branchName}
                    onChange={(e) => setForm((f) => ({ ...f, branchName: e.target.value }))}
                    placeholder="e.g. Main Branch (auto-filled if empty)"
                    className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                Client ko ye credentials share karo: <strong>{form.ownerEmail || "email"}</strong> / <strong>{form.password || "password"}</strong>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-[#1C1917] text-white rounded-xl font-semibold hover:bg-[#292524] transition disabled:opacity-60 text-sm"
              >
                {saving ? "Creating..." : "Create Client Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
