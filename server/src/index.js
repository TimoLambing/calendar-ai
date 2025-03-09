// server/src/index.js

const express = require("express");
const { prisma } = require("./prisma/prisma");
const { log } = require("./utils/log");
const { testDatabaseConnection } = require("./utils/test-db");
const { logMiddleware } = require("./middleware/log");
const { errorMiddleware } = require("./middleware/error");
const diaryRoutes = require("./routes/diary");
const walletRoutes = require("./routes/wallet");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Log environment variables
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.SOCKET_ORIGIN || "http://localhost:5000",
    methods: ["GET", "POST"],
  },
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logMiddleware);
app.use(errorMiddleware);

// Routes
app.use("/api", diaryRoutes);
app.use("/api", walletRoutes);

// WebSocket
io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  socket.on("joinWalletRoom", (walletAddress) => {
    console.log(`Client joined room for wallet: ${walletAddress}`);
    socket.join(walletAddress);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io accessible in controllers
app.set("socketio", io);

// Check DB connection in an async IIFE
(async () => {
  const isDbConnected = await testDatabaseConnection();
  if (!isDbConnected) {
    throw new Error("Could not establish database connection");
  }
})();

// Start the server
const PORT = process.env.PORT ? Number(process.env.PORT) : 6060;
httpServer.listen(PORT, () => {
  log(`Server running on port ${PORT}`);
});

// Clean up Prisma on process exit
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
