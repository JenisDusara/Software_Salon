import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding SalonSoft Pro database...");

  // ─── 1. Tenant ───────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { ownerEmail: "admin@salonsoft.in" },
    update: {},
    create: {
      businessName: "SalonSoft Pro",
      ownerName: "Priya Sharma",
      ownerEmail: "admin@salonsoft.in",
      ownerPhone: "9876543210",
      city: "Mumbai",
      subscriptionPlan: "PRO",
      isActive: true,
    },
  });
  console.log("✅ Tenant created:", tenant.businessName);

  // ─── 2. Branches ─────────────────────────────────────────────────────────────
  const b1 = await prisma.branch.upsert({
    where: { id: "b1-seed" },
    update: {},
    create: { id: "b1-seed", tenantId: tenant.id, name: "Mumbai Main", city: "Mumbai", address: "123, Linking Road, Bandra West, Mumbai - 400050" },
  });
  const b2 = await prisma.branch.upsert({
    where: { id: "b2-seed" },
    update: {},
    create: { id: "b2-seed", tenantId: tenant.id, name: "Mumbai Andheri", city: "Mumbai", address: "45, Veera Desai Road, Andheri West, Mumbai - 400058" },
  });
  const b3 = await prisma.branch.upsert({
    where: { id: "b3-seed" },
    update: {},
    create: { id: "b3-seed", tenantId: tenant.id, name: "Pune Branch", city: "Pune", address: "78, FC Road, Shivajinagar, Pune - 411005" },
  });
  console.log("✅ Branches created: 3");

  // ─── 3. Staff (Users) ─────────────────────────────────────────────────────────
  const staffData = [
    { id: "s1-seed", name: "Priya Sharma", email: "priya@salonsoft.in", phone: "9876543210", role: "SALON_ADMIN", commissionRate: 15, branchId: b1.id },
    { id: "s2-seed", name: "Rahul Verma", email: "rahul@salonsoft.in", phone: "9876543211", role: "STAFF", commissionRate: 20, branchId: b1.id },
    { id: "s3-seed", name: "Anita Nair", email: "anita@salonsoft.in", phone: "9876543212", role: "STAFF", commissionRate: 20, branchId: b1.id },
    { id: "s4-seed", name: "Suresh Kumar", email: "suresh@salonsoft.in", phone: "9876543213", role: "STAFF", commissionRate: 18, branchId: b1.id },
    { id: "s5-seed", name: "Deepa Pillai", email: "deepa@salonsoft.in", phone: "9876543214", role: "MANAGER", commissionRate: 12, branchId: b2.id },
    { id: "s6-seed", name: "Amit Joshi", email: "amit@salonsoft.in", phone: "9876543215", role: "STAFF", commissionRate: 20, branchId: b2.id },
    { id: "s7-seed", name: "Kavita Singh", email: "kavita@salonsoft.in", phone: "9876543216", role: "RECEPTIONIST", commissionRate: 0, branchId: b3.id },
    { id: "s8-seed", name: "Rohan Mehta", email: "rohan@salonsoft.in", phone: "9876543217", role: "STAFF", commissionRate: 18, branchId: b3.id },
  ];

  for (const s of staffData) {
    await prisma.user.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        tenantId: tenant.id,
        branchId: s.branchId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        role: s.role,
        commissionRate: s.commissionRate,
        isActive: true,
      },
    });
  }
  console.log("✅ Staff created: 8");

  // ─── 4. Service Categories ────────────────────────────────────────────────────
  const catData = [
    { id: "sc1-seed", name: "Hair", order: 1 },
    { id: "sc2-seed", name: "Color", order: 2 },
    { id: "sc3-seed", name: "Beard", order: 3 },
    { id: "sc4-seed", name: "Skin & Facial", order: 4 },
    { id: "sc5-seed", name: "Nails", order: 5 },
    { id: "sc6-seed", name: "Bridal", order: 6 },
  ];
  for (const c of catData) {
    await prisma.serviceCategory.upsert({
      where: { id: c.id },
      update: {},
      create: { id: c.id, tenantId: tenant.id, name: c.name, order: c.order },
    });
  }
  console.log("✅ Service categories created: 6");

  // ─── 5. Services ──────────────────────────────────────────────────────────────
  const serviceData = [
    { id: "sv1-seed", name: "Haircut (Men)", categoryId: "sc1-seed", duration: 30, price: 350, gstRate: 18 },
    { id: "sv2-seed", name: "Haircut (Women)", categoryId: "sc1-seed", duration: 45, price: 500, gstRate: 18 },
    { id: "sv3-seed", name: "Hair Wash & Dry", categoryId: "sc1-seed", duration: 30, price: 250, gstRate: 18 },
    { id: "sv4-seed", name: "Hair Spa", categoryId: "sc1-seed", duration: 60, price: 800, gstRate: 18 },
    { id: "sv5-seed", name: "Global Hair Color", categoryId: "sc2-seed", duration: 120, price: 2500, gstRate: 18 },
    { id: "sv6-seed", name: "Highlights (Partial)", categoryId: "sc2-seed", duration: 90, price: 1800, gstRate: 18 },
    { id: "sv7-seed", name: "Beard Trim", categoryId: "sc3-seed", duration: 20, price: 150, gstRate: 18 },
    { id: "sv8-seed", name: "Clean Shave", categoryId: "sc3-seed", duration: 30, price: 200, gstRate: 18 },
    { id: "sv9-seed", name: "Facial (Basic)", categoryId: "sc4-seed", duration: 45, price: 700, gstRate: 18 },
    { id: "sv10-seed", name: "Facial (Premium)", categoryId: "sc4-seed", duration: 60, price: 1500, gstRate: 18 },
    { id: "sv11-seed", name: "Manicure", categoryId: "sc5-seed", duration: 45, price: 600, gstRate: 18 },
    { id: "sv12-seed", name: "Pedicure", categoryId: "sc5-seed", duration: 60, price: 800, gstRate: 18 },
    { id: "sv13-seed", name: "Bridal Makeup", categoryId: "sc6-seed", duration: 120, price: 8000, gstRate: 18 },
    { id: "sv14-seed", name: "Pre-Bridal Package", categoryId: "sc6-seed", duration: 180, price: 15000, gstRate: 18 },
  ];
  for (const s of serviceData) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {},
      create: { id: s.id, tenantId: tenant.id, categoryId: s.categoryId, name: s.name, duration: s.duration, price: s.price, gstRate: s.gstRate, isActive: true },
    });
  }
  console.log("✅ Services created: 14");

  // ─── 6. Products (Inventory) ──────────────────────────────────────────────────
  const productData = [
    { id: "p1-seed", name: "L'Oreal Excellence Creme - Dark Brown", brand: "L'Oreal", category: "Hair Color", costPrice: 320, sellingPrice: 580, stockLevel: 24, minStockThreshold: 5 },
    { id: "p2-seed", name: "Wella Color Touch - Ash Blonde", brand: "Wella", category: "Hair Color", costPrice: 450, sellingPrice: 780, stockLevel: 3, minStockThreshold: 5 },
    { id: "p3-seed", name: "Schwarzkopf OSIS+ Dust It", brand: "Schwarzkopf", category: "Styling", costPrice: 680, sellingPrice: 1200, stockLevel: 8, minStockThreshold: 3 },
    { id: "p4-seed", name: "Kerastase Nutritive Shampoo 250ml", brand: "Kerastase", category: "Shampoo", costPrice: 1200, sellingPrice: 1850, stockLevel: 12, minStockThreshold: 4 },
    { id: "p5-seed", name: "OPI Nail Polish - Red", brand: "OPI", category: "Nail", costPrice: 350, sellingPrice: 650, stockLevel: 2, minStockThreshold: 5 },
    { id: "p6-seed", name: "Biotique Bio Walnut Bark Hair Oil", brand: "Biotique", category: "Hair Oil", costPrice: 180, sellingPrice: 320, stockLevel: 18, minStockThreshold: 6 },
  ];
  for (const p of productData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, tenantId: tenant.id, name: p.name, brand: p.brand, category: p.category, costPrice: p.costPrice, sellingPrice: p.sellingPrice, stockLevel: p.stockLevel, minStockThreshold: p.minStockThreshold, gstRate: 18, isActive: true },
    });
  }
  console.log("✅ Products created: 6");

  // ─── 7. Clients ───────────────────────────────────────────────────────────────
  const daysBack = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const clientData = [
    { id: "c1-seed", name: "Sneha Patel", phone: "9876500001", email: "sneha@gmail.com", gender: "Female", loyaltyPoints: 450, totalSpent: 12500, visitCount: 18, lastVisit: daysBack(23) },
    { id: "c2-seed", name: "Arjun Kapoor", phone: "9876500002", email: null, gender: "Male", loyaltyPoints: 230, totalSpent: 8200, visitCount: 12, lastVisit: daysBack(18) },
    { id: "c3-seed", name: "Meera Iyer", phone: "9876500003", email: "meera.iyer@gmail.com", gender: "Female", loyaltyPoints: 780, totalSpent: 24000, visitCount: 28, lastVisit: daysBack(10) },
    { id: "c4-seed", name: "Vikram Desai", phone: "9876500004", email: null, gender: "Male", loyaltyPoints: 120, totalSpent: 5400, visitCount: 8, lastVisit: daysBack(56) },
    { id: "c5-seed", name: "Pooja Sharma", phone: "9876500005", email: "pooja.s@gmail.com", gender: "Female", loyaltyPoints: 560, totalSpent: 18900, visitCount: 22, lastVisit: daysBack(6) },
    { id: "c6-seed", name: "Rajesh Nair", phone: "9876500006", email: null, gender: "Male", loyaltyPoints: 90, totalSpent: 3200, visitCount: 5, lastVisit: daysBack(33) },
    { id: "c7-seed", name: "Anjali Mehta", phone: "9876500007", email: "anjali.mehta@outlook.com", gender: "Female", loyaltyPoints: 320, totalSpent: 11200, visitCount: 16, lastVisit: daysBack(16) },
    { id: "c8-seed", name: "Karan Malhotra", phone: "9876500008", email: null, gender: "Male", loyaltyPoints: 180, totalSpent: 6800, visitCount: 10, lastVisit: daysBack(4) },
    { id: "c9-seed", name: "Priyanka Verma", phone: "9876500009", email: "priyanka.v@gmail.com", gender: "Female", loyaltyPoints: 640, totalSpent: 22000, visitCount: 25, lastVisit: daysBack(2) },
    { id: "c10-seed", name: "Sanjay Gupta", phone: "9876500010", email: null, gender: "Male", loyaltyPoints: 150, totalSpent: 4900, visitCount: 7, lastVisit: daysBack(26) },
    { id: "c11-seed", name: "Nisha Reddy", phone: "9876500011", email: "nisha.reddy@gmail.com", gender: "Female", loyaltyPoints: 420, totalSpent: 15600, visitCount: 20, lastVisit: daysBack(3) },
    { id: "c12-seed", name: "Aakash Thakur", phone: "9876500012", email: null, gender: "Male", loyaltyPoints: 60, totalSpent: 2100, visitCount: 4, lastVisit: daysBack(38) },
  ];
  for (const c of clientData) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {},
      create: { id: c.id, tenantId: tenant.id, name: c.name, phone: c.phone, email: c.email, gender: c.gender, loyaltyPoints: c.loyaltyPoints, totalSpent: c.totalSpent, visitCount: c.visitCount, lastVisit: c.lastVisit },
    });
  }
  console.log("✅ Clients created: 12");

  // ─── 8. Invoices ──────────────────────────────────────────────────────────────
  const invoiceData = [
    { id: "inv1-seed", invoiceNumber: "INV-2025-0031", clientId: "c1-seed", staffId: "s2-seed", subtotal: 3300, taxAmount: 594, discount: 0, tips: 100, totalAmount: 3994, amountPaid: 3994, paymentMethod: "UPI", status: "PAID", date: daysBack(1) },
    { id: "inv2-seed", invoiceNumber: "INV-2025-0030", clientId: "c2-seed", staffId: "s2-seed", subtotal: 500, taxAmount: 90, discount: 0, tips: 50, totalAmount: 640, amountPaid: 640, paymentMethod: "CASH", status: "PAID", date: daysBack(1) },
    { id: "inv3-seed", invoiceNumber: "INV-2025-0029", clientId: "c3-seed", staffId: "s3-seed", subtotal: 8000, taxAmount: 1350, discount: 500, tips: 500, totalAmount: 9350, amountPaid: 5000, paymentMethod: "SPLIT", status: "PARTIAL", date: daysBack(2), dueDate: daysBack(-3) },
    { id: "inv4-seed", invoiceNumber: "INV-2025-0028", clientId: "c5-seed", staffId: "s3-seed", subtotal: 2100, taxAmount: 378, discount: 0, tips: 0, totalAmount: 2478, amountPaid: 2478, paymentMethod: "CARD", status: "PAID", date: daysBack(2) },
    { id: "inv5-seed", invoiceNumber: "INV-2025-0027", clientId: "c8-seed", staffId: "s2-seed", subtotal: 550, taxAmount: 99, discount: 0, tips: 0, totalAmount: 649, amountPaid: 0, paymentMethod: null, status: "PENDING", date: daysBack(3), dueDate: daysBack(-4) },
    { id: "inv6-seed", invoiceNumber: "INV-2025-0026", clientId: "c9-seed", staffId: "s3-seed", subtotal: 2050, taxAmount: 333, discount: 200, tips: 100, totalAmount: 2283, amountPaid: 2283, paymentMethod: "UPI", status: "PAID", date: daysBack(3) },
    { id: "inv7-seed", invoiceNumber: "INV-2025-0025", clientId: "c4-seed", staffId: "s4-seed", subtotal: 350, taxAmount: 63, discount: 0, tips: 0, totalAmount: 413, amountPaid: 0, paymentMethod: null, status: "OVERDUE", date: daysBack(10), dueDate: daysBack(3) },
    { id: "inv8-seed", invoiceNumber: "INV-2025-0024", clientId: "c7-seed", staffId: "s3-seed", subtotal: 1400, taxAmount: 252, discount: 0, tips: 100, totalAmount: 1752, amountPaid: 1752, paymentMethod: "CASH", status: "PAID", date: daysBack(4) },
    { id: "inv9-seed", invoiceNumber: "INV-2025-0023", clientId: "c11-seed", staffId: "s3-seed", subtotal: 15000, taxAmount: 2520, discount: 1000, tips: 1000, totalAmount: 17520, amountPaid: 10000, paymentMethod: "SPLIT", status: "PARTIAL", date: daysBack(5), dueDate: daysBack(-2) },
    { id: "inv10-seed", invoiceNumber: "INV-2025-0022", clientId: "c6-seed", staffId: "s4-seed", subtotal: 1050, taxAmount: 189, discount: 0, tips: 50, totalAmount: 1289, amountPaid: 1289, paymentMethod: "UPI", status: "PAID", date: daysBack(5) },
  ];
  for (const inv of invoiceData) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {},
      create: {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        tenantId: tenant.id,
        branchId: b1.id,
        clientId: inv.clientId,
        staffId: inv.staffId,
        subtotal: inv.subtotal,
        taxAmount: inv.taxAmount,
        discount: inv.discount,
        tips: inv.tips,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        paymentMethod: inv.paymentMethod,
        status: inv.status,
        date: inv.date,
        dueDate: inv.dueDate ?? null,
      },
    });
  }
  console.log("✅ Invoices created: 10");

  // ─── 9. Invoice Items ─────────────────────────────────────────────────────────
  await prisma.invoiceItem.createMany({
    skipDuplicates: true,
    data: [
      { id: "ii1a-seed", invoiceId: "inv1-seed", serviceId: "sv5-seed", description: "Global Hair Color", quantity: 1, rate: 2500, discount: 0, taxableAmt: 2500, cgst: 225, sgst: 225, total: 2950 },
      { id: "ii1b-seed", invoiceId: "inv1-seed", serviceId: "sv4-seed", description: "Hair Spa", quantity: 1, rate: 800, discount: 0, taxableAmt: 800, cgst: 72, sgst: 72, total: 944 },
      { id: "ii2a-seed", invoiceId: "inv2-seed", serviceId: "sv1-seed", description: "Haircut (Men)", quantity: 1, rate: 350, discount: 0, taxableAmt: 350, cgst: 31.5, sgst: 31.5, total: 413 },
      { id: "ii2b-seed", invoiceId: "inv2-seed", serviceId: "sv7-seed", description: "Beard Trim", quantity: 1, rate: 150, discount: 0, taxableAmt: 150, cgst: 13.5, sgst: 13.5, total: 177 },
      { id: "ii3a-seed", invoiceId: "inv3-seed", serviceId: "sv13-seed", description: "Bridal Makeup", quantity: 1, rate: 8000, discount: 500, taxableAmt: 7500, cgst: 675, sgst: 675, total: 8850 },
      { id: "ii4a-seed", invoiceId: "inv4-seed", serviceId: "sv10-seed", description: "Facial (Premium)", quantity: 1, rate: 1500, discount: 0, taxableAmt: 1500, cgst: 135, sgst: 135, total: 1770 },
      { id: "ii4b-seed", invoiceId: "inv4-seed", serviceId: "sv11-seed", description: "Manicure", quantity: 1, rate: 600, discount: 0, taxableAmt: 600, cgst: 54, sgst: 54, total: 708 },
      { id: "ii5a-seed", invoiceId: "inv5-seed", serviceId: "sv1-seed", description: "Haircut (Men)", quantity: 1, rate: 350, discount: 0, taxableAmt: 350, cgst: 31.5, sgst: 31.5, total: 413 },
      { id: "ii5b-seed", invoiceId: "inv5-seed", serviceId: "sv8-seed", description: "Clean Shave", quantity: 1, rate: 200, discount: 0, taxableAmt: 200, cgst: 18, sgst: 18, total: 236 },
      { id: "ii6a-seed", invoiceId: "inv6-seed", serviceId: "sv3-seed", description: "Hair Wash & Dry", quantity: 1, rate: 250, discount: 0, taxableAmt: 250, cgst: 22.5, sgst: 22.5, total: 295 },
      { id: "ii6b-seed", invoiceId: "inv6-seed", serviceId: "sv6-seed", description: "Highlights (Partial)", quantity: 1, rate: 1800, discount: 200, taxableAmt: 1600, cgst: 144, sgst: 144, total: 1888 },
      { id: "ii7a-seed", invoiceId: "inv7-seed", serviceId: "sv1-seed", description: "Haircut (Men)", quantity: 1, rate: 350, discount: 0, taxableAmt: 350, cgst: 31.5, sgst: 31.5, total: 413 },
      { id: "ii8a-seed", invoiceId: "inv8-seed", serviceId: "sv12-seed", description: "Pedicure", quantity: 1, rate: 800, discount: 0, taxableAmt: 800, cgst: 72, sgst: 72, total: 944 },
      { id: "ii8b-seed", invoiceId: "inv8-seed", serviceId: "sv11-seed", description: "Manicure", quantity: 1, rate: 600, discount: 0, taxableAmt: 600, cgst: 54, sgst: 54, total: 708 },
      { id: "ii9a-seed", invoiceId: "inv9-seed", serviceId: "sv14-seed", description: "Pre-Bridal Package", quantity: 1, rate: 15000, discount: 1000, taxableAmt: 14000, cgst: 1260, sgst: 1260, total: 16520 },
      { id: "ii10a-seed", invoiceId: "inv10-seed", serviceId: "sv1-seed", description: "Haircut (Men)", quantity: 1, rate: 350, discount: 0, taxableAmt: 350, cgst: 31.5, sgst: 31.5, total: 413 },
      { id: "ii10b-seed", invoiceId: "inv10-seed", serviceId: "sv9-seed", description: "Facial (Basic)", quantity: 1, rate: 700, discount: 0, taxableAmt: 700, cgst: 63, sgst: 63, total: 826 },
    ],
  });
  console.log("✅ Invoice items created");

  // ─── 10. Expenses ─────────────────────────────────────────────────────────────
  const expenseData = [
    { id: "e1-seed", categoryId: "ec1", categoryName: "Rent & Lease", description: "Monthly rent - Mumbai Main", amount: 65000, date: daysBack(5), paymentMethod: "BANK", vendorName: "Property Owner", isRecurring: true, recurringFreq: "MONTHLY" },
    { id: "e2-seed", categoryId: "ec2", categoryName: "Salaries & Wages", description: "Staff salaries - April 2025", amount: 145000, date: daysBack(5), paymentMethod: "BANK", vendorName: null, isRecurring: true, recurringFreq: "MONTHLY" },
    { id: "e3-seed", categoryId: "ec3", categoryName: "Products & Supplies", description: "L'Oreal hair color stock", amount: 18500, date: daysBack(3), paymentMethod: "CARD", vendorName: "L'Oreal Distributor", isRecurring: false, recurringFreq: null },
    { id: "e4-seed", categoryId: "ec4", categoryName: "Utilities", description: "Electricity bill - March", amount: 8200, date: daysBack(4), paymentMethod: "UPI", vendorName: "MSEDCL", isRecurring: false, recurringFreq: null },
    { id: "e5-seed", categoryId: "ec5", categoryName: "Marketing & Ads", description: "Instagram ads - April", amount: 5000, date: daysBack(2), paymentMethod: "CARD", vendorName: "Meta Ads", isRecurring: false, recurringFreq: null },
    { id: "e6-seed", categoryId: "ec3", categoryName: "Products & Supplies", description: "Wella shampoo & conditioner", amount: 12000, date: daysBack(6), paymentMethod: "CASH", vendorName: "Beauty Wholesale Mumbai", isRecurring: false, recurringFreq: null },
    { id: "e7-seed", categoryId: "ec8", categoryName: "Maintenance", description: "AC servicing", amount: 3500, date: daysBack(7), paymentMethod: "CASH", vendorName: "Cool Tech Services", isRecurring: false, recurringFreq: null },
    { id: "e8-seed", categoryId: "ec9", categoryName: "Professional Services", description: "CA fees - quarterly", amount: 8000, date: daysBack(10), paymentMethod: "BANK", vendorName: "Sharma & Associates", isRecurring: true, recurringFreq: "MONTHLY" },
    { id: "e9-seed", categoryId: "ec6", categoryName: "Equipment & Tools", description: "New hair dryer x2", amount: 7200, date: daysBack(8), paymentMethod: "CARD", vendorName: "Salon Equipment Hub", isRecurring: false, recurringFreq: null },
    { id: "e10-seed", categoryId: "ec4", categoryName: "Utilities", description: "Internet & WiFi", amount: 1800, date: daysBack(5), paymentMethod: "BANK", vendorName: "Reliance JioFiber", isRecurring: true, recurringFreq: "MONTHLY" },
    { id: "e11-seed", categoryId: "ec11", categoryName: "Staff Benefits", description: "Staff birthday celebration", amount: 2500, date: daysBack(3), paymentMethod: "CASH", vendorName: null, isRecurring: false, recurringFreq: null },
    { id: "e12-seed", categoryId: "ec12", categoryName: "Miscellaneous", description: "Stationery & office supplies", amount: 850, date: daysBack(1), paymentMethod: "CASH", vendorName: null, isRecurring: false, recurringFreq: null },
  ];
  for (const exp of expenseData) {
    await prisma.expense.upsert({
      where: { id: exp.id },
      update: {},
      create: {
        id: exp.id,
        tenantId: tenant.id,
        branchId: b1.id,
        categoryId: exp.categoryId,
        categoryName: exp.categoryName,
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        paymentMethod: exp.paymentMethod,
        vendorName: exp.vendorName ?? null,
        isRecurring: exp.isRecurring,
        recurringFreq: exp.recurringFreq ?? null,
        createdById: "s1-seed",
      },
    });
  }
  console.log("✅ Expenses created: 12");

  // ─── 11. Appointments ─────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const makeTime = (h: number, m = 0) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const appointmentData = [
    { id: "a1-seed", clientId: "c1-seed", staffId: "s3-seed", status: "CONFIRMED", startTime: makeTime(10, 0), endTime: makeTime(12, 0), totalPrice: 3300, serviceId: "sv5-seed" },
    { id: "a2-seed", clientId: "c8-seed", staffId: "s2-seed", status: "COMPLETED", startTime: makeTime(10, 30), endTime: makeTime(11, 20), totalPrice: 500, serviceId: "sv1-seed" },
    { id: "a3-seed", clientId: "c9-seed", staffId: "s3-seed", status: "IN_PROGRESS", startTime: makeTime(12, 0), endTime: makeTime(13, 0), totalPrice: 1500, serviceId: "sv10-seed" },
    { id: "a4-seed", clientId: null, staffId: "s4-seed", status: "CONFIRMED", startTime: makeTime(13, 0), endTime: makeTime(13, 30), totalPrice: 350, serviceId: "sv1-seed", walkInName: "Walk-in" },
    { id: "a5-seed", clientId: "c7-seed", staffId: "s3-seed", status: "PENDING", startTime: makeTime(14, 30), endTime: makeTime(16, 15), totalPrice: 1400, serviceId: "sv12-seed" },
    { id: "a6-seed", clientId: "c6-seed", staffId: "s2-seed", status: "PENDING", startTime: makeTime(16, 0), endTime: makeTime(16, 50), totalPrice: 500, serviceId: "sv7-seed" },
    { id: "a7-seed", clientId: "c11-seed", staffId: "s3-seed", status: "PENDING", startTime: makeTime(17, 0), endTime: makeTime(18, 30), totalPrice: 3000, serviceId: "sv13-seed" },
  ];
  for (const appt of appointmentData) {
    await prisma.appointment.upsert({
      where: { id: appt.id },
      update: {},
      create: {
        id: appt.id,
        tenantId: tenant.id,
        branchId: b1.id,
        clientId: appt.clientId,
        walkInName: appt.walkInName ?? null,
        staffId: appt.staffId,
        date: today,
        startTime: appt.startTime,
        endTime: appt.endTime,
        status: appt.status,
        totalPrice: appt.totalPrice,
        items: {
          create: [{ serviceId: appt.serviceId, price: appt.totalPrice }],
        },
      },
    });
  }
  console.log("✅ Appointments created: 7");

  console.log("\n🎉 Seed completed successfully!");
  console.log(`   Tenant ID: ${tenant.id}`);
  console.log(`   Use this in .env: DEFAULT_TENANT_ID=${tenant.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
