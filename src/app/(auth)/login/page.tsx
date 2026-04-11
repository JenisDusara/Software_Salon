"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Scissors } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      // Fetch session from server — works reliably on both local & Vercel
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;

      // Use window.location for a hard redirect — avoids Next.js router race conditions
      if (role === "SUPER_ADMIN") {
        window.location.href = "/super-admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1C1917] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D97706] rounded-xl flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            SalonSoft Pro
          </span>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            The smarter way to<br />
            <span className="text-[#D97706]">run your salon</span>
          </h1>
          <p className="text-[#A8A29E] text-lg mb-10">
            Billing, CRM, GST compliance, staff management and WhatsApp — all in one place.
          </p>
          <div className="flex flex-wrap gap-3">
            {["₹ GST Invoicing", "📱 WhatsApp", "📊 P&L Reports", "🗓️ Appointments", "👥 Client CRM"].map((f) => (
              <span key={f} className="px-4 py-2 bg-[#292524] text-[#A8A29E] rounded-full text-sm">{f}</span>
            ))}
          </div>
        </div>

        <p className="text-[#78716C] text-sm">Trusted by salons across India</p>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-[#D97706] rounded-xl flex items-center justify-center">
              <Scissors className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-[#1C1917]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              SalonSoft Pro
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#1C1917] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome back 👋
          </h2>
          <p className="text-[#78716C] mb-8">Sign in to your salon dashboard</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-[#E7E5E4] rounded-xl bg-white text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition"
                placeholder="you@yoursalon.in"
                required
                autoFocus
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1C1917] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E7E5E4] rounded-xl bg-white text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#1C1917] text-white rounded-xl font-semibold hover:bg-[#292524] transition disabled:opacity-60"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
