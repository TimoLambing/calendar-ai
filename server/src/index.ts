import express from "express";
import diaryRoutes from "./routes/diary";
import walletRoutes from "./routes/wallet";
import { prisma } from "./prisma/prisma";
import { log } from "./utils/log";
import { testDatabaseConnection } from "./utils/test-db";
import { logMiddleware } from "./middleware/log";
import { errorMiddleware } from "./middleware/error";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(logMiddleware);
app.use(errorMiddleware);

// API Routes
app.use("/api", diaryRoutes);
app.use("/api", walletRoutes);

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


