import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const RECORDS_FILE = path.join(process.cwd(), "records.json");

async function startServer() {
  const app = express();
  
  // Parse JSON bodies
  app.use(express.json({ limit: "50mb" }));

  // API 1: Fetch records
  app.get("/api/records", async (req, res) => {
    try {
      try {
        await fs.access(RECORDS_FILE);
      } catch {
        // File doesn't exist, initialize with empty array
        await fs.writeFile(RECORDS_FILE, JSON.stringify([], null, 2), "utf-8");
      }
      const data = await fs.readFile(RECORDS_FILE, "utf-8");
      const records = JSON.parse(data);
      res.json(records);
    } catch (error) {
      console.error("Failed to read records:", error);
      res.status(500).json({ error: "Xatolik: Ma'lumotlarni o'qib bo'lmadi." });
    }
  });

  // API 2: Save records
  app.post("/api/records", async (req, res) => {
    try {
      const records = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ error: "Xato ma'lumot formati: massiv kutilmoqda." });
      }
      await fs.writeFile(RECORDS_FILE, JSON.stringify(records, null, 2), "utf-8");
      res.json({ success: true, count: records.length });
    } catch (error) {
      console.error("Failed to save records:", error);
      res.status(500).json({ error: "Xatolik: Ma'lumotlarni saqlab bo'lmadi." });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Let's support react-router if needed, though simple SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
