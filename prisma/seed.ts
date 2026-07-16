// prisma/seed.ts
// =====================================================
// SEED SCRIPT — Populates DB with realistic fake data
// =====================================================
// Run with: npx tsx prisma/seed.ts
// This creates 1 test user, categories, and 30 days of transactions
// =====================================================

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient, CategoryType } from "../app/generated/prisma";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// ── Load .env synchronously before any module-level code runs ──
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env");
    const lines = readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  } catch {
    console.warn("Could not load .env, relying on existing env vars");
  }
}
loadEnv();

// ── HTTP adapter: no transactions, but works reliably in Node.js ──
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not found in environment!");
  console.log("Using DB URL starting with:", url.substring(0, 25) + "...");
  const adapter = new PrismaNeonHttp(url);
  return new PrismaClient({ adapter });
}

const prisma = createClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ── 1. Clean existing data ──────────────────────────
  // Delete in reverse order of dependencies (children before parents)
  await prisma.recurringPayment.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ Cleared existing data");

  // ── 2. Create test user ─────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: "test@financecopilot.dev",
      name: "Demo User",
    },
  });
  console.log("✓ Created user:", user.email);

  // ── 3. Create categories ────────────────────────────
  const categories = await Promise.all([
    // Income categories
    prisma.category.create({
      data: { name: "Salary", type: CategoryType.INCOME, userId: user.id },
    }),
    prisma.category.create({
      data: { name: "Freelance", type: CategoryType.INCOME, userId: user.id },
    }),

    // Expense categories
    prisma.category.create({
      data: { name: "Food & Dining", type: CategoryType.EXPENSE, userId: user.id },
    }),
    prisma.category.create({
      data: { name: "Transport", type: CategoryType.EXPENSE, userId: user.id },
    }),
    prisma.category.create({
      data: { name: "Entertainment", type: CategoryType.EXPENSE, userId: user.id },
    }),
    prisma.category.create({
      data: { name: "Shopping", type: CategoryType.EXPENSE, userId: user.id },
    }),
    prisma.category.create({
      data: { name: "Utilities", type: CategoryType.EXPENSE, userId: user.id },
    }),
    prisma.category.create({
      data: { name: "Healthcare", type: CategoryType.EXPENSE, userId: user.id },
    }),
  ]);
  console.log("✓ Created", categories.length, "categories");

  // Helper to find category by name
  const cat = (name: string) => categories.find((c) => c.name === name)!;

  // ── 4. Create transactions (last 30 days) ───────────
  const now = new Date();
  const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  const transactions = [
    // Income
    { amount: 75000, description: "Monthly salary - July", date: daysAgo(1), categoryId: cat("Salary").id },
    { amount: 15000, description: "Freelance web project - Client A", date: daysAgo(10), categoryId: cat("Freelance").id },

    // Food & Dining
    { amount: -450, description: "Zomato - Pizza order", date: daysAgo(1), categoryId: cat("Food & Dining").id },
    { amount: -180, description: "Chai and snacks - office", date: daysAgo(2), categoryId: cat("Food & Dining").id },
    { amount: -2200, description: "Dinner with friends - Barbeque Nation", date: daysAgo(3), categoryId: cat("Food & Dining").id },
    { amount: -320, description: "Swiggy - Biryani", date: daysAgo(5), categoryId: cat("Food & Dining").id },
    { amount: -150, description: "Coffee - Starbucks", date: daysAgo(7), categoryId: cat("Food & Dining").id },
    { amount: -900, description: "Grocery - BigBasket", date: daysAgo(8), categoryId: cat("Food & Dining").id },
    { amount: -600, description: "Lunch - restaurant near office", date: daysAgo(12), categoryId: cat("Food & Dining").id },
    { amount: -1200, description: "Weekly grocery shopping", date: daysAgo(15), categoryId: cat("Food & Dining").id },

    // Transport
    { amount: -250, description: "Uber - airport drop", date: daysAgo(2), categoryId: cat("Transport").id },
    { amount: -50, description: "Metro card recharge", date: daysAgo(4), categoryId: cat("Transport").id },
    { amount: -180, description: "Ola cab - office commute", date: daysAgo(6), categoryId: cat("Transport").id },
    { amount: -3500, description: "Petrol - monthly fill", date: daysAgo(14), categoryId: cat("Transport").id },

    // Entertainment
    { amount: -649, description: "Netflix subscription", date: daysAgo(3), categoryId: cat("Entertainment").id },
    { amount: -199, description: "Spotify Premium", date: daysAgo(5), categoryId: cat("Entertainment").id },
    { amount: -800, description: "Movie tickets - INOX", date: daysAgo(9), categoryId: cat("Entertainment").id },
    { amount: -1200, description: "IPL tickets", date: daysAgo(20), categoryId: cat("Entertainment").id },

    // Shopping
    { amount: -2999, description: "Nike shoes - Amazon", date: daysAgo(6), categoryId: cat("Shopping").id },
    { amount: -1500, description: "Books - Flipkart", date: daysAgo(11), categoryId: cat("Shopping").id },
    { amount: -450, description: "Stationery supplies", date: daysAgo(18), categoryId: cat("Shopping").id },

    // Utilities
    { amount: -1200, description: "Electricity bill - July", date: daysAgo(7), categoryId: cat("Utilities").id },
    { amount: -599, description: "Airtel broadband - monthly", date: daysAgo(8), categoryId: cat("Utilities").id },
    { amount: -499, description: "Mobile recharge - Jio", date: daysAgo(12), categoryId: cat("Utilities").id },

    // Healthcare
    { amount: -500, description: "Doctor consultation", date: daysAgo(13), categoryId: cat("Healthcare").id },
    { amount: -850, description: "Pharmacy - medicines", date: daysAgo(14), categoryId: cat("Healthcare").id },
  ];

  // HTTP adapter doesn't support transactions, so use individual creates
  await Promise.all(
    transactions.map((t) => prisma.transaction.create({ data: { ...t, userId: user.id } }))
  );
  console.log("✓ Created", transactions.length, "transactions");

  // ── 5. Create budgets for this month ───────────────
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1); // first day of month

  await Promise.all([
    prisma.budget.create({ data: { monthlyLimit: 8000, month: thisMonth, userId: user.id, categoryId: cat("Food & Dining").id } }),
    prisma.budget.create({ data: { monthlyLimit: 3000, month: thisMonth, userId: user.id, categoryId: cat("Transport").id } }),
    prisma.budget.create({ data: { monthlyLimit: 2000, month: thisMonth, userId: user.id, categoryId: cat("Entertainment").id } }),
    prisma.budget.create({ data: { monthlyLimit: 5000, month: thisMonth, userId: user.id, categoryId: cat("Shopping").id } }),
    prisma.budget.create({ data: { monthlyLimit: 2500, month: thisMonth, userId: user.id, categoryId: cat("Utilities").id } }),
  ]);
  console.log("✓ Created budgets for current month");

  // ── 6. Create goals ────────────────────────────────
  await Promise.all([
    prisma.goal.create({ data: { name: "Emergency Fund", targetAmount: 200000, currentAmount: 45000, deadline: new Date("2025-12-31"), userId: user.id } }),
    prisma.goal.create({ data: { name: "Europe Trip", targetAmount: 150000, currentAmount: 28000, deadline: new Date("2026-06-01"), userId: user.id } }),
    prisma.goal.create({ data: { name: "New Laptop", targetAmount: 80000, currentAmount: 15000, deadline: new Date("2025-10-01"), userId: user.id } }),
  ]);
  console.log("✓ Created 3 savings goals");

  // ── 7. Create recurring payments ──────────────────
  await Promise.all([
    prisma.recurringPayment.create({ data: { description: "Netflix", amount: 649, intervalDays: 30, lastSeen: daysAgo(3), nextExpected: new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000), userId: user.id } }),
    prisma.recurringPayment.create({ data: { description: "Airtel Broadband", amount: 599, intervalDays: 30, lastSeen: daysAgo(8), nextExpected: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000), userId: user.id } }),
    prisma.recurringPayment.create({ data: { description: "Spotify Premium", amount: 199, intervalDays: 30, lastSeen: daysAgo(5), nextExpected: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), userId: user.id } }),
  ]);
  console.log("✓ Created recurring payments");

  console.log("\n🎉 Seed complete! Summary:");
  console.log("   User ID:", user.id);
  console.log("   Use this ID in testing if needed");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
