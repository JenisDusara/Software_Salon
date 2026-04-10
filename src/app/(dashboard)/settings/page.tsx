"use client";
import { useState, useEffect } from "react";
import { Store, Bell, CreditCard, Users, Shield, Palette, Save, Eye, EyeOff, ChevronRight, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

type Section = "menu" | "business" | "password";

type TenantSettings = {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  city: string;
  address: string;
  gstin: string;
  upiId: string;
  subscriptionPlan: string;
};

const EMPTY: TenantSettings = {
  businessName: "", ownerName: "", ownerEmail: "", ownerPhone: "",
  city: "", address: "", gstin: "", upiId: "", subscriptionPlan: "",
};

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("menu");
  const [settings, setSettings] = useState<TenantSettings>(EMPTY);
  const [form, setForm] = useState<TenantSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        const s = { ...EMPTY, ...data };
        setSettings(s);
        setForm(s);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function saveBusinessProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          ownerName: form.ownerName,
          ownerPhone: form.ownerPhone,
          city: form.city,
          address: form.address,
          gstin: form.gstin,
          upiId: form.upiId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(form);
      toast.success("Settings saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Password changed!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  const menuItems = [
    { key: "business", icon: Store, label: "Business Profile", desc: "Salon name, address, GSTIN, UPI ID" },
    { key: "password", icon: Shield, label: "Change Password", desc: "Update your login password" },
    { key: "coming", icon: CreditCard, label: "Payment Settings", desc: "UPI ID, accepted payment methods" },
    { key: "coming", icon: Bell, label: "Notifications", desc: "WhatsApp, SMS, email preferences" },
    { key: "coming", icon: Users, label: "Staff & Roles", desc: "Team permissions and access levels" },
    { key: "coming", icon: Palette, label: "Customisation", desc: "Invoice template, branding colors" },
  ];

  const inp = "w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white text-[#1C1917]";

  if (loading) return <div className="flex items-center justify-center py-20 text-[#78716C]">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-3">
        {section !== "menu" && (
          <button onClick={() => setSection("menu")} className="p-2 hover:bg-[#F5F5F4] rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-[#78716C]" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {section === "menu" ? "Settings" : section === "business" ? "Business Profile" : "Change Password"}
          </h1>
          <p className="text-[#78716C] text-sm mt-0.5">
            {section === "menu" ? "Manage your salon configuration" :
             section === "business" ? "Update your salon details" :
             "Update your login password"}
          </p>
        </div>
      </div>

      {/* MENU */}
      {section === "menu" && (
        <div className="bg-white rounded-xl border border-[#E7E5E4] divide-y divide-[#E7E5E4]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isComingSoon = item.key === "coming";
            return (
              <button
                key={item.label}
                onClick={() => !isComingSoon && setSection(item.key as Section)}
                disabled={isComingSoon}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-[#FAFAF9] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#1C1917]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1C1917] text-sm">{item.label}</p>
                  <p className="text-[#78716C] text-xs mt-0.5">{item.desc}</p>
                </div>
                {isComingSoon
                  ? <span className="text-xs text-[#A8A29E] bg-[#F5F5F4] px-2 py-0.5 rounded-full">Soon</span>
                  : <ChevronRight className="w-4 h-4 text-[#A8A29E]" />
                }
              </button>
            );
          })}
        </div>
      )}

      {/* BUSINESS PROFILE */}
      {section === "business" && (
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 space-y-5">
          {/* Plan badge */}
          <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4]">
            <p className="text-sm text-[#78716C]">Subscription Plan</p>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              settings.subscriptionPlan === "PRO" ? "bg-amber-100 text-amber-700" :
              settings.subscriptionPlan === "ENTERPRISE" ? "bg-purple-100 text-purple-700" :
              settings.subscriptionPlan === "BASIC" ? "bg-blue-100 text-blue-700" :
              "bg-stone-100 text-stone-600"
            }`}>{settings.subscriptionPlan || "TRIAL"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Business Name <span className="text-red-500">*</span></label>
              <input className={inp} value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} placeholder="e.g. Priya Beauty Salon" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Owner Name</label>
              <input className={inp} value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="e.g. Priya Sharma" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Phone</label>
              <input className={inp} value={form.ownerPhone} onChange={e => setForm(f => ({ ...f, ownerPhone: e.target.value }))} placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">City</label>
              <input className={inp} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Mumbai" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">UPI ID</label>
              <input className={inp} value={form.upiId} onChange={e => setForm(f => ({ ...f, upiId: e.target.value }))} placeholder="salon@upi" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Address</label>
              <textarea className={inp + " resize-none"} rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full salon address" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">GSTIN</label>
              <input className={inp} value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} placeholder="27AABCS1681G1ZF" maxLength={15} />
            </div>
          </div>

          <button
            onClick={saveBusinessProfile}
            disabled={saving || !form.businessName}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1C1917] text-white rounded-xl font-semibold hover:bg-[#292524] transition disabled:opacity-60 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* CHANGE PASSWORD */}
      {section === "password" && (
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} className={inp + " pr-10"} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">New Password</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} className={inp + " pr-10"} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Confirm New Password</label>
            <input type="password" className={inp} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
          </div>

          <button
            onClick={savePassword}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1C1917] text-white rounded-xl font-semibold hover:bg-[#292524] transition disabled:opacity-60 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      )}
    </div>
  );
}
