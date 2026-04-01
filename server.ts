import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("mozang.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    dept TEXT,
    deptName TEXT,
    avatar TEXT,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    date TEXT NOT NULL,
    resident TEXT NOT NULL,
    residentId TEXT NOT NULL,
    area TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaintId TEXT NOT NULL,
    time TEXT NOT NULL,
    text TEXT NOT NULL,
    FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    date TEXT NOT NULL
  );
`);

// Seed initial admin if none exists
const adminExists = db.prepare("SELECT count(*) as count FROM users WHERE role = 'admin'").get() as { count: number };
if (adminExists.count === 0) {
  db.prepare(`
    INSERT INTO users (id, name, email, password, role, avatar, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('A001', 'System Admin', 'admin@mozang.com', 'admin', 'admin', 'SA', '#c8502a');
  console.log('Seeded initial admin user');
}

// Seed initial departments if none exist
const deptsExist = db.prepare("SELECT count(*) as count FROM departments").get() as { count: number };
if (deptsExist.count === 0) {
  const depts = [
    { id: 'water', name: 'Water & Sewerage', icon: '💧' },
    { id: 'sanitation', name: 'Sanitation', icon: '🗑️' },
    { id: 'roads', name: 'Roads & Infrastructure', icon: '🛣️' },
    { id: 'electricity', name: 'Electricity', icon: '⚡' },
    { id: 'parks', name: 'Parks & Recreation', icon: '🌳' },
    { id: 'safety', name: 'Public Safety', icon: '🛡️' },
  ];
  const insertDept = db.prepare("INSERT INTO departments (id, name, icon) VALUES (?, ?, ?)");
  for (const d of depts) {
    insertDept.run(d.id, d.name, d.icon);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Users
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { id, name, email, password, role, dept, deptName, avatar, color } = req.body;
    try {
      db.prepare(`
        INSERT INTO users (id, name, email, password, role, dept, deptName, avatar, color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, email, password, role, dept, deptName, avatar, color);
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Departments
  app.get("/api/departments", (req, res) => {
    const depts = db.prepare("SELECT * FROM departments").all();
    res.json(depts);
  });

  app.post("/api/departments", (req, res) => {
    const { id, name, icon } = req.body;
    try {
      db.prepare("INSERT INTO departments (id, name, icon) VALUES (?, ?, ?)").run(id, name, icon);
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/departments/:id", (req, res) => {
    db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Complaints
  app.get("/api/complaints", (req, res) => {
    const complaints = db.prepare("SELECT * FROM complaints").all() as any[];
    const timeline = db.prepare("SELECT * FROM timeline").all() as any[];
    
    const result = complaints.map(c => ({
      ...c,
      timeline: timeline.filter(t => t.complaintId === c.id).map(t => ({ time: t.time, text: t.text }))
    }));
    
    res.json(result);
  });

  app.post("/api/complaints", (req, res) => {
    const { id, title, category, description, status, priority, date, resident, residentId, area, timeline } = req.body;
    try {
      const insertComplaint = db.transaction(() => {
        db.prepare(`
          INSERT INTO complaints (id, title, category, description, status, priority, date, resident, residentId, area)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, title, category, description, status, priority, date, resident, residentId, area);
        
        const insertTimeline = db.prepare("INSERT INTO timeline (complaintId, time, text) VALUES (?, ?, ?)");
        for (const t of timeline) {
          insertTimeline.run(id, t.time, t.text);
        }
      });
      insertComplaint();
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/complaints/:id", (req, res) => {
    const { status, timelineEntry } = req.body;
    try {
      const update = db.transaction(() => {
        if (status) {
          db.prepare("UPDATE complaints SET status = ? WHERE id = ?").run(status, req.params.id);
        }
        if (timelineEntry) {
          db.prepare("INSERT INTO timeline (complaintId, time, text) VALUES (?, ?, ?)").run(req.params.id, timelineEntry.time, timelineEntry.text);
        }
      });
      update();
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Announcements
  app.get("/api/announcements", (req, res) => {
    const announcements = db.prepare("SELECT * FROM announcements").all();
    res.json(announcements);
  });

  app.post("/api/announcements", (req, res) => {
    const { id, tag, title, text, date } = req.body;
    try {
      db.prepare("INSERT INTO announcements (id, tag, title, text, date) VALUES (?, ?, ?, ?, ?)").run(id, tag, title, text, date);
      res.status(201).json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/announcements/:id", (req, res) => {
    db.prepare("DELETE FROM announcements WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
