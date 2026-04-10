"use client";
import { useState, useEffect, useCallback } from "react";
import { Scissors, Plus, Clock, Tag, X, Search, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";

type Category = { id: string; name: string; order: number };
type Service = { id: string; name: string; categoryId: string; duration: number; price: number; gstRate: number; category?: Category };
type ServiceForm = { name: string; categoryId: string; duration: string; price: string; gstRate: string };
const DEFAULT_FORM: ServiceForm = { name: "", categoryId: "", duration: "30", price: "", gstRate: "18" };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<ServiceForm>>({});
  const [saving, setSaving] = useState(false);
  const [showCatInput, setShowCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([fetch("/api/services"), fetch("/api/services/categories")]);
      const [sData, cData] = await Promise.all([sRes.json(), cRes.json()]);
      setServices(Array.isArray(sData) ? sData : []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch { toast.error("Failed to load services"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = services.filter((s) => {
    const matchCat = activeCategory === "all" || s.categoryId === activeCategory;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function openAdd() {
    setEditTarget(null);
    setForm({ ...DEFAULT_FORM, categoryId: categories[0]?.id ?? "" });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(s: Service) {
    setEditTarget(s);
    setForm({ name: s.name, categoryId: s.categoryId, duration: String(s.duration), price: String(s.price), gstRate: String(s.gstRate) });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const e: Partial<ServiceForm> = {};
    if (!form.name.trim()) e.name = "Service name required";
    if (!form.categoryId) e.categoryId = "Select a category";
    const p = Number(form.price);
    if (!form.price || isNaN(p) || p <= 0) e.price = "Enter valid price";
    const d = Number(form.duration);
    if (!form.duration || isNaN(d) || d <= 0) e.duration = "Enter valid duration";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const url = editTarget ? `/api/services/${editTarget.id}` : "/api/services";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), categoryId: form.categoryId, duration: Number(form.duration), price: Number(form.price), gstRate: Number(form.gstRate) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editTarget ? "Service updated!" : "Service added!");
      setShowModal(false);
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch("/api/services/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success("Category added!");
      setNewCatName("");
      setShowCatInput(false);
      fetchAll();
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingCat(false); }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/services/${id}`, { method: "DELETE" });
      toast.success("Service deleted");
      fetchAll();
    } catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Services</h1>
          <p className="text-[#78716C] text-sm mt-0.5">{services.length} services across {categories.length} categories</p>
        </div>
        <button
          onClick={categories.length === 0 ? () => toast.error("Add a category first") : openAdd}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[#D97706] text-white rounded-xl font-medium hover:bg-amber-600 transition text-sm shrink-0">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Add Service</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
        <input type="text" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-[#E7E5E4] rounded-xl bg-white text-sm placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition ${activeCategory === "all" ? "bg-[#1C1917] text-white border-[#1C1917]" : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#D97706]"}`}>
          All ({services.length})
        </button>
        {categories.map((cat) => {
          const count = services.filter((s) => s.categoryId === cat.id).length;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${activeCategory === cat.id ? "bg-[#1C1917] text-white border-[#1C1917]" : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#D97706]"}`}>
              {cat.name} ({count})
            </button>
          );
        })}
        {showCatInput ? (
          <form onSubmit={handleAddCategory} className="flex items-center gap-1.5">
            <input
              autoFocus
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name"
              className="px-3 py-1.5 border border-[#D97706] rounded-full text-sm focus:outline-none w-36"
            />
            <button type="submit" disabled={savingCat}
              className="px-3 py-1.5 bg-[#D97706] text-white rounded-full text-xs font-medium hover:bg-amber-600 transition disabled:opacity-50">
              {savingCat ? "..." : "Add"}
            </button>
            <button type="button" onClick={() => { setShowCatInput(false); setNewCatName(""); }}
              className="p-1.5 text-[#78716C] hover:text-[#1C1917]"><X className="w-4 h-4" /></button>
          </form>
        ) : (
          <button onClick={() => setShowCatInput(true)}
            className="px-3 py-2 rounded-full text-xs font-medium border border-dashed border-[#D97706] text-[#D97706] hover:bg-amber-50 transition flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Category
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#D97706]" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((service) => {
            const category = categories.find((c) => c.id === service.categoryId);
            return (
              <div key={service.id} className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-4 hover:border-[#D97706] transition">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-medium text-[#1C1917] text-sm leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{service.name}</h3>
                  <span className="text-xs text-[#78716C] bg-[#F5F5F4] px-2 py-0.5 rounded-full shrink-0">{category?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[#78716C] text-xs"><Clock className="w-3 h-3" /><span>{service.duration} min</span></div>
                  <div className="flex items-center gap-1 text-[#78716C] text-xs"><Tag className="w-3 h-3" /><span>GST {service.gstRate}%</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#E7E5E4] flex items-center justify-between">
                  <p className="text-lg font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{formatINR(service.price)}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(service)} className="text-xs text-[#D97706] font-medium hover:underline">Edit</button>
                    <span className="text-[#E7E5E4]">|</span>
                    <button onClick={() => handleDelete(service.id)} className="text-xs text-red-500 font-medium hover:underline">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="col-span-full text-center py-12 text-[#78716C]">No services found</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4] sticky top-0 bg-white z-10">
              <h2 className="font-bold text-[#1C1917] text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{editTarget ? "Edit Service" : "Add Service"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#F5F5F4] rounded-lg"><X className="w-5 h-5 text-[#78716C]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Service Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Haircut (Men)"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.name ? "border-red-400" : "border-[#E7E5E4]"}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">Category <span className="text-red-500">*</span></label>
                {categories.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                    No categories yet. Close this and click <strong>"+ Add Category"</strong> first.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button key={cat.id} type="button" onClick={() => setForm((f) => ({ ...f, categoryId: cat.id }))}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition ${form.categoryId === cat.id ? "bg-[#1C1917] text-white border-[#1C1917]" : "border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]"}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
                {(errors as any).categoryId && <p className="text-red-500 text-xs mt-1">{(errors as any).categoryId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Duration (min) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                    <input type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} min={5}
                      className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.duration ? "border-red-400" : "border-[#E7E5E4]"}`} />
                  </div>
                  {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Price (₹) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="500" min={0}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.price ? "border-red-400" : "border-[#E7E5E4]"}`} />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-2">GST Rate</label>
                <div className="flex gap-2">
                  {["0", "5", "12", "18", "28"].map((r) => (
                    <button key={r} type="button" onClick={() => setForm((f) => ({ ...f, gstRate: r }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition ${form.gstRate === r ? "bg-[#1C1917] text-white border-[#1C1917]" : "border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]"}`}>
                      {r}%
                    </button>
                  ))}
                </div>
              </div>
              {form.price && !isNaN(Number(form.price)) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                  <p className="text-[#78716C]">Base: {formatINR(Number(form.price))} + GST = <span className="font-semibold text-[#1C1917]">{formatINR(Number(form.price) * (1 + Number(form.gstRate) / 100))}</span></p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-[#E7E5E4] rounded-xl text-sm font-medium text-[#78716C] hover:bg-[#F5F5F4] transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-[#D97706] text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editTarget ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
