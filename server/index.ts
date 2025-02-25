import express, { type Request, Response, NextFunction } from "express";
import diaryRoutes from "./routes/diary";
import walletRoutes from "./routes/wallet";
import { setupVite, serveStatic, log } from "./vite";
import { prisma } from "./prisma";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Test database connection before starting server
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    log('Successfully connected to database');
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

// API Routes
app.use('/api', diaryRoutes);
app.use('/api', walletRoutes);

(async () => {
  try {
    // Test database connection first
    const isDbConnected = await testDatabaseConnection();
    if (!isDbConnected) {
      throw new Error('Could not establish database connection');
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Application error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup Vite in development
    if (app.get("env") === "development") {
      // Create HTTP server instance
      const server = app.listen({
        port: 5000,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`Server running on port 5000`);
      });

      // Setup Vite with server instance
      await setupVite(app, server);
    } else {
      serveStatic(app);
      app.listen({
        port: 5000,
        host: "0.0.0.0",
        reusePort: true,
      }, () => {
        log(`Server running on port 5000`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  } finally {
    // Ensure we disconnect from the database when the app is shutting down
    process.on('beforeExit', async () => {
      await prisma.$disconnect();
    });
  }
})();