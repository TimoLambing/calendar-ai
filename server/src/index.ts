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
import { createServer } from "http";
import { Server } from "socket.io";

// -- Read from environment (example):
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_ORIGIN || "http://localhost:5000",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middlewares
app.use(logMiddleware);
app.use(errorMiddleware);

// API routes
app.use("/api", diaryRoutes);
app.use("/api", walletRoutes);

// WebSocket connection
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  socket.on("joinWalletRoom", (walletAddress: string) => {
    console.log(`Client joined room for wallet: ${walletAddress}`);
    socket.join(walletAddress); // Join a room for the wallet address
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io accessible in controllers
app.set("socketio", io);

(async () => {
  const isDbConnected = await testDatabaseConnection();
  if (!isDbConnected) {
    throw new Error("Could not establish database connection");
  }

  const PORT = process.env.PORT ? Number(process.env.PORT) : 6060;
  httpServer.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
  });
})();


process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
