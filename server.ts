import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { app } from "./server-core.js";

const PORT = 3000;

// Start Server with Vite Middleware (apenas para desenvolvimento local via `npm run dev`)
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BuscaPreço Supermercados Server running on http://localhost:${PORT}`);
  });
}

startServer();
