// SalonSoft Pro — Realistic sample data for Indian salons

export const SAMPLE_BRANCHES = [
  { id: "b1", name: "Mumbai Main", city: "Mumbai", address: "123, Linking Road, Bandra West, Mumbai - 400050" },
  { id: "b2", name: "Mumbai Andheri", city: "Mumbai", address: "45, Veera Desai Road, Andheri West, Mumbai - 400058" },
  { id: "b3", name: "Pune Branch", city: "Pune", address: "78, FC Road, Shivajinagar, Pune - 411005" },
];

export const SAMPLE_STAFF = [
  { id: "s1", name: "Priya Sharma", role: "SALON_ADMIN", phone: "9876543210", commissionRate: 15, branchId: "b1", image: null },
  { id: "s2", name: "Rahul Verma", role: "STAFF", phone: "9876543211", commissionRate: 20, branchId: "b1", image: null },
  { id: "s3", name: "Anita Nair", role: "STAFF", phone: "9876543212", commissionRate: 20, branchId: "b1", image: null },
  { id: "s4", name: "Suresh Kumar", role: "STAFF", phone: "9876543213", commissionRate: 18, branchId: "b1", image: null },
  { id: "s5", name: "Deepa Pillai", role: "MANAGER", phone: "9876543214", commissionRate: 12, branchId: "b2", image: null },
  { id: "s6", name: "Amit Joshi", role: "STAFF", phone: "9876543215", commissionRate: 20, branchId: "b2", image: null },
  { id: "s7", name: "Kavita Singh", role: "RECEPTIONIST", phone: "9876543216", commissionRate: 0, branchId: "b3", image: null },
  { id: "s8", name: "Rohan Mehta", role: "STAFF", phone: "9876543217", commissionRate: 18, branchId: "b3", image: null },
];

export const SERVICE_CATEGORIES = [
  { id: "sc1", name: "Hair", order: 1 },
  { id: "sc2", name: "Color", order: 2 },
  { id: "sc3", name: "Beard", order: 3 },
  { id: "sc4", name: "Skin & Facial", order: 4 },
  { id: "sc5", name: "Nails", order: 5 },
  { id: "sc6", name: "Bridal", order: 6 },
];

export const SAMPLE_SERVICES = [
  { id: "sv1", name: "Haircut (Men)", categoryId: "sc1", duration: 30, price: 350, gstRate: 18 },
  { id: "sv2", name: "Haircut (Women)", categoryId: "sc1", duration: 45, price: 500, gstRate: 18 },
  { id: "sv3", name: "Hair Wash & Dry", categoryId: "sc1", duration: 30, price: 250, gstRate: 18 },
  { id: "sv4", name: "Hair Spa", categoryId: "sc1", duration: 60, price: 800, gstRate: 18 },
  { id: "sv5", name: "Global Hair Color", categoryId: "sc2", duration: 120, price: 2500, gstRate: 18 },
  { id: "sv6", name: "Highlights (Partial)", categoryId: "sc2", duration: 90, price: 1800, gstRate: 18 },
  { id: "sv7", name: "Beard Trim", categoryId: "sc3", duration: 20, price: 150, gstRate: 18 },
  { id: "sv8", name: "Clean Shave", categoryId: "sc3", duration: 30, price: 200, gstRate: 18 },
  { id: "sv9", name: "Facial (Basic)", categoryId: "sc4", duration: 45, price: 700, gstRate: 18 },
  { id: "sv10", name: "Facial (Premium)", categoryId: "sc4", duration: 60, price: 1500, gstRate: 18 },
  { id: "sv11", name: "Manicure", categoryId: "sc5", duration: 45, price: 600, gstRate: 18 },
  { id: "sv12", name: "Pedicure", categoryId: "sc5", duration: 60, price: 800, gstRate: 18 },
  { id: "sv13", name: "Bridal Makeup", categoryId: "sc6", duration: 120, price: 8000, gstRate: 18 },
  { id: "sv14", name: "Pre-Bridal Package", categoryId: "sc6", duration: 180, price: 15000, gstRate: 18 },
];

export const SAMPLE_CLIENTS = [
  { id: "c1", name: "Sneha Patel", phone: "9876500001", email: "sneha@gmail.com", gender: "Female", loyaltyPoints: 450, totalSpent: 12500, visitCount: 18, lastVisit: new Date("2025-03-15") },
  { id: "c2", name: "Arjun Kapoor", phone: "9876500002", email: null, gender: "Male", loyaltyPoints: 230, totalSpent: 8200, visitCount: 12, lastVisit: new Date("2025-03-20") },
  { id: "c3", name: "Meera Iyer", phone: "9876500003", email: "meera.iyer@gmail.com", gender: "Female", loyaltyPoints: 780, totalSpent: 24000, visitCount: 28, lastVisit: new Date("2025-03-28") },
  { id: "c4", name: "Vikram Desai", phone: "9876500004", email: null, gender: "Male", loyaltyPoints: 120, totalSpent: 5400, visitCount: 8, lastVisit: new Date("2025-02-10") },
  { id: "c5", name: "Pooja Sharma", phone: "9876500005", email: "pooja.s@gmail.com", gender: "Female", loyaltyPoints: 560, totalSpent: 18900, visitCount: 22, lastVisit: new Date("2025-04-01") },
  { id: "c6", name: "Rajesh Nair", phone: "9876500006", email: null, gender: "Male", loyaltyPoints: 90, totalSpent: 3200, visitCount: 5, lastVisit: new Date("2025-03-05") },
  { id: "c7", name: "Anjali Mehta", phone: "9876500007", email: "anjali.mehta@outlook.com", gender: "Female", loyaltyPoints: 320, totalSpent: 11200, visitCount: 16, lastVisit: new Date("2025-03-22") },
  { id: "c8", name: "Karan Malhotra", phone: "9876500008", email: null, gender: "Male", loyaltyPoints: 180, totalSpent: 6800, visitCount: 10, lastVisit: new Date("2025-04-03") },
  { id: "c9", name: "Priyanka Verma", phone: "9876500009", email: "priyanka.v@gmail.com", gender: "Female", loyaltyPoints: 640, totalSpent: 22000, visitCount: 25, lastVisit: new Date("2025-04-05") },
  { id: "c10", name: "Sanjay Gupta", phone: "9876500010", email: null, gender: "Male", loyaltyPoints: 150, totalSpent: 4900, visitCount: 7, lastVisit: new Date("2025-03-12") },
  { id: "c11", name: "Nisha Reddy", phone: "9876500011", email: "nisha.reddy@gmail.com", gender: "Female", loyaltyPoints: 420, totalSpent: 15600, visitCount: 20, lastVisit: new Date("2025-04-04") },
  { id: "c12", name: "Aakash Thakur", phone: "9876500012", email: null, gender: "Male", loyaltyPoints: 60, totalSpent: 2100, visitCount: 4, lastVisit: new Date("2025-02-28") },
];

// Generate realistic invoice data
const today = new Date();
const daysBack = (n: number) => new Date(today.getTime() - n * 24 * 60 * 60 * 1000);

export const SAMPLE_INVOICES = [
  {
    id: "inv1", invoiceNumber: "INV-2025-0031", clientId: "c1", clientName: "Sneha Patel", clientPhone: "9876500001",
    staffId: "s2", staffName: "Rahul Verma", branchId: "b1",
    items: [{ description: "Global Hair Color", quantity: 1, rate: 2500, discount: 0, cgst: 225, sgst: 225, total: 2950 }, { description: "Hair Spa", quantity: 1, rate: 800, discount: 0, cgst: 72, sgst: 72, total: 944 }],
    subtotal: 3300, taxAmount: 594, discount: 0, tips: 100, totalAmount: 3994, amountPaid: 3994,
    paymentMethod: "UPI", status: "PAID", date: daysBack(1), dueDate: null,
  },
  {
    id: "inv2", invoiceNumber: "INV-2025-0030", clientId: "c2", clientName: "Arjun Kapoor", clientPhone: "9876500002",
    staffId: "s2", staffName: "Rahul Verma", branchId: "b1",
    items: [{ description: "Haircut (Men)", quantity: 1, rate: 350, discount: 0, cgst: 31.5, sgst: 31.5, total: 413 }, { description: "Beard Trim", quantity: 1, rate: 150, discount: 0, cgst: 13.5, sgst: 13.5, total: 177 }],
    subtotal: 500, taxAmount: 90, discount: 0, tips: 50, totalAmount: 640, amountPaid: 640,
    paymentMethod: "CASH", status: "PAID", date: daysBack(1), dueDate: null,
  },
  {
    id: "inv3", invoiceNumber: "INV-2025-0029", clientId: "c3", clientName: "Meera Iyer", clientPhone: "9876500003",
    staffId: "s3", staffName: "Anita Nair", branchId: "b1",
    items: [{ description: "Bridal Makeup", quantity: 1, rate: 8000, discount: 500, cgst: 675, sgst: 675, total: 8850 }],
    subtotal: 8000, taxAmount: 1350, discount: 500, tips: 500, totalAmount: 9350, amountPaid: 5000,
    paymentMethod: "SPLIT", status: "PARTIAL", date: daysBack(2), dueDate: daysBack(-3),
  },
  {
    id: "inv4", invoiceNumber: "INV-2025-0028", clientId: "c5", clientName: "Pooja Sharma", clientPhone: "9876500005",
    staffId: "s3", staffName: "Anita Nair", branchId: "b1",
    items: [{ description: "Facial (Premium)", quantity: 1, rate: 1500, discount: 0, cgst: 135, sgst: 135, total: 1770 }, { description: "Manicure", quantity: 1, rate: 600, discount: 0, cgst: 54, sgst: 54, total: 708 }],
    subtotal: 2100, taxAmount: 378, discount: 0, tips: 0, totalAmount: 2478, amountPaid: 2478,
    paymentMethod: "CARD", status: "PAID", date: daysBack(2), dueDate: null,
  },
  {
    id: "inv5", invoiceNumber: "INV-2025-0027", clientId: "c8", clientName: "Karan Malhotra", clientPhone: "9876500008",
    staffId: "s2", staffName: "Rahul Verma", branchId: "b1",
    items: [{ description: "Haircut (Men)", quantity: 1, rate: 350, discount: 0, cgst: 31.5, sgst: 31.5, total: 413 }, { description: "Clean Shave", quantity: 1, rate: 200, discount: 0, cgst: 18, sgst: 18, total: 236 }],
    subtotal: 550, taxAmount: 99, discount: 0, tips: 0, totalAmount: 649, amountPaid: 0,
    paymentMethod: null, status: "PENDING", date: daysBack(3), dueDate: daysBack(-4),
  },
  {
    id: "inv6", invoiceNumber: "INV-2025-0026", clientId: "c9", clientName: "Priyanka Verma", clientPhone: "9876500009",
    staffId: "s3", staffName: "Anita Nair", branchId: "b1",
    items: [{ description: "Hair Wash & Dry", quantity: 1, rate: 250, discount: 0, cgst: 22.5, sgst: 22.5, total: 295 }, { description: "Highlights (Partial)", quantity: 1, rate: 1800, discount: 200, cgst: 144, sgst: 144, total: 1888 }],
    subtotal: 2050, taxAmount: 333, discount: 200, tips: 100, totalAmount: 2283, amountPaid: 2283,
    paymentMethod: "UPI", status: "PAID", date: daysBack(3), dueDate: null,
  },
  {
    id: "inv7", invoiceNumber: "INV-2025-0025", clientId: "c4", clientName: "Vikram Desai", clientPhone: "9876500004",
    staffId: "s4", staffName: "Suresh Kumar", branchId: "b1",
    items: [{ description: "Haircut (Men)", quantity: 1, rate: 350, discount: 0, cgst: 31.5, sgst: 31.5, total: 413 }],
    subtotal: 350, taxAmount: 63, discount: 0, tips: 0, totalAmount: 413, amountPaid: 0,
    paymentMethod: null, status: "OVERDUE", date: daysBack(10), dueDate: daysBack(3),
  },
  {
    id: "inv8", invoiceNumber: "INV-2025-0024", clientId: "c7", clientName: "Anjali Mehta", clientPhone: "9876500007",
    staffId: "s3", staffName: "Anita Nair", branchId: "b1",
    items: [{ description: "Pedicure", quantity: 1, rate: 800, discount: 0, cgst: 72, sgst: 72, total: 944 }, { description: "Manicure", quantity: 1, rate: 600, discount: 0, cgst: 54, sgst: 54, total: 708 }],
    subtotal: 1400, taxAmount: 252, discount: 0, tips: 100, totalAmount: 1752, amountPaid: 1752,
    paymentMethod: "CASH", status: "PAID", date: daysBack(4), dueDate: null,
  },
  {
    id: "inv9", invoiceNumber: "INV-2025-0023", clientId: "c11", clientName: "Nisha Reddy", clientPhone: "9876500011",
    staffId: "s3", staffName: "Anita Nair", branchId: "b1",
    items: [{ description: "Pre-Bridal Package", quantity: 1, rate: 15000, discount: 1000, cgst: 1260, sgst: 1260, total: 16520 }],
    subtotal: 15000, taxAmount: 2520, discount: 1000, tips: 1000, totalAmount: 17520, amountPaid: 10000,
    paymentMethod: "SPLIT", status: "PARTIAL", date: daysBack(5), dueDate: daysBack(-2),
  },
  {
    id: "inv10", invoiceNumber: "INV-2025-0022", clientId: "c6", clientName: "Rajesh Nair", clientPhone: "9876500006",
    staffId: "s4", staffName: "Suresh Kumar", branchId: "b1",
    items: [{ description: "Haircut (Men)", quantity: 1, rate: 350, discount: 0, cgst: 31.5, sgst: 31.5, total: 413 }, { description: "Facial (Basic)", quantity: 1, rate: 700, discount: 0, cgst: 63, sgst: 63, total: 826 }],
    subtotal: 1050, taxAmount: 189, discount: 0, tips: 50, totalAmount: 1289, amountPaid: 1289,
    paymentMethod: "UPI", status: "PAID", date: daysBack(5), dueDate: null,
  },
];

export const EXPENSE_CATEGORIES = [
  { id: "ec1", name: "Rent & Lease", icon: "🏠", color: "bg-red-100 text-red-700" },
  { id: "ec2", name: "Salaries & Wages", icon: "👥", color: "bg-purple-100 text-purple-700" },
  { id: "ec3", name: "Products & Supplies", icon: "🧴", color: "bg-blue-100 text-blue-700" },
  { id: "ec4", name: "Utilities", icon: "💡", color: "bg-yellow-100 text-yellow-700" },
  { id: "ec5", name: "Marketing & Ads", icon: "📣", color: "bg-pink-100 text-pink-700" },
  { id: "ec6", name: "Equipment & Tools", icon: "🔧", color: "bg-gray-100 text-gray-700" },
  { id: "ec7", name: "Transportation", icon: "🚗", color: "bg-teal-100 text-teal-700" },
  { id: "ec8", name: "Maintenance", icon: "🧹", color: "bg-orange-100 text-orange-700" },
  { id: "ec9", name: "Professional Services", icon: "💊", color: "bg-indigo-100 text-indigo-700" },
  { id: "ec10", name: "Inventory Purchase", icon: "📦", color: "bg-cyan-100 text-cyan-700" },
  { id: "ec11", name: "Staff Benefits", icon: "🎁", color: "bg-green-100 text-green-700" },
  { id: "ec12", name: "Miscellaneous", icon: "💰", color: "bg-slate-100 text-slate-700" },
];

export const SAMPLE_EXPENSES = [
  { id: "e1", categoryId: "ec1", categoryName: "Rent & Lease", description: "Monthly rent - Mumbai Main", amount: 65000, date: daysBack(5), paymentMethod: "BANK", vendorName: "Property Owner", isRecurring: true, recurringFreq: "MONTHLY" },
  { id: "e2", categoryId: "ec2", categoryName: "Salaries & Wages", description: "Staff salaries - April 2025", amount: 145000, date: daysBack(5), paymentMethod: "BANK", vendorName: null, isRecurring: true, recurringFreq: "MONTHLY" },
  { id: "e3", categoryId: "ec3", categoryName: "Products & Supplies", description: "L'Oreal hair color stock", amount: 18500, date: daysBack(3), paymentMethod: "CARD", vendorName: "L'Oreal Distributor", isRecurring: false, recurringFreq: null },
  { id: "e4", categoryId: "ec4", categoryName: "Utilities", description: "Electricity bill - March", amount: 8200, date: daysBack(4), paymentMethod: "UPI", vendorName: "MSEDCL", isRecurring: false, recurringFreq: null },
  { id: "e5", categoryId: "ec5", categoryName: "Marketing & Ads", description: "Instagram ads - April", amount: 5000, date: daysBack(2), paymentMethod: "CARD", vendorName: "Meta Ads", isRecurring: false, recurringFreq: null },
  { id: "e6", categoryId: "ec3", categoryName: "Products & Supplies", description: "Wella shampoo & conditioner", amount: 12000, date: daysBack(6), paymentMethod: "CASH", vendorName: "Beauty Wholesale Mumbai", isRecurring: false, recurringFreq: null },
  { id: "e7", categoryId: "ec8", categoryName: "Maintenance", description: "AC servicing", amount: 3500, date: daysBack(7), paymentMethod: "CASH", vendorName: "Cool Tech Services", isRecurring: false, recurringFreq: null },
  { id: "e8", categoryId: "ec9", categoryName: "Professional Services", description: "CA fees - quarterly", amount: 8000, date: daysBack(10), paymentMethod: "BANK", vendorName: "Sharma & Associates", isRecurring: true, recurringFreq: "MONTHLY" },
  { id: "e9", categoryId: "ec6", categoryName: "Equipment & Tools", description: "New hair dryer x2", amount: 7200, date: daysBack(8), paymentMethod: "CARD", vendorName: "Salon Equipment Hub", isRecurring: false, recurringFreq: null },
  { id: "e10", categoryId: "ec4", categoryName: "Utilities", description: "Internet & WiFi", amount: 1800, date: daysBack(5), paymentMethod: "BANK", vendorName: "Reliance JioFiber", isRecurring: true, recurringFreq: "MONTHLY" },
  { id: "e11", categoryId: "ec11", categoryName: "Staff Benefits", description: "Staff birthday celebration", amount: 2500, date: daysBack(3), paymentMethod: "CASH", vendorName: null, isRecurring: false, recurringFreq: null },
  { id: "e12", categoryId: "ec12", categoryName: "Miscellaneous", description: "Stationery & office supplies", amount: 850, date: daysBack(1), paymentMethod: "CASH", vendorName: null, isRecurring: false, recurringFreq: null },
];

// Monthly revenue data for charts (last 12 months)
export const MONTHLY_REVENUE_DATA = [
  { month: "May 24", revenue: 285000, expenses: 198000, profit: 87000 },
  { month: "Jun 24", revenue: 312000, expenses: 215000, profit: 97000 },
  { month: "Jul 24", revenue: 298000, expenses: 210000, profit: 88000 },
  { month: "Aug 24", revenue: 345000, expenses: 225000, profit: 120000 },
  { month: "Sep 24", revenue: 378000, expenses: 242000, profit: 136000 },
  { month: "Oct 24", revenue: 392000, expenses: 250000, profit: 142000 },
  { month: "Nov 24", revenue: 415000, expenses: 262000, profit: 153000 },
  { month: "Dec 24", revenue: 498000, expenses: 285000, profit: 213000 },
  { month: "Jan 25", revenue: 356000, expenses: 245000, profit: 111000 },
  { month: "Feb 25", revenue: 372000, expenses: 252000, profit: 120000 },
  { month: "Mar 25", revenue: 353500, expenses: 228000, profit: 125500 },
  { month: "Apr 25", revenue: 423500, expenses: 287200, profit: 136300 },
];

export const TODAY_APPOINTMENTS = [
  { id: "a1", clientName: "Sneha Patel", serviceName: "Hair Spa + Color", staffName: "Anita Nair", time: "10:00 AM", duration: 120, status: "CONFIRMED", amount: 3300 },
  { id: "a2", clientName: "Karan Malhotra", serviceName: "Haircut + Beard", staffName: "Rahul Verma", time: "10:30 AM", duration: 50, status: "COMPLETED", amount: 500 },
  { id: "a3", clientName: "Priyanka Verma", serviceName: "Facial Premium", staffName: "Anita Nair", time: "12:00 PM", duration: 60, status: "IN_PROGRESS", amount: 1500 },
  { id: "a4", clientName: "Walk-in", serviceName: "Haircut (Men)", staffName: "Suresh Kumar", time: "01:00 PM", duration: 30, status: "CONFIRMED", amount: 350 },
  { id: "a5", clientName: "Anjali Mehta", serviceName: "Manicure + Pedicure", staffName: "Anita Nair", time: "02:30 PM", duration: 105, status: "PENDING", amount: 1400 },
  { id: "a6", clientName: "Rajesh Nair", serviceName: "Haircut + Beard", staffName: "Rahul Verma", time: "04:00 PM", duration: 50, status: "PENDING", amount: 500 },
  { id: "a7", clientName: "Nisha Reddy", serviceName: "Bridal Makeup Trial", staffName: "Anita Nair", time: "05:00 PM", duration: 90, status: "PENDING", amount: 3000 },
];
