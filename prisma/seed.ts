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
