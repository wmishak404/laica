import { createPostgresActionLedger, startActionLedgerRetention } from "./cooking-actions/postgres-ledger";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createSecurityHeaders, getPublicErrorMessage } from "./security";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.set("trust proxy", 1);
app.use(createSecurityHeaders(app.get("env")));

const actionJsonParser = express.json({ limit: "16kb" });
const standardJsonParser = express.json({ limit: "1mb" });
app.use((req, res, next) => {
  if (req.path.startsWith("/api/cooking/actions")) return actionJsonParser(req, res, next);
  if (req.path === "/api/vision/analyze") {
    return next();
  }

  return standardJsonParser(req, res, next);
});
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  // Never put action IDs or secrets from a supplied path into stdout.
  const path = req.path.startsWith("/api/cooking/actions") ? "/api/cooking/actions" : req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  const stopActionRetention = startActionLedgerRetention(createPostgresActionLedger());
  server.on("close", stopActionRetention);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = getPublicErrorMessage(status, err.message);

    res.status(status).json({ message });
    if (status >= 500) {
      console.error(err);
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    ...(process.env.REPL_ID ? { reusePort: true } : {}),
  }, () => {
    log(`serving on port ${port}`);
  });
})();
