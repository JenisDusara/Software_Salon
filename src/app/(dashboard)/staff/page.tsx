"use client";
import { useState, useEffect, useCallback } from "react";
import { UserCheck, Plus, Phone, Star, X, User, Briefcase, Percent, Mail, Loader2 } from "lucide-react";
import { getInitials, getAvatarColor } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";

type StaffMember = {
  id: string;
  name: string;
  phone: string;
  role: string;
  commissionRate: number;
  branchId: string;
  isActive: boolean;
};

const roleLabel: Record<string, string> = {
  SALON_ADMIN: "Admin",
  MANAGER: "Manager",
  RECEPTIONIST: "Receptionist",
  STAFF: "Stylist",
};

const roleBadge: Record<string, string> = {
  SALON_ADMIN: "bg-amber-100 text-amber-700",
  MANAGER: "bg-blue-100 text-blue-700",
  RECEPTIONIST: "bg-purple-100 text-purple-700",
  STAFF: "bg-emerald-100 text-emerald-700",
};

type StaffForm = {
  name: string;
  phone: string;
  role: string;
  commissionRate: string;
  branchId: string;
};

const DEFAULT_FORM: StaffForm = { name: "", phone: "", role: "STAFF", commissionRate: "20", branchId: "b1" };


export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<StaffForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<StaffForm>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Failed to fetch staff");
      const data: StaffMember[] = await res.json();
      setStaff(data);
    } catch (err) {
      toast.error("Could not load staff. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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
    } catch (err) {
      toast.error(editTarget ? "Failed to update staff." : "Failed to add staff.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(member: StaffMember) {
    try {
      const res = await fetch(`/api/staff/${member.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete staff");
      toast.success(`${member.name} removed.`);
      await fetchStaff();
    } catch (err) {
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

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Staff
          </h1>
          <p className="text-[#78716C] text-sm mt-0.5">{staff.length} team members</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[#D97706] text-white rounded-xl font-medium hover:bg-amber-600 transition text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Staff</span>
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: staff.length, color: "bg-blue-50 text-blue-600" },
          { label: "Stylists", value: staff.filter((s) => s.role === "STAFF").length, color: "bg-emerald-50 text-emerald-600" },
          { label: "Managers", value: staff.filter((s) => s.role === "MANAGER" || s.role === "SALON_ADMIN").length, color: "bg-amber-50 text-amber-600" },
          {
            label: "Avg Commission",
            value: (() => {
              const earners = staff.filter((s) => s.commissionRate > 0);
              if (!earners.length) return "0%";
              return `${Math.round(earners.reduce((acc, m) => acc + m.commissionRate, 0) / earners.length)}%`;
            })(),
            color: "bg-purple-50 text-purple-600",
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
              <UserCheck className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
            <p className="text-[#78716C] text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {staff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 hover:border-[#D97706] transition">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-white font-bold text-lg mb-3`}>
                {getInitials(member.name)}
              </div>
              <h3 className="font-semibold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {member.name}
              </h3>
              <span className={`mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge[member.role] ?? "bg-gray-100 text-gray-600"}`}>
                {roleLabel[member.role] ?? member.role}
              </span>
            </div>

            <div className="mt-4 space-y-2 pt-4 border-t border-[#E7E5E4]">
              <div className="flex items-center gap-2 text-sm text-[#78716C]">
                <Phone className="w-3.5 h-3.5" />
                <span>{member.phone}</span>
              </div>
              {member.commissionRate > 0 && (
                <div className="flex items-center gap-2 text-sm text-[#78716C]">
                  <Percent className="w-3.5 h-3.5" />
                  <span>{member.commissionRate}% commission</span>
                </div>
              )}
            </div>

            <button
              onClick={() => openEdit(member)}
              className="mt-3 w-full text-xs text-[#D97706] font-medium hover:underline"
            >
              Edit Profile
            </button>
          </div>
        ))}
      </div>

      {/* ─── Add / Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4] sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-[#1C1917] text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {editTarget ? "Edit Staff Member" : "Add Staff Member"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#F5F5F4] rounded-lg transition">
                <X className="w-5 h-5 text-[#78716C]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
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

              {/* Phone */}
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

              {/* Role */}
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

              {/* Commission */}
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

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Branch</label>
                <select
                  value={form.branchId}
                  onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white"
                >
                  <option value="b1">Mumbai Main</option>
                  <option value="b2">Mumbai Andheri</option>
                  <option value="b3">Pune Branch</option>
                </select>
              </div>

              {editTarget && (
                <button
                  type="button"
                  onClick={() => { setShowModal(false); handleDelete(editTarget); }}
                  className="w-full py-2.5 border border-red-200 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
                >
                  Remove Staff Member
                </button>
              )}

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
                  className="flex-1 py-2.5 bg-[#D97706] text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
