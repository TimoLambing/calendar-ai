// server/src/utils/test-db.ts

import { prisma } from "../storage";
import { log } from "./log";

// Test database connection before starting server
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    log("Successfully connected to database");
    return true;
  } catch (error) {
    console.error("Failed to connect to database:", error);
    return false;
  }
}
