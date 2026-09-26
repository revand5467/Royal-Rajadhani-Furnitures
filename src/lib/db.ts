import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * True when the schema has been pushed/migrated and the database answers.
 * Used to render a helpful setup notice instead of a stack trace on a fresh
 * checkout where `bun run setup` has not been run yet.
 */
export async function databaseReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("[db] database unreachable:", error instanceof Error ? error.message : error);
    return false;
  }
}
