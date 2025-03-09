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

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5000", // Adjust to your frontend URL (Vite default)
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

// Confirm DB connection
const isDbConnected = await testDatabaseConnection();
if (!isDbConnected) {
  throw new Error("Could not establish database connection");
}

// NOTE: we changed to 6060 below to avoid Chrome's unsafe port block
httpServer.listen(6060, () => {
  log(`Server running on port 6060`);
});

process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
