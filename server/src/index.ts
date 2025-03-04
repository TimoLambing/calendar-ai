// server/src/index.ts

import express from "express";
import { prisma } from "./prisma/prisma";
import { log } from "./utils/log";
import { testDatabaseConnection } from "./utils/test-db";
import { logMiddleware } from "./middleware/log";
import { errorMiddleware } from "./middleware/error";

// Updated route imports if filenames changed
import diaryRoutes from "./routes/diary";
import walletRoutes from "./routes/wallet";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middlewares
app.use(logMiddleware);
app.use(errorMiddleware);

// API routes
app.use("/api", diaryRoutes);
app.use("/api", walletRoutes);

// Confirm DB connection
const isDbConnected = await testDatabaseConnection();
if (!isDbConnected) {
  throw new Error("Could not establish database connection");
}

app.listen(6000, () => {
  log(`Server running on port 6000`);
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
