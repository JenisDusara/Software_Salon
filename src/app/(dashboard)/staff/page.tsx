"use client";
import { useState, useEffect, useCallback } from "react";
import {
  UserCheck, Plus, Phone, X, User, Briefcase, Percent, Loader2,
  Scissors, ChevronRight, TrendingUp, Users, Receipt,
} from "lucide-react";
import { getInitials, getAvatarColor, formatINR, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAppStore } from "@/store/useAppStore";

type RecentActivity = {
  invoiceNumber: string;
  date: string;
  clientName: string;
  services: string[];
  totalAmount: number;
  status: string;
};

type StaffMember = {
  id: string;
  name: string;
  phone: string;
  role: string;
  commissionRate: number;
  branchId: string;
  isActive: boolean;
  totalInvoices: number;
  recentActivity: RecentActivity[];
};

const roleLabel: Record<string, string> = {
  SALON_ADMIN: "Admin",
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
  STAFF: "Stylist",
};

const roleBadge: Record<string, string> = {
  SALON_ADMIN: "bg-amber-100 text-amber-700 border-amber-200",
  MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
  RECEPTIONIST: "bg-purple-100 text-purple-700 border-purple-200",
  STAFF: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

type StaffForm = {
  name: string;
  phone: string;
  role: string;
  commissionRate: string;
  branchId: string;
};

const DEFAULT_FORM: StaffForm = { name: "", phone: "", role: "STAFF", commissionRate: "20", branchId: "" };

export default function StaffPage() {
  const branches = useAppStore((s) => s.branches);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>({ ...DEFAULT_FORM, branchId: "" });
  const [errors, setErrors] = useState<Partial<StaffForm>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data: StaffMember[] = await res.json();
      setStaff(data);
    } catch {
      toast.error("Could not load staff. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  function openAdd() {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setErrors({});
    setShowModal(true);
  }

  function openEdit(s: StaffMember) {
    setEditTarget(s);
    setForm({ name: s.name, phone: s.phone, role: s.role, commissionRate: String(s.commissionRate), branchId: s.branchId });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Partial<StaffForm> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(form.phone.trim())) e.phone = "Enter valid 10-digit phone";
    const rate = Number(form.commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) e.commissionRate = "Enter 0–100%";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        role: form.role,
        commissionRate: Number(form.commissionRate),
        branchId: form.branchId,
      };

      if (editTarget) {
        const res = await fetch(`/api/staff/${editTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to update staff");
        toast.success("Staff updated!");
      } else {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to add staff");
        toast.success(`${body.name} added!`);
      }

      setShowModal(false);
      await fetchStaff();
    } catch {
      toast.error(editTarget ? "Failed to update staff." : "Failed to add staff.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(member: StaffMember) {
    try {
      const res = await fetch(`/api/staff/${member.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`${member.name} removed.`);
      setSelectedMember(null);
      await fetchStaff();
    } catch {
      toast.error("Failed to remove staff member.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#D97706]" />
      </div>
    );
  }

  const avgCommission = (() => {
    const earners = staff.filter((s) => s.commissionRate > 0);
    if (!earners.length) return 0;
    return Math.round(earners.reduce((a, m) => a + m.commissionRate, 0) / earners.length);
  })();

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className={`flex gap-0 transition-all duration-300 ${selectedMember ? "" : ""}`}>

        {/* Main */}
        <div className={`flex-1 min-w-0 transition-all duration-300 ${selectedMember ? "md:mr-[400px]" : ""}`}>

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917]">Staff</h1>
              <p className="text-sm text-[#78716C] mt-0.5">{staff.length} team members</p>
            </div>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] text-white rounded-xl font-semibold hover:bg-amber-600 transition text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Staff", value: staff.length, icon: Users, color: "bg-blue-50 text-blue-600" },
              { label: "Stylists", value: staff.filter((s) => s.role === "STAFF").length, icon: Scissors, color: "bg-emerald-50 text-emerald-600" },
              { label: "Managers", value: staff.filter((s) => s.role === "MANAGER" || s.role === "SALON_ADMIN").length, icon: Briefcase, color: "bg-amber-50 text-amber-600" },
              { label: "Avg Commission", value: `${avgCommission}%`, icon: Percent, color: "bg-purple-50 text-purple-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-[#1C1917]">{s.value}</p>
                <p className="text-[#78716C] text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Staff list */}
          <div className="space-y-3">
            {staff.map((member) => {
              const lastAct = member.recentActivity[0];
              const isSelected = selectedMember?.id === member.id;
              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(isSelected ? null : member)}
                  className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${isSelected ? "border-[#D97706] ring-1 ring-[#D97706]/30" : "border-[#E7E5E4] hover:border-[#D97706]/50"}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-xl ${getAvatarColor(member.name)} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                      {getInitials(member.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1C1917]">{member.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${roleBadge[member.role] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {roleLabel[member.role] ?? member.role}
                        </span>
                        {member.commissionRate > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            {member.commissionRate}% comm
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone className="w-3 h-3 text-[#A8A29E]" />
                        <span className="text-xs text-[#78716C]">{member.phone}</span>
                        <span className="text-[#D4D0CD] mx-1">·</span>
                        <Receipt className="w-3 h-3 text-[#A8A29E]" />
                        <span className="text-xs text-[#78716C]">{member.totalInvoices} invoices</span>
                      </div>

                      {/* Last served */}
                      {lastAct && (
                        <div className="mt-2 flex items-start gap-1.5">
                          <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <p className="text-xs text-[#78716C] leading-relaxed">
                            <span className="font-medium text-[#1C1917]">{lastAct.clientName}</span>
                            {lastAct.services.length > 0 && (
                              <> — {lastAct.services.join(", ")}</>
                            )}
                            <span className="text-[#A8A29E] ml-1">({formatDate(new Date(lastAct.date))})</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-2 shrink-0">
                      {member.totalInvoices > 0 && (
                        <div className="hidden sm:block text-right">
                          <p className="text-xs text-[#78716C]">Recent</p>
                          <p className="text-sm font-semibold text-[#1C1917]">
                            {lastAct ? formatINR(lastAct.totalAmount) : "—"}
                          </p>
                        </div>
                      )}
                      <ChevronRight className={`w-4 h-4 text-[#A8A29E] transition-transform ${isSelected ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedMember && (
          <div className="hidden md:flex fixed top-0 right-0 h-full w-[400px] bg-white border-l border-[#E7E5E4] shadow-xl z-30 flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${getAvatarColor(selectedMember.name)} flex items-center justify-center text-white font-bold`}>
                  {getInitials(selectedMember.name)}
                </div>
                <div>
                  <p className="font-semibold text-[#1C1917]">{selectedMember.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${roleBadge[selectedMember.role] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {roleLabel[selectedMember.role] ?? selectedMember.role}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-[#F5F5F4] rounded-lg transition">
                <X className="w-4 h-4 text-[#78716C]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FAFAF9] rounded-xl p-3 border border-[#E7E5E4]">
                  <p className="text-xs text-[#78716C] mb-1">Total Invoices</p>
                  <p className="text-xl font-bold text-[#1C1917]">{selectedMember.totalInvoices}</p>
                </div>
                <div className="bg-[#FAFAF9] rounded-xl p-3 border border-[#E7E5E4]">
                  <p className="text-xs text-[#78716C] mb-1">Commission</p>
                  <p className="text-xl font-bold text-[#1C1917]">{selectedMember.commissionRate}%</p>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-[#FAFAF9] rounded-xl p-4 border border-[#E7E5E4]">
                <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-3">Contact</p>
                <div className="flex items-center gap-2 text-sm text-[#1C1917]">
                  <Phone className="w-4 h-4 text-[#A8A29E]" />
                  <a href={`tel:${selectedMember.phone}`} className="hover:text-[#D97706]">{selectedMember.phone}</a>
                </div>
              </div>

              {/* Recent client & service activity */}
              <div>
                <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-3">Recent Client Activity</p>
                {selectedMember.recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-[#78716C] text-sm bg-[#FAFAF9] rounded-xl border border-[#E7E5E4]">
                    No activity yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMember.recentActivity.map((act, idx) => (
                      <div key={idx} className="bg-[#FAFAF9] rounded-xl border border-[#E7E5E4] p-3">
                        {/* Client name + date */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#1C1917] flex items-center justify-center">
                              <span className="text-white text-[9px] font-bold">{act.clientName.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-sm font-semibold text-[#1C1917]">{act.clientName}</span>
                          </div>
                          <span className="text-xs text-[#A8A29E]">{formatDate(new Date(act.date))}</span>
                        </div>

                        {/* Services */}
                        {act.services.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {act.services.map((svc, si) => (
                              <span key={si} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-800">
                                <Scissors className="w-2.5 h-2.5 text-amber-500" />
                                {svc}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Amount + status */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#78716C]">{act.invoiceNumber}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${act.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {act.status}
                            </span>
                            <span className="text-sm font-bold text-[#1C1917]">{formatINR(act.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-[#E7E5E4] space-y-2">
              <button
                onClick={() => { setSelectedMember(null); openEdit(selectedMember); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1C1917] text-white rounded-xl text-sm font-semibold hover:bg-[#292524] transition"
              >
                Edit Profile
              </button>
              <button
                onClick={() => handleDelete(selectedMember)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition"
              >
                Remove Staff Member
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Add / Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4] sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-[#1C1917] text-lg">
                {editTarget ? "Edit Staff Member" : "Add Staff Member"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#F5F5F4] rounded-lg transition">
                <X className="w-5 h-5 text-[#78716C]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Rahul Verma"
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.name ? "border-red-400" : "border-[#E7E5E4]"}`}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Phone <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/, "") }))}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.phone ? "border-red-400" : "border-[#E7E5E4]"}`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["STAFF", "RECEPTIONIST", "MANAGER", "SALON_ADMIN"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: r }))}
                      className={`py-2 rounded-xl border text-sm font-medium transition ${form.role === r ? "bg-[#1C1917] text-white border-[#1C1917]" : "border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]"}`}
                    >
                      {roleLabel[r]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
                  Commission Rate (%)
                  <span className="text-[#78716C] font-normal ml-1">— 0 for fixed salary</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input
                    type="number"
                    value={form.commissionRate}
                    onChange={(e) => setForm((f) => ({ ...f, commissionRate: e.target.value }))}
                    min={0}
                    max={100}
                    className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.commissionRate ? "border-red-400" : "border-[#E7E5E4]"}`}
                  />
                </div>
                {errors.commissionRate && <p className="text-red-500 text-xs mt-1">{errors.commissionRate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Branch</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white"
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-[#E7E5E4] rounded-xl text-sm font-medium text-[#78716C] hover:bg-[#F5F5F4] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#D97706] text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editTarget ? "Save Changes" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
