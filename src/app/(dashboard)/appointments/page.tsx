"use client";
import { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, User, CheckCircle2, X, Search, Loader2 } from "lucide-react";
import { formatINR, getInitials, getAvatarColor, getStatusColor } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";

const statusLabel: Record<string, string> = {
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  IN_PROGRESS: "In Progress",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

type Appointment = {
  id: string; clientName: string; serviceName: string; staffName: string;
  time: string; duration: number; status: string; amount: number;
};
type Client = { id: string; name: string; phone: string };
type Staff = { id: string; name: string; role: string };
type Service = { id: string; name: string; price: number; duration: number; categoryId: string };
type Category = { id: string; name: string };

type NewAppt = {
  clientType: "existing" | "walkin";
  clientId: string; walkInName: string; walkInPhone: string;
  staffId: string; serviceId: string; date: string; time: string; notes: string;
};

const DEFAULT_APPT: NewAppt = {
  clientType: "existing", clientId: "", walkInName: "", walkInPhone: "",
  staffId: "", serviceId: "",
  date: new Date().toISOString().split("T")[0], time: "10:00", notes: "",
};

const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00",
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewAppt>(DEFAULT_APPT);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchAppointments = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments?date=${date}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load appointments"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [fetchAppointments, selectedDate]);

  useEffect(() => {
    Promise.all([
      fetch("/api/staff").then((r) => r.json()),
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/services/categories").then((r) => r.json()),
    ]).then(([s, sv, c]) => {
      setStaff(Array.isArray(s) ? s : []);
      setServices(Array.isArray(sv) ? sv : []);
      setCategories(Array.isArray(c) ? c : []);
    });
  }, []);

  useEffect(() => {
    if (!clientSearch.trim()) { setClientResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/clients?search=${encodeURIComponent(clientSearch)}`)
        .then((r) => r.json())
        .then((data) => setClientResults(Array.isArray(data) ? data.slice(0, 8) : []));
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  function changeDate(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  const selectedService = services.find((s) => s.id === form.serviceId);
  const selectedStaff = staff.find((s) => s.id === form.staffId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.clientType === "existing" && !form.clientId) { toast.error("Please select a client"); return; }
    if (!form.staffId) { toast.error("Please assign a staff member"); return; }
    if (!form.serviceId) { toast.error("Please select a service"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientType === "existing" ? form.clientId : null,
          walkInName: form.clientType === "walkin" ? (form.walkInName || "Walk-in") : null,
          staffId: form.staffId,
          serviceId: form.serviceId,
          date: form.date,
          time: form.time,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Appointment booked!");
      setShowModal(false);
      setForm(DEFAULT_APPT);
      setClientSearch("");
      fetchAppointments(selectedDate);
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  const displayDate = new Date(selectedDate + "T00:00:00");
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Appointments
          </h1>
          <p className="text-[#78716C] text-sm mt-0.5">Manage bookings and schedule</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[#D97706] text-white rounded-xl font-medium hover:bg-amber-600 transition text-sm shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Appointment</span>
        </button>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-4 bg-white rounded-xl border border-[#E7E5E4] p-4">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-[#F5F5F4] rounded-lg transition">
          <ChevronLeft className="w-4 h-4 text-[#78716C]" />
        </button>
        <div className="flex-1 text-center">
          <p className="font-semibold text-[#1C1917] text-sm sm:text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="hidden sm:inline">{isToday ? "Today — " : ""}{displayDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="sm:hidden">{isToday ? "Today" : displayDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </p>
        </div>
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-[#F5F5F4] rounded-lg transition">
          <ChevronRight className="w-4 h-4 text-[#78716C]" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: appointments.length, icon: Calendar, color: "bg-blue-50 text-blue-600" },
          { label: "Completed", value: appointments.filter((a) => a.status === "COMPLETED").length, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Upcoming", value: appointments.filter((a) => a.status === "CONFIRMED" || a.status === "PENDING").length, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "Revenue", value: formatINR(appointments.filter((a) => a.status === "COMPLETED").reduce((s, a) => s + a.amount, 0)), icon: User, color: "bg-purple-50 text-purple-600" },
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

      {/* Appointments list */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E7E5E4]">
          <h2 className="font-semibold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isToday ? "Today's" : displayDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} Schedule
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
          </div>
        ) : (
          <div className="divide-y divide-[#E7E5E4]">
            {appointments.map((appt) => (
              <div key={appt.id} className="flex items-center gap-4 p-4 hover:bg-[#FAFAF9] transition">
                <div className="text-center w-20 shrink-0">
                  <p className="text-[#D97706] font-bold text-sm">{appt.time}</p>
                  <p className="text-[#78716C] text-xs">{appt.duration}m</p>
                </div>
                <div className={`w-9 h-9 rounded-full ${getAvatarColor(appt.clientName)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {getInitials(appt.clientName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1C1917] text-sm truncate">{appt.clientName}</p>
                  <p className="text-[#78716C] text-xs truncate">{appt.serviceName}</p>
                </div>
                <div className="hidden sm:block text-sm text-[#78716C]">{appt.staffName}</div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(appt.status)}`}>
                  {statusLabel[appt.status] ?? appt.status}
                </span>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-[#1C1917] text-sm">{formatINR(appt.amount)}</p>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="p-8 text-center text-[#78716C]">No appointments on this day</div>
            )}
          </div>
        )}
      </div>

      {/* New Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4] sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-[#1C1917] text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                New Appointment
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#F5F5F4] rounded-lg transition">
                <X className="w-5 h-5 text-[#78716C]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Client type toggle */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Client</label>
                <div className="flex rounded-lg border border-[#E7E5E4] overflow-hidden mb-3">
                  {(["existing", "walkin"] as const).map((t) => (
                    <button key={t} type="button"
                      onClick={() => { setForm((f) => ({ ...f, clientType: t, clientId: "", walkInName: "", walkInPhone: "" })); setClientSearch(""); setClientResults([]); }}
                      className={`flex-1 py-2 text-sm font-medium transition ${form.clientType === t ? "bg-[#1C1917] text-white" : "text-[#78716C] hover:bg-[#F5F5F4]"}`}>
                      {t === "existing" ? "Existing Client" : "Walk-in"}
                    </button>
                  ))}
                </div>

                {form.clientType === "existing" ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                    <input type="text" placeholder="Search by name or phone..." value={clientSearch}
                      onChange={(e) => { setClientSearch(e.target.value); setForm((f) => ({ ...f, clientId: "" })); }}
                      className="w-full pl-9 pr-4 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                    {clientSearch && clientResults.length > 0 && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-[#E7E5E4] rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                        {clientResults.map((c) => (
                          <button key={c.id} type="button"
                            onClick={() => { setForm((f) => ({ ...f, clientId: c.id })); setClientSearch(c.name); setClientResults([]); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#FAFAF9] transition text-left">
                            <div className={`w-8 h-8 rounded-full ${getAvatarColor(c.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                              {getInitials(c.name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#1C1917]">{c.name}</p>
                              <p className="text-xs text-[#78716C]">{c.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {form.clientId && (
                      <p className="mt-1.5 text-xs text-emerald-600 font-medium">✓ {clientSearch} selected</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input type="text" placeholder="Walk-in name (optional)" value={form.walkInName}
                      onChange={(e) => setForm((f) => ({ ...f, walkInName: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                    <input type="tel" placeholder="Phone number (optional)" value={form.walkInPhone}
                      onChange={(e) => setForm((f) => ({ ...f, walkInPhone: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                  </div>
                )}
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Service</label>
                <select value={form.serviceId} onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white">
                  <option value="">Select a service...</option>
                  {categories.map((cat) => (
                    <optgroup key={cat.id} label={cat.name}>
                      {services.filter((s) => s.categoryId === cat.id).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — ₹{s.price} ({s.duration} min)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Staff */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Assign Staff</label>
                <select value={form.staffId} onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white">
                  <option value="">Select staff member...</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.role.charAt(0) + s.role.slice(1).toLowerCase().replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-2">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-2">Time</label>
                  <select value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white">
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Notes (optional)</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special requests or notes..." rows={2}
                  className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] resize-none" />
              </div>

              {/* Summary */}
              {selectedService && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1 text-sm">
                  <p className="font-semibold text-[#1C1917]">{selectedService.name}</p>
                  <p className="text-[#78716C]">{selectedService.duration} min · {formatINR(selectedService.price)} + GST</p>
                  {selectedStaff && <p className="text-[#78716C]">With {selectedStaff.name}</p>}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-[#E7E5E4] rounded-xl text-sm font-medium text-[#78716C] hover:bg-[#F5F5F4] transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-[#D97706] text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Book Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
