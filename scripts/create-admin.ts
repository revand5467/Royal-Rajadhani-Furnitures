/**
 * Creates or updates an admin account.
 *
 *   bun run admin:create                          # uses SEED_ADMIN_* from .env
 *   bun run admin:create me@shop.com "Password"   # explicit values
 *
 * Safe to run repeatedly: matching emails are updated, not duplicated.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = (process.argv[2] ?? process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.argv[3] ?? process.env.SEED_ADMIN_PASSWORD ?? "";
const name = process.argv[4] ?? process.env.SEED_ADMIN_NAME ?? "Studio manager";

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("✖ Provide a valid email. Set SEED_ADMIN_EMAIL in .env, or pass it as the first argument.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("✖ The password must be at least 8 characters. Pass it as the second argument, or set SEED_ADMIN_PASSWORD.");
  process.exit(1);
}

if (/(change-this|changeme|password|replace-me)/i.test(password)) {
  console.error("✖ That password looks like a placeholder. Choose something unique before creating the account.");
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.adminUser.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
    select: { id: true, email: true, name: true },
  });
  console.log(`✔ Admin account ready: ${user.email} (${user.name})`);
  console.log(`  Sign in at ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/admin/login`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`✖ Could not create the account: ${message}`);
  if (/no such table|does not exist|relation/i.test(message)) {
    console.error("  The database schema is missing — run `bun run db:migrate` first.");
  }
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
