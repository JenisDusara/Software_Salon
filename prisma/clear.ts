import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🧹 Clearing all seed/demo data...");

  // Delete in correct FK order
  await prisma.appointmentItem.deleteMany({});
  console.log("✅ Appointment items cleared");

  await prisma.appointment.deleteMany({});
  console.log("✅ Appointments cleared");

  await prisma.invoiceItem.deleteMany({});
  console.log("✅ Invoice items cleared");

  await prisma.invoice.deleteMany({});
  console.log("✅ Invoices cleared");

  await prisma.expense.deleteMany({});
  console.log("✅ Expenses cleared");

  await prisma.client.deleteMany({});
  console.log("✅ Clients cleared");

  await prisma.product.deleteMany({});
  console.log("✅ Products (inventory) cleared");

  await prisma.service.deleteMany({});
  console.log("✅ Services cleared");

  await prisma.serviceCategory.deleteMany({});
  console.log("✅ Service categories cleared");

  await prisma.user.deleteMany({});
  console.log("✅ Staff cleared");

  console.log("\n🎉 All demo data cleared! Branches and tenant are kept.");
}

main()
  .catch((e) => {
    console.error("❌ Clear failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
