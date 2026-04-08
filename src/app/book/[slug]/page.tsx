"use client";

import { use, useState, useEffect } from "react";
import {
  Scissors, Calendar, Clock, ChevronRight, ChevronLeft,
  User, Phone, CheckCircle2, Loader2, X,
} from "lucide-react";
import { formatINR } from "@/lib/utils";

type Service = { id: string; name: string; price: number; duration: number; categoryId: string };
type Category = { id: string; name: string };
type Staff = { id: string; name: string; role: string };

const TIME_SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00",
];

const STEPS = ["Service", "Staff & Time", "Your Details", "Confirm"] as const;
type Step = 0 | 1 | 2 | 3;

export default function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const salonName = slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const [step, setStep] = useState<Step>(0);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/services").then((r) => r.json()),
      fetch("/api/services/categories").then((r) => r.json()),
      fetch("/api/staff").then((r) => r.json()),
    ]).then(([sv, c, st]) => {
      setServices(Array.isArray(sv) ? sv : []);
      setCategories(Array.isArray(c) ? c : []);
      setStaff(Array.isArray(st) ? st : []);
    }).finally(() => setLoading(false));
  }, []);

  const filteredServices = activeCat === "all" ? services : services.filter((s) => s.categoryId === activeCat);

  async function confirmBooking() {
    if (!name.trim() || !phone.trim()) { setError("Please enter your name and phone number."); return; }
    if (phone.replace(/\D/g, "").length < 10) { setError("Please enter a valid 10-digit phone number."); return; }
    setError("");
    setBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walkInName: name.trim(),
          staffId: selectedStaff?.id,
          serviceId: selectedService?.id,
          date: selectedDate,
          time: selectedTime,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Booking failed"); }
      setBooked(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D97706]" />
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E7E5E4] p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#1C1917] mb-2">Booking Confirmed!</h2>
          <p className="text-[#78716C] text-sm mb-6">
            Your appointment has been booked. We&apos;ll see you soon!
          </p>
          <div className="bg-[#FAFAF9] rounded-xl p-4 text-left space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-[#78716C]">Service</span>
              <span className="font-medium text-[#1C1917]">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Staff</span>
              <span className="font-medium text-[#1C1917]">{selectedStaff?.name ?? "Any available"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Date & Time</span>
              <span className="font-medium text-[#1C1917]">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at {selectedTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#78716C]">Amount</span>
              <span className="font-medium text-amber-600">{formatINR(selectedService?.price ?? 0)} + GST</span>
            </div>
          </div>
          <button
            onClick={() => { setBooked(false); setStep(0); setSelectedService(null); setSelectedStaff(null); setSelectedTime(""); setName(""); setPhone(""); setNotes(""); }}
            className="w-full bg-[#1C1917] text-white py-3 rounded-xl font-medium hover:bg-[#292524] transition-colors"
          >
            Book Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Header */}
      <div className="bg-[#1C1917] text-white px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D97706] rounded-xl flex items-center justify-center shrink-0">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{salonName}</h1>
            <p className="text-amber-300 text-xs">Online Booking</p>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="bg-white border-b border-[#E7E5E4] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                i < step ? "bg-emerald-500 text-white" :
                i === step ? "bg-[#D97706] text-white" :
                "bg-[#E7E5E4] text-[#78716C]"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs font-medium truncate hidden sm:block ${i === step ? "text-[#1C1917]" : "text-[#78716C]"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="h-px bg-[#E7E5E4] flex-1 hidden sm:block" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-32">

        {/* STEP 0: Choose Service */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1C1917] mt-2">Choose a Service</h2>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveCat("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCat === "all" ? "bg-[#1C1917] text-white" : "bg-white border border-[#E7E5E4] text-[#78716C] hover:border-[#1C1917]"}`}>
                All
              </button>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCat(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCat === cat.id ? "bg-[#1C1917] text-white" : "bg-white border border-[#E7E5E4] text-[#78716C] hover:border-[#1C1917]"}`}>
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredServices.map((svc) => (
                <button key={svc.id} onClick={() => setSelectedService(svc)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    selectedService?.id === svc.id ? "border-[#D97706] bg-amber-50" : "border-[#E7E5E4] bg-white hover:border-[#D97706]"
                  }`}>
                  <div>
                    <p className="font-medium text-[#1C1917]">{svc.name}</p>
                    <p className="text-sm text-[#78716C] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> {svc.duration} min
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-[#1C1917]">{formatINR(svc.price)}</p>
                    <p className="text-xs text-[#78716C]">+GST</p>
                  </div>
                </button>
              ))}
              {filteredServices.length === 0 && (
                <p className="text-center text-[#78716C] py-8">No services available</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 1: Choose Staff & Time */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-[#1C1917] mt-2">Choose Staff & Time</h2>

            {/* Staff */}
            <div>
              <label className="block text-sm font-semibold text-[#1C1917] mb-2">Select Stylist</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setSelectedStaff(null)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${!selectedStaff ? "border-[#D97706] bg-amber-50" : "border-[#E7E5E4] bg-white hover:border-[#D97706]"}`}>
                  <div className="w-10 h-10 bg-[#E7E5E4] rounded-full flex items-center justify-center mx-auto mb-1.5">
                    <User className="w-5 h-5 text-[#78716C]" />
                  </div>
                  <p className="text-sm font-medium text-[#1C1917]">Any Available</p>
                </button>
                {staff.map((s) => (
                  <button key={s.id} onClick={() => setSelectedStaff(s)}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${selectedStaff?.id === s.id ? "border-[#D97706] bg-amber-50" : "border-[#E7E5E4] bg-white hover:border-[#D97706]"}`}>
                    <div className="w-10 h-10 bg-[#D97706] rounded-full flex items-center justify-center mx-auto mb-1.5 text-white font-bold text-sm">
                      {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-[#1C1917] truncate">{s.name.split(" ")[0]}</p>
                    <p className="text-xs text-[#78716C] truncate">{s.role.charAt(0) + s.role.slice(1).toLowerCase().replace("_", " ")}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-[#1C1917] mb-2">Select Date</label>
              <input type="date" value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white" />
            </div>

            {/* Time slots */}
            <div>
              <label className="block text-sm font-semibold text-[#1C1917] mb-2">Select Time</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {TIME_SLOTS.map((t) => (
                  <button key={t} onClick={() => setSelectedTime(t)}
                    className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${
                      selectedTime === t ? "bg-[#D97706] border-[#D97706] text-white" : "bg-white border-[#E7E5E4] text-[#1C1917] hover:border-[#D97706]"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Your Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1C1917] mt-2">Your Details</h2>
            <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#78716C] mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Your name..."
                    className="w-full pl-9 pr-4 py-3 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#78716C] mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number..."
                    className="w-full pl-9 pr-4 py-3 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#78716C] mb-1.5">Special Requests (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests or preferences..."
                  rows={3}
                  className="w-full px-4 py-3 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#1C1917] mt-2">Confirm Booking</h2>
            <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E7E5E4]">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-[#1C1917]">{selectedService?.name}</p>
                  <p className="text-sm text-[#78716C]">{selectedService?.duration} min · {formatINR(selectedService?.price ?? 0)} + GST</p>
                </div>
              </div>
              {[
                { label: "Staff", value: selectedStaff?.name ?? "Any Available" },
                { label: "Date", value: new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
                { label: "Time", value: selectedTime },
                { label: "Name", value: name },
                { label: "Phone", value: phone },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-[#78716C]">{row.label}</span>
                  <span className="font-medium text-[#1C1917]">{row.value}</span>
                </div>
              ))}
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <X className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E7E5E4] p-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <button onClick={() => { setStep((s) => (s - 1) as Step); setError(""); }}
              className="flex items-center gap-2 px-5 py-3 border border-[#E7E5E4] rounded-xl text-[#78716C] font-medium hover:bg-[#FAFAF9] transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => {
                setError("");
                if (step === 0 && !selectedService) { setError("Please select a service to continue."); return; }
                if (step === 1 && !selectedTime) { setError("Please select a time slot."); return; }
                setStep((s) => (s + 1) as Step);
              }}
              disabled={step === 0 && !selectedService}
              className="flex-1 flex items-center justify-center gap-2 bg-[#D97706] hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={confirmBooking} disabled={booking}
              className="flex-1 flex items-center justify-center gap-2 bg-[#D97706] hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
              {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              {booking ? "Booking..." : "Confirm Appointment"}
            </button>
          )}
        </div>
        {error && step < 3 && (
          <p className="text-red-600 text-xs text-center mt-2 max-w-2xl mx-auto">{error}</p>
        )}
      </div>
    </div>
  );
}
