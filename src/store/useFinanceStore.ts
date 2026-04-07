"use client";
import { create } from "zustand";

export interface InvoiceItem {
  id: string;
  description: string;
  serviceId?: string;
  productId?: string;
  quantity: number;
  rate: number;
  discount: number;
  taxableAmt: number;
  cgst: number;
  sgst: number;
  total: number;
  gstRate?: number;
}

export interface CartItem {
  id: string;
  type: "service" | "product";
  serviceId?: string;
  productId?: string;
  name: string;
  duration?: number;
  quantity: number;
  rate: number;
  discount: number;
  discountType: "flat" | "percent";
  staffId?: string;
  gstRate: number;
}

export interface ActiveBill {
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  walkInName?: string;
  staffId?: string;
  appointmentId?: string;
  items: CartItem[];
  overallDiscount: number;
  overallDiscountType: "flat" | "percent";
  tips: number;
  paymentMethod: "CASH" | "UPI" | "CARD" | "LINK" | "SPLIT" | "";
  paymentMethod2?: "CASH" | "UPI" | "CARD" | "LINK" | "";
  splitAmount1?: number;
  splitAmount2?: number;
  paymentRef?: string;
}

interface FinanceState {
  activeBill: ActiveBill;
  updateActiveBill: (updates: Partial<ActiveBill>) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (id: string) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  clearBill: () => void;
}

const defaultBill: ActiveBill = {
  items: [],
  overallDiscount: 0,
  overallDiscountType: "flat",
  tips: 0,
  paymentMethod: "",
};

export const useFinanceStore = create<FinanceState>((set) => ({
  activeBill: defaultBill,

  updateActiveBill: (updates) =>
    set((state) => ({
      activeBill: { ...state.activeBill, ...updates },
    })),

  addCartItem: (item) =>
    set((state) => ({
      activeBill: {
        ...state.activeBill,
        items: [...state.activeBill.items, item],
      },
    })),

  removeCartItem: (id) =>
    set((state) => ({
      activeBill: {
        ...state.activeBill,
        items: state.activeBill.items.filter((i) => i.id !== id),
      },
    })),

  updateCartItem: (id, updates) =>
    set((state) => ({
      activeBill: {
        ...state.activeBill,
        items: state.activeBill.items.map((i) =>
          i.id === id ? { ...i, ...updates } : i
        ),
      },
    })),

  clearBill: () => set({ activeBill: defaultBill }),
}));
