"use client";
import { useState, useEffect, useCallback } from "react";
import { Package, Plus, AlertTriangle, Search, X, Loader2 } from "lucide-react";
import { formatINR } from "@/lib/utils";
import toast, { Toaster } from "react-hot-toast";

type Product = { id: string; name: string; brand: string | null; category: string | null; costPrice: number; sellingPrice: number; stockLevel: number; minStockThreshold: number };
type ProductForm = { name: string; brand: string; category: string; costPrice: string; sellingPrice: string; stockLevel: string; minStockThreshold: string };
const DEFAULT_FORM: ProductForm = { name: "", brand: "", category: "Hair Color", costPrice: "", sellingPrice: "", stockLevel: "0", minStockThreshold: "5" };
const CATEGORIES = ["Hair Color", "Styling", "Shampoo", "Conditioner", "Nail", "Hair Oil", "Skin Care", "Tools", "Other"];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<ProductForm>>({});
  const [saving, setSaving] = useState(false);
  const [showStockModal, setShowStockModal] = useState<Product | null>(null);
  const [stockAdjust, setStockAdjust] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to load inventory"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const allCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    return matchSearch && matchCat;
  });
  const lowStock = products.filter((p) => p.stockLevel <= p.minStockThreshold);
  const totalValue = products.reduce((s, p) => s + p.sellingPrice * p.stockLevel, 0);

  function openAdd() { setEditTarget(null); setForm(DEFAULT_FORM); setErrors({}); setShowModal(true); }
  function openEdit(p: Product) {
    setEditTarget(p);
    setForm({ name: p.name, brand: p.brand ?? "", category: p.category ?? "Other", costPrice: String(p.costPrice), sellingPrice: String(p.sellingPrice), stockLevel: String(p.stockLevel), minStockThreshold: String(p.minStockThreshold) });
    setErrors({}); setShowModal(true);
  }

  function validate() {
    const e: Partial<ProductForm> = {};
    if (!form.name.trim()) e.name = "Product name required";
    if (!form.brand.trim()) e.brand = "Brand required";
    if (!form.costPrice || isNaN(Number(form.costPrice))) e.costPrice = "Enter valid cost";
    if (!form.sellingPrice || isNaN(Number(form.sellingPrice)) || Number(form.sellingPrice) <= 0) e.sellingPrice = "Enter valid price";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const url = editTarget ? `/api/inventory/${editTarget.id}` : "/api/inventory";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), brand: form.brand.trim(), category: form.category, costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice), stockLevel: Number(form.stockLevel), minStockThreshold: Number(form.minStockThreshold) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editTarget ? "Product updated!" : "Product added!");
      setShowModal(false); fetchProducts();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await fetch(`/api/inventory/${id}`, { method: "DELETE" }); toast.success("Deleted"); fetchProducts(); }
    catch { toast.error("Failed to delete"); }
  }

  async function handleStockAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!showStockModal) return;
    const delta = parseInt(stockAdjust);
    if (isNaN(delta)) { toast.error("Enter a valid number"); return; }
    try {
      await fetch(`/api/inventory/${showStockModal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ delta }) });
      toast.success(`Stock ${delta >= 0 ? "added" : "removed"}: ${Math.abs(delta)} units`);
      setShowStockModal(null); setStockAdjust(""); fetchProducts();
    } catch { toast.error("Failed to update stock"); }
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Inventory</h1>
          <p className="text-[#78716C] text-sm mt-0.5">{products.length} products · {lowStock.length} low stock alerts</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#D97706] text-white rounded-xl font-medium hover:bg-amber-600 transition text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products.length, color: "bg-blue-50 text-blue-600" },
          { label: "Low Stock", value: lowStock.length, color: "bg-red-50 text-red-600" },
          { label: "Stock Value", value: formatINR(totalValue), color: "bg-emerald-50 text-emerald-600" },
          { label: "Categories", value: allCategories.length, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E7E5E4] p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}><Package className="w-4 h-4" /></div>
            <p className="text-2xl font-bold text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</p>
            <p className="text-[#78716C] text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Low Stock Alert</p>
            <p className="text-amber-700 text-sm mt-0.5">{lowStock.map((p) => p.name).join(", ")} need restocking.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#E7E5E4] rounded-xl bg-white text-sm placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveCategory("all")} className={`px-3 py-2 rounded-full text-sm font-medium border transition ${activeCategory === "all" ? "bg-[#1C1917] text-white border-[#1C1917]" : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#D97706]"}`}>All</button>
          {allCategories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-2 rounded-full text-sm font-medium border transition ${activeCategory === cat ? "bg-[#1C1917] text-white border-[#1C1917]" : "bg-white text-[#78716C] border-[#E7E5E4] hover:border-[#D97706]"}`}>{cat}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#D97706]" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E7E5E4] bg-[#FAFAF9]">
                  <th className="text-left px-5 py-3.5 font-medium text-[#78716C]">Product</th>
                  <th className="text-left px-5 py-3.5 font-medium text-[#78716C]">Category</th>
                  <th className="text-right px-5 py-3.5 font-medium text-[#78716C]">Cost</th>
                  <th className="text-right px-5 py-3.5 font-medium text-[#78716C]">Price</th>
                  <th className="text-right px-5 py-3.5 font-medium text-[#78716C]">Margin</th>
                  <th className="text-center px-5 py-3.5 font-medium text-[#78716C]">Stock</th>
                  <th className="text-right px-5 py-3.5 font-medium text-[#78716C]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {filtered.map((p) => {
                  const margin = p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-[#FAFAF9] transition">
                      <td className="px-5 py-4"><p className="font-medium text-[#1C1917]">{p.name}</p><p className="text-[#78716C] text-xs">{p.brand}</p></td>
                      <td className="px-5 py-4 text-[#78716C]">{p.category}</td>
                      <td className="px-5 py-4 text-right text-[#78716C]">{formatINR(p.costPrice)}</td>
                      <td className="px-5 py-4 text-right font-medium text-[#1C1917]">{formatINR(p.sellingPrice)}</td>
                      <td className="px-5 py-4 text-right"><span className="text-emerald-600 font-medium">{margin}%</span></td>
                      <td className="px-5 py-4 text-center">
                        <button onClick={() => { setShowStockModal(p); setStockAdjust(""); }}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium hover:opacity-80 transition ${p.stockLevel <= p.minStockThreshold ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {p.stockLevel} units
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(p)} className="text-xs text-[#D97706] font-medium hover:underline">Edit</button>
                          <span className="text-[#E7E5E4]">|</span>
                          <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 font-medium hover:underline">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-[#78716C]">No products found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#E7E5E4] sticky top-0 bg-white z-10">
              <h2 className="font-bold text-[#1C1917] text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{editTarget ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#F5F5F4] rounded-lg"><X className="w-5 h-5 text-[#78716C]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Product Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. L'Oreal Excellence Creme"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.name ? "border-red-400" : "border-[#E7E5E4]"}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Brand <span className="text-red-500">*</span></label>
                  <input type="text" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} placeholder="L'Oreal"
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.brand ? "border-red-400" : "border-[#E7E5E4]"}`} />
                  {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Cost Price (₹) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} placeholder="320" min={0}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.costPrice ? "border-red-400" : "border-[#E7E5E4]"}`} />
                  {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Selling Price (₹) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} placeholder="580" min={0}
                    className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] ${errors.sellingPrice ? "border-red-400" : "border-[#E7E5E4]"}`} />
                  {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Current Stock</label>
                  <input type="number" value={form.stockLevel} onChange={(e) => setForm((f) => ({ ...f, stockLevel: e.target.value }))} min={0} className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Low Stock Alert at</label>
                  <input type="number" value={form.minStockThreshold} onChange={(e) => setForm((f) => ({ ...f, minStockThreshold: e.target.value }))} min={0} className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
                </div>
              </div>
              {form.costPrice && form.sellingPrice && Number(form.sellingPrice) > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
                  <p className="text-emerald-700">Margin: <span className="font-semibold">{Math.round(((Number(form.sellingPrice) - Number(form.costPrice)) / Number(form.sellingPrice)) * 100)}%</span> · Profit per unit: <span className="font-semibold">{formatINR(Number(form.sellingPrice) - Number(form.costPrice))}</span></p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-[#E7E5E4] rounded-xl text-sm font-medium text-[#78716C] hover:bg-[#F5F5F4] transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-[#D97706] text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editTarget ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjust Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStockModal(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-xl p-6">
            <h2 className="font-bold text-[#1C1917] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Adjust Stock</h2>
            <p className="text-[#78716C] text-sm mb-4">{showStockModal.name} · Current: <strong>{showStockModal.stockLevel} units</strong></p>
            <form onSubmit={handleStockAdjust} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Quantity (+ to add, - to remove)</label>
                <input type="number" value={stockAdjust} onChange={(e) => setStockAdjust(e.target.value)} placeholder="+10 or -3" autoFocus
                  className="w-full px-3 py-2.5 border border-[#E7E5E4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowStockModal(null)} className="flex-1 py-2.5 border border-[#E7E5E4] rounded-xl text-sm font-medium text-[#78716C]">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#D97706] text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition">Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
