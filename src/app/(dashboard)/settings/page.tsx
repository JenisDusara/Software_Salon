"use client";
import { Settings, Store, Bell, CreditCard, Users, Shield, Palette } from "lucide-react";

const sections = [
  { icon: Store, label: "Business Profile", desc: "Salon name, logo, address, GSTIN, UPI ID" },
  { icon: Users, label: "Staff & Roles", desc: "Manage team permissions and access levels" },
  { icon: CreditCard, label: "Payment Settings", desc: "UPI ID, Razorpay integration, accepted methods" },
  { icon: Bell, label: "Notifications", desc: "WhatsApp, SMS, and email notification preferences" },
  { icon: Palette, label: "Customisation", desc: "Invoice template, branding colors, receipt footer" },
  { icon: Shield, label: "Security", desc: "Password, 2FA, session management" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Settings
        </h1>
        <p className="text-[#78716C] text-sm mt-0.5">Manage your salon configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <button key={s.label} className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-5 text-left hover:border-[#D97706] transition flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F5F5F4] flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5 text-[#1C1917]" />
            </div>
            <div>
              <p className="font-semibold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</p>
              <p className="text-[#78716C] text-sm mt-0.5">{s.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
