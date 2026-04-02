import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any;
try {
  console.log('Initializing database...');
  db = new Database("mozang.db");
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Initialize database
try {
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
      color TEXT,
      address TEXT,
      contact TEXT
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sub_categories (
      id TEXT PRIMARY KEY,
      deptId TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (deptId) REFERENCES departments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      subcategory TEXT,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      date TEXT NOT NULL,
      resident TEXT NOT NULL,
      residentId TEXT NOT NULL,
      address TEXT NOT NULL,
      contact TEXT NOT NULL,
      gpsAddress TEXT,
      lat REAL,
      lng REAL
    );

    CREATE TABLE IF NOT EXISTS timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaintId TEXT NOT NULL,
      time TEXT NOT NULL,
      text TEXT NOT NULL,
      authorId TEXT,
      authorName TEXT,
      FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      tag TEXT NOT NULL,
      title TEXT NOT NULL,
      text TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migration for existing databases
  try { db.prepare("ALTER TABLE timeline ADD COLUMN authorId TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE timeline ADD COLUMN authorName TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN address TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN contact TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN subcategory TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN gpsAddress TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN lat REAL").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN lng REAL").run(); } catch (e) {}

  console.log('Database schema verified');
} catch (error) {
  console.error('Failed to verify database schema:', error);
  process.exit(1);
}

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
    { id: 'water', name: 'Water & Sewerage (WASA)', icon: '💧', subs: ['No water supply', 'Low water pressure', 'Sewerage overflow', 'Drain blockage', 'Dirty/contaminated water'] },
    { id: 'electricity', name: 'Electricity (LESCO / WAPDA)', icon: '⚡', subs: ['Load shedding (unscheduled outages)', 'Low/high voltage'] },
    { id: 'sanitation', name: 'Sanitation (LWMC)', icon: '🗑️', subs: ['Street cleanliness issues', 'Garbage not collected', 'Overflowing bins'] },
    { id: 'roads', name: 'Roads & Infrastructure (LDA / MCL)', icon: '🛣️', subs: ['Road patchwork', 'Street patchwork'] },
    { id: 'lights', name: 'Street Lights (MCL / Local Govt)', icon: '💡', subs: ['Street lights not working', 'Dim lighting (security risk)', 'Poles damaged', 'New light installation request'] },
    { id: 'gas', name: 'Gas (SNGPL)', icon: '🔥', subs: ['Low gas pressure', 'No gas supply'] },
    { id: 'police', name: 'Police / Security', icon: '🚓', subs: ['Street Crimes', 'Women Protection', 'Suspicious activity', 'Other'] },
  ];
  const insertDept = db.prepare("INSERT INTO departments (id, name, icon) VALUES (?, ?, ?)");
  const insertSub = db.prepare("INSERT INTO sub_categories (id, deptId, name) VALUES (?, ?, ?)");
  for (const d of depts) {
    insertDept.run(d.id, d.name, d.icon);
    for (const s of d.subs) {
      const sId = `${d.id}-${s.toLowerCase().replace(/\s+/g, '-')}`;
      insertSub.run(sId, d.id, s);
    }
  }
  console.log('Seeded initial departments and sub-categories');
}

// Seed initial settings if none exist
const settingsExist = db.prepare("SELECT count(*) as count FROM settings").get() as { count: number };
if (settingsExist.count === 0) {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('issues_resolved', '0');
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('departments_count', '6');
  console.log('Seeded initial settings');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Logging middleware for API requests
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
  });

  // --- API ROUTES ---

  // Users
  app.get("/api/users", (req, res) => {
    try {
      const users = db.prepare("SELECT * FROM users").all();
      res.json(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", (req, res) => {
    const { id, name, email, password, role, dept, deptName, avatar, color, address, contact } = req.body;
    try {
      db.prepare(`
        INSERT INTO users (id, name, email, password, role, dept, deptName, avatar, color, address, contact)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, email, password, role, dept, deptName, avatar, color, address, contact);
      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", (req, res) => {
    const { name, email, password, role, dept, deptName, avatar, color, address, contact } = req.body;
    try {
      db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, password = ?, role = ?, dept = ?, deptName = ?, avatar = ?, color = ?, address = ?, contact = ?
        WHERE id = ?
      `).run(name, email, password, role, dept, deptName, avatar, color, address, contact, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Departments
  app.get("/api/departments", (req, res) => {
    try {
      const depts = db.prepare("SELECT * FROM departments").all();
      res.json(depts);
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/departments", (req, res) => {
    const { id, name, icon } = req.body;
    try {
      db.prepare("INSERT INTO departments (id, name, icon) VALUES (?, ?, ?)").run(id, name, icon);
      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating department:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/departments/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM departments WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting department:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/departments/:id", (req, res) => {
    const { name, icon } = req.body;
    try {
      db.prepare("UPDATE departments SET name = ?, icon = ? WHERE id = ?").run(name, icon || '', req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating department:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Sub-categories
  app.get("/api/subcategories", (req, res) => {
    try {
      const subs = db.prepare("SELECT * FROM sub_categories").all();
      res.json(subs);
    } catch (error: any) {
      console.error('Error fetching sub-categories:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/subcategories", (req, res) => {
    const { id, deptId, name } = req.body;
    try {
      db.prepare("INSERT INTO sub_categories (id, deptId, name) VALUES (?, ?, ?)").run(id, deptId, name);
      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating sub-category:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/subcategories/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM sub_categories WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting sub-category:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Complaints
  app.get("/api/complaints", (req, res) => {
    try {
      const complaints = db.prepare("SELECT * FROM complaints").all() as any[];
      const timeline = db.prepare("SELECT * FROM timeline ORDER BY id ASC").all() as any[];
      
      const result = complaints.map(c => ({
        ...c,
        timeline: timeline.filter(t => t.complaintId === c.id).map(t => ({ 
          time: t.time, 
          text: t.text,
          authorId: t.authorId,
          authorName: t.authorName
        }))
      }));
      
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/complaints", (req, res) => {
    const { id, category, subcategory, description, status, priority, date, resident, residentId, address, contact, gpsAddress, lat, lng, timeline } = req.body;
    try {
      const insertComplaint = db.transaction(() => {
        db.prepare(`
          INSERT INTO complaints (id, category, subcategory, description, status, priority, date, resident, residentId, address, contact, gpsAddress, lat, lng)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, category, subcategory, description, status, priority, date, resident, residentId, address, contact, gpsAddress, lat, lng);
        
        const insertTimeline = db.prepare("INSERT INTO timeline (complaintId, time, text, authorId, authorName) VALUES (?, ?, ?, ?, ?)");
        for (const t of timeline) {
          insertTimeline.run(id, t.time, t.text, t.authorId || residentId, t.authorName || resident);
        }
      });
      insertComplaint();
      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating complaint:', error);
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
          db.prepare("INSERT INTO timeline (complaintId, time, text, authorId, authorName) VALUES (?, ?, ?, ?, ?)")
            .run(req.params.id, timelineEntry.time, timelineEntry.text, timelineEntry.authorId, timelineEntry.authorName);
        }
      });
      update();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Announcements
  app.get("/api/announcements", (req, res) => {
    try {
      const announcements = db.prepare("SELECT * FROM announcements").all();
      res.json(announcements);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/announcements", (req, res) => {
    const { id, tag, title, text, date } = req.body;
    try {
      db.prepare("INSERT INTO announcements (id, tag, title, text, date) VALUES (?, ?, ?, ?, ?)").run(id, tag, title, text, date);
      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/announcements/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM announcements WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Settings
  app.get("/api/settings", (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM settings").all();
      const result = settings.reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      // Add actual counts
      const userCount = db.prepare("SELECT count(*) as count FROM users").get().count;
      const deptCount = db.prepare("SELECT count(*) as count FROM departments").get().count;
      const resolvedCount = db.prepare("SELECT count(*) as count FROM complaints WHERE status = 'resolved'").get().count;

      result.actual_users = userCount;
      result.actual_departments = deptCount;
      result.actual_resolved = resolvedCount;

      res.json(result);
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, String(value));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating setting:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // API 404 handler
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log('Starting in development mode with Vite middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting in production mode');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global server error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
