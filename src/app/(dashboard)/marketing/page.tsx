"use client";
import { useState, useEffect } from "react";
import {
  Megaphone, MessageCircle, Star, Send, Users, TrendingUp,
  Plus, X, CheckCircle2, Clock, ChevronRight, Gift, Bell, Heart, Tag, Loader2,
} from "lucide-react";
import { buildWhatsAppUrl, getInitials, getAvatarColor } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Client = {
  id: string; name: string; phone: string; email: string | null;
  gender: string | null; loyaltyPoints: number; totalSpent: number;
  visitCount: number; lastVisit: string | null;
};

type Campaign = {
  id: string; name: string;
  type: "promotion" | "reminder" | "review" | "loyalty" | "festival";
  segment: string; message: string; sentCount: number;
  status: "draft" | "sent" | "scheduled"; date: string;
};

type Template = {
  id: string; label: string; icon: React.ReactNode; color: string; message: string;
};

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: "t1",
    label: "Appointment Reminder",
    icon: <Bell className="w-4 h-4" />,
    color: "bg-blue-50 text-blue-600",
    message: "Hi {{name}}! 👋 Friendly reminder about your appointment tomorrow at {{time}}. See you at our salon! ✨",
  },
  {
    id: "t2",
    label: "Review Request",
    icon: <Star className="w-4 h-4" />,
    color: "bg-amber-50 text-amber-600",
    message: "Hi {{name}}! 🙏 Thank you for visiting us. We hope you loved your experience! Could you spare a moment to share your feedback? ⭐",
  },
  {
    id: "t3",
    label: "Loyalty Offer",
    icon: <Gift className="w-4 h-4" />,
    color: "bg-purple-50 text-purple-600",
    message: "Hi {{name}}! 🎁 You have {{points}} loyalty points — that's ₹{{value}} off your next visit! Book now and save. We miss you! 💛",
  },
  {
    id: "t4",
    label: "Win-Back (Inactive)",
    icon: <Heart className="w-4 h-4" />,
    color: "bg-rose-50 text-rose-600",
    message: "Hi {{name}}! 💔 We haven't seen you in a while and we miss you! Come back this week and enjoy 20% off any service. Use code COMEBACK20. 💈",
  },
  {
    id: "t5",
    label: "Festival Offer",
    icon: <Tag className="w-4 h-4" />,
    color: "bg-emerald-50 text-emerald-600",
    message: "Hi {{name}}! 🎉 Celebrate the festive season with us! Enjoy special discounts on all services this week. Book now — limited slots! 🌸",
  },
  {
    id: "t6",
    label: "Birthday Wish",
    icon: <Gift className="w-4 h-4" />,
    color: "bg-pink-50 text-pink-600",
    message: "Hi {{name}}! 🎂🎉 Wishing you a very Happy Birthday! As a special gift, enjoy a FREE hair wash on your next visit this month. You deserve it! 💛",
  },
];

// ─── Campaign Type Config ─────────────────────────────────────────────────────

const campaignTypeConfig: Record<string, { label: string; color: string }> = {
  promotion: { label: "Promotion", color: "bg-amber-100 text-amber-700" },
  reminder: { label: "Reminder", color: "bg-blue-100 text-blue-700" },
  review: { label: "Review", color: "bg-purple-100 text-purple-700" },
  loyalty: { label: "Loyalty", color: "bg-pink-100 text-pink-700" },
  festival: { label: "Festival", color: "bg-emerald-100 text-emerald-700" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);

  // New campaign form state
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState<Campaign["type"]>("promotion");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .finally(() => setLoadingClients(false));
  }, []);

  const now = Date.now();

  const segments = [
    { id: "all", label: "All Clients", count: clients.length },
    {
      id: "active",
      label: "Active (visited in 30 days)",
      count: clients.filter((c) => c.lastVisit && now - new Date(c.lastVisit).getTime() < 30 * 86400000).length,
    },
    {
      id: "inactive",
      label: "Inactive (60+ days)",
      count: clients.filter((c) => !c.lastVisit || now - new Date(c.lastVisit).getTime() > 60 * 86400000).length,
    },
    {
      id: "loyalty_gold",
      label: "Loyalty Gold (500+ pts)",
      count: clients.filter((c) => c.loyaltyPoints >= 500).length,
    },
    {
      id: "loyalty_silver",
      label: "Loyalty Silver (200+ pts)",
      count: clients.filter((c) => c.loyaltyPoints >= 200).length,
    },
    {
      id: "high_value",
      label: "High Value (₹10k+ spent)",
      count: clients.filter((c) => c.totalSpent >= 10000).length,
    },
    {
      id: "female",
      label: "Female Clients",
      count: clients.filter((c) => c.gender === "Female").length,
    },
    {
      id: "male",
      label: "Male Clients",
      count: clients.filter((c) => c.gender === "Male").length,
    },
  ];

  const segmentInfo = segments.find((s) => s.id === selectedSegment) ?? segments[0];

  function getSegmentClients(segId: string): Client[] {
    switch (segId) {
      case "active": return clients.filter((c) => c.lastVisit && now - new Date(c.lastVisit).getTime() < 30 * 86400000);
      case "inactive": return clients.filter((c) => !c.lastVisit || now - new Date(c.lastVisit).getTime() > 60 * 86400000);
      case "loyalty_gold": return clients.filter((c) => c.loyaltyPoints >= 500);
      case "loyalty_silver": return clients.filter((c) => c.loyaltyPoints >= 200);
      case "high_value": return clients.filter((c) => c.totalSpent >= 10000);
      case "female": return clients.filter((c) => c.gender === "Female");
      case "male": return clients.filter((c) => c.gender === "Male");
      default: return clients;
    }
  }

  const segmentClients = getSegmentClients(selectedSegment);
  const winBackClients = clients.filter((c) => !c.lastVisit || now - new Date(c.lastVisit).getTime() > 60 * 86400000);

  function applyTemplate(t: Template) {
    setSelectedTemplate(t.id);
    setMessage(t.message);
  }

  function handleSendCampaign() {
    if (!campaignName.trim()) { toast.error("Enter a campaign name"); return; }
    if (!message.trim()) { toast.error("Write a message"); return; }

    const newCampaign: Campaign = {
      id: `camp-${Date.now()}`,
      name: campaignName.trim(),
      type: campaignType,
      segment: segmentInfo.label,
      message,
      sentCount: segmentInfo.count,
      status: "sent",
      date: new Date().toISOString().split("T")[0],
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    toast.success(`Campaign sent to ${segmentInfo.count} clients!`);
    setShowNewModal(false);
    resetForm();
  }

  function handleSendToClient(client: Client) {
    const personalised = message
      .replace(/{{name}}/g, client.name.split(" ")[0])
      .replace(/{{points}}/g, String(client.loyaltyPoints))
      .replace(/{{value}}/g, String(Math.floor(client.loyaltyPoints / 100) * 50))
      .replace(/{{time}}/g, "11:00 AM");
    const url = buildWhatsAppUrl(client.phone, personalised);
    window.open(url, "_blank");
  }

  function resetForm() {
    setCampaignName("");
    setCampaignType("promotion");
    setSelectedSegment("all");
    setMessage("");
    setSelectedTemplate(null);
  }

  const totalSent = campaigns.filter((c) => c.status === "sent").reduce((s, c) => s + c.sentCount, 0);

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Marketing</h1>
          <p className="text-[#78716C] text-sm mt-0.5">WhatsApp campaigns, promotions &amp; reviews</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowNewModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] text-white rounded-xl font-medium hover:bg-amber-600 transition text-sm"
        >
          <Send className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: loadingClients ? "…" : clients.length, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Messages Sent", value: totalSent, icon: MessageCircle, color: "bg-green-50 text-green-600" },
          { label: "Avg Rating", value: "—", icon: Star, color: "bg-amber-50 text-amber-600" },
          { label: "Retention Rate", value: "—", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
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

      {/* Quick-send templates */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm">
        <div className="p-5 border-b border-[#E7E5E4]">
          <h2 className="font-semibold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Quick-Send Templates</h2>
          <p className="text-[#78716C] text-sm mt-0.5">Select a template, pick clients, send instantly on WhatsApp</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => { applyTemplate(t); setShowNewModal(true); }}
              className="flex items-center gap-3 p-4 rounded-xl border border-[#E7E5E4] hover:border-[#D97706] hover:bg-amber-50/30 transition text-left group"
            >
              <div className={`w-9 h-9 rounded-lg ${t.color} flex items-center justify-center shrink-0`}>{t.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1C1917]">{t.label}</p>
                <p className="text-xs text-[#78716C] truncate mt-0.5">{t.message.slice(0, 55)}...</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#78716C] shrink-0 group-hover:text-[#D97706] transition" />
            </button>
          ))}
        </div>
      </div>

      {/* Campaign History */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E7E5E4]">
          <h2 className="font-semibold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Campaign History</h2>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-[#78716C] text-center py-8">No campaigns sent yet. Create your first campaign above.</p>
        ) : (
          <div className="divide-y divide-[#E7E5E4]">
            {campaigns.map((camp) => {
              const typeConfig = campaignTypeConfig[camp.type];
              return (
                <div key={camp.id} className="flex items-center gap-4 p-4 hover:bg-[#FAFAF9] transition">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1C1917] text-sm">{camp.name}</p>
                    <p className="text-[#78716C] text-xs mt-0.5">{camp.segment} · {camp.date}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeConfig?.color ?? "bg-gray-100 text-gray-600"}`}>{typeConfig?.label}</span>
                    {camp.status === "sent" ? (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {camp.sentCount} sent
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[#D97706] text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Scheduled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inactive clients — win-back section */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E7E5E4] flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Win-Back Opportunities</h2>
            <p className="text-[#78716C] text-sm mt-0.5">Clients who haven&apos;t visited in 60+ days</p>
          </div>
        </div>
        {loadingClients ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
          </div>
        ) : winBackClients.length === 0 ? (
          <p className="text-sm text-[#78716C] text-center py-8">No inactive clients — great retention!</p>
        ) : (
          <div className="divide-y divide-[#E7E5E4]">
            {winBackClients.map((client) => {
              const days = client.lastVisit
                ? Math.floor((now - new Date(client.lastVisit).getTime()) / 86400000)
                : 999;
              const winBackMsg = `Hi ${client.name.split(" ")[0]}! 💔 We miss you at our salon! It's been a while since your last visit. Come back this week and enjoy 20% off any service. We'd love to see you again! 💛`;
              const waUrl = buildWhatsAppUrl(client.phone, winBackMsg);
              return (
                <div key={client.id} className="flex items-center gap-4 p-4 hover:bg-[#FAFAF9] transition">
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(client.name)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {getInitials(client.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1C1917] text-sm">{client.name}</p>
                    <p className="text-[#78716C] text-xs mt-0.5">
                      Last visit: {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString("en-IN") : "Never"} · {days === 999 ? "Never visited" : `${days} days ago`}
                    </p>
                  </div>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Send WA
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── New Campaign Modal ─── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4] sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-[#1C1917] text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>New WhatsApp Campaign</h2>
              <button onClick={() => setShowNewModal(false)} className="p-2 hover:bg-[#F5F5F4] rounded-lg transition">
                <X className="w-5 h-5 text-[#78716C]" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. April Festival Offer"
                  className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Campaign Type</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(campaignTypeConfig) as [Campaign["type"], { label: string; color: string }][]).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCampaignType(key)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${campaignType === key ? "bg-[#1C1917] text-white border-[#1C1917]" : "border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]"}`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Segment */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Target Segment</label>
                <div className="space-y-2">
                  {segments.map((seg) => (
                    <label key={seg.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${selectedSegment === seg.id ? "border-[#D97706] bg-amber-50/40" : "border-[#E7E5E4] hover:border-[#D97706]"}`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="segment"
                          value={seg.id}
                          checked={selectedSegment === seg.id}
                          onChange={() => setSelectedSegment(seg.id)}
                          className="accent-[#D97706]"
                        />
                        <span className="text-sm text-[#1C1917]">{seg.label}</span>
                      </div>
                      <span className="text-xs text-[#78716C] bg-[#F5F5F4] px-2 py-0.5 rounded-full">{seg.count} clients</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Use Template (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition ${selectedTemplate === t.id ? "bg-[#1C1917] text-white border-[#1C1917]" : "border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">
                  Message
                  <span className="text-[#78716C] font-normal ml-2 text-xs">Use &#123;&#123;name&#125;&#125; for personalisation</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your WhatsApp message here..."
                  rows={5}
                  className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] resize-none"
                />
                <p className="text-xs text-[#78716C] mt-1">{message.length} characters</p>
              </div>

              {/* Preview */}
              {message && segmentClients.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#1C1917] mb-3">Preview — Send Individually</p>
                  <div className="border border-[#E7E5E4] rounded-xl overflow-hidden divide-y divide-[#E7E5E4] max-h-56 overflow-y-auto">
                    {segmentClients.map((client) => {
                      const personalised = message
                        .replace(/{{name}}/g, client.name.split(" ")[0])
                        .replace(/{{points}}/g, String(client.loyaltyPoints))
                        .replace(/{{value}}/g, String(Math.floor(client.loyaltyPoints / 100) * 50))
                        .replace(/{{time}}/g, "11:00 AM");
                      const waUrl = buildWhatsAppUrl(client.phone, personalised);
                      return (
                        <div key={client.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFAF9]">
                          <div className={`w-8 h-8 rounded-full ${getAvatarColor(client.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                            {getInitials(client.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1C1917]">{client.name}</p>
                            <p className="text-xs text-[#78716C]">{client.phone}</p>
                          </div>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition"
                          >
                            <MessageCircle className="w-3 h-3" />
                            Send
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2.5 border border-[#E7E5E4] rounded-xl text-sm font-medium text-[#78716C] hover:bg-[#F5F5F4] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCampaign}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Mark as Sent ({segmentInfo.count} clients)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
