import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import webpush from "web-push";

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
      contact TEXT,
      area TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      userId TEXT,
      sessionId TEXT,
      path TEXT,
      source TEXT,
      device TEXT,
      browser TEXT,
      os TEXT,
      location TEXT,
      duration INTEGER,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emergencies (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      userContact TEXT NOT NULL,
      area TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      timestamp TEXT NOT NULL,
      lat REAL,
      lng REAL
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
      resolvedAt TEXT,
      closureReason TEXT,
      resident TEXT NOT NULL,
      residentId TEXT NOT NULL,
      address TEXT NOT NULL,
      contact TEXT NOT NULL,
      area TEXT,
      billReferenceNumber TEXT,
      gpsAddress TEXT,
      lat REAL,
      lng REAL
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      userName TEXT NOT NULL,
      userContact TEXT,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaintId TEXT NOT NULL,
      time TEXT NOT NULL,
      text TEXT NOT NULL,
      authorId TEXT,
      authorName TEXT,
      readStatus INTEGER DEFAULT 0,
      FOREIGN KEY (complaintId) REFERENCES complaints(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS emergency_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      deptId TEXT
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      userId TEXT NOT NULL,
      endpoint TEXT PRIMARY KEY,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      data TEXT,
      readStatus INTEGER DEFAULT 0,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
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

    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_residentId ON complaints(residentId);
    CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
    CREATE INDEX IF NOT EXISTS idx_sub_categories_deptId ON sub_categories(deptId);
    CREATE INDEX IF NOT EXISTS idx_timeline_complaintId ON timeline(complaintId);
    CREATE INDEX IF NOT EXISTS idx_suggestions_userId ON suggestions(userId);
  `);

  // Migration for existing databases
  try { db.prepare("ALTER TABLE timeline ADD COLUMN authorId TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE timeline ADD COLUMN authorName TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE timeline ADD COLUMN readStatus INTEGER DEFAULT 0").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN address TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN contact TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN subcategory TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN gpsAddress TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN lat REAL").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN lng REAL").run(); } catch (e) {}

  try { db.prepare("ALTER TABLE complaints ADD COLUMN resolvedAt TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN closureReason TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN billReferenceNumber TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN area TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE complaints ADD COLUMN area TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE suggestions ADD COLUMN status TEXT DEFAULT 'pending'").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE suggestions ADD COLUMN userContact TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE users ADD COLUMN createdAt TEXT").run(); } catch (e) {}
  try { db.prepare("UPDATE users SET createdAt = ? WHERE createdAt IS NULL").run(new Date().toISOString()); } catch (e) {}
  try { db.prepare("UPDATE settings SET value = '0' WHERE key = 'departments_count' AND value = '6'").run(); } catch (e) {}
  console.log('Database schema verified');
} catch (error) {
  console.error('Failed to verify database schema:', error);
  process.exit(1);
}

// Seed initial emergency types if none exist
const emergencyTypesExist = db.prepare("SELECT count(*) as count FROM emergency_types").get() as { count: number };
if (emergencyTypesExist.count === 0) {
  const types = [
    { id: 'electricity', name: 'Electricity', icon: 'Zap', deptId: 'electricity' },
    { id: 'gas', name: 'Gas', icon: 'Flame', deptId: 'gas' },
    { id: 'water', name: 'Water', icon: 'Droplets', deptId: 'water' }
  ];
  const insertType = db.prepare("INSERT INTO emergency_types (id, name, icon, deptId) VALUES (?, ?, ?, ?)");
  types.forEach(t => insertType.run(t.id, t.name, t.icon, t.deptId));
  console.log('Seeded initial emergency types');
}

// Seed initial admin if none exists
const admins = [
  { id: 'A001', name: 'System Admin', email: 'admin@mozang.com', password: 'admin', role: 'admin', avatar: 'SA', color: '#c8502a' },
  { id: 'A002', name: 'Muhammad Faisal', email: 'mfaisalliaqat@gmail.com', password: 'admin', role: 'admin', avatar: 'MF', color: '#c8502a' }
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, name, email, password, role, avatar, color)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const updateAdmin = db.prepare(`
  UPDATE users SET role = 'admin', password = 'admin' WHERE email = ?
`);

for (const admin of admins) {
  insertUser.run(admin.id, admin.name, admin.email, admin.password, admin.role, admin.avatar, admin.color);
  updateAdmin.run(admin.email);
}
console.log('Seeded and verified admin users');

// Seed initial areas if none exist
const areasExist = db.prepare("SELECT count(*) as count FROM areas").get() as { count: number };
if (areasExist.count === 0) {
  const initialAreas = [
    'Shadab Colony', 'Chiragh Din Road', 'Park Lane', 'Punj Mehal Road',
    'Temple Road', 'Mozang Road', 'Regal Road', 'Main Bazar',
    'Mubarak Pura', 'Qila Mehra', 'Muhalla Madahar', 'Badar Din Road',
    'Nazooli Muhalla', 'Qureshi Muhalla', 'Chah Pichwara', 'Janazgah Road Bazar',
    'Lytton Road', 'Saadi Park', 'Hari Shah Road', 'Noor Shah Road',
    'Kanak Mandi', 'Kot Abdullah Shah'
  ];
  const insertArea = db.prepare("INSERT INTO areas (id, name) VALUES (?, ?)");
  initialAreas.forEach((name, index) => {
    insertArea.run(`area-${index + 1}`, name);
  });
  console.log('Seeded initial areas');
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
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('departments_count', '0');
  console.log('Seeded initial settings');
}

// --- PUSH NOTIFICATIONS ---
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || "BJOuphg0lDz4c_cNOMxsw4sRr-Mmh_d3hd-dSPMe6ByS9Z2iWp5YOR2Evr3J0oomHNwP7YVtxvy7f2dM3I2tNCU";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "HlKIumvVREWa8irL62tX60ViUwXYVHq56TDC53AJSAo";

webpush.setVapidDetails(
  "mailto:mfaisalliaqat@gmail.com",
  publicVapidKey,
  privateVapidKey
);

async function sendPushNotification(userId: string, payload: any) {
  try {
    // Store in notifications table
    const id = Math.random().toString(36).substring(2, 15);
    db.prepare("INSERT INTO notifications (id, userId, title, body, data, timestamp) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, userId, payload.title, payload.body, JSON.stringify(payload.data || {}), new Date().toISOString());

    const subscriptions = db.prepare("SELECT * FROM push_subscriptions WHERE userId = ?").all(userId);
    const promises = subscriptions.map((sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
        .catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription has expired or is no longer valid
            db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(sub.endpoint);
          }
          console.error('Error sending push notification:', err);
        });
    });
    await Promise.all(promises);
  } catch (error) {
    console.error('Failed to send push notifications:', error);
  }
}

async function notifyAdminsAndOfficers(payload: any, deptId?: string) {
  try {
    let query = "SELECT id FROM users WHERE role = 'admin'";
    const params: any[] = [];
    if (deptId) {
      query += " OR (role = 'officer' AND dept = ?)";
      params.push(deptId);
    } else {
      query += " OR role = 'officer'";
    }
    const users = db.prepare(query).all(...params) as { id: string }[];
    for (const user of users) {
      await sendPushNotification(user.id, payload);
    }
  } catch (error) {
    console.error('Failed to notify admins/officers:', error);
  }
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

  // Push Notifications
  app.post("/api/push/subscribe", (req, res) => {
    const { userId, subscription } = req.body;
    try {
      db.prepare(`
        INSERT OR REPLACE INTO push_subscriptions (userId, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?)
      `).run(userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error subscribing to push:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/push/unsubscribe", (req, res) => {
    const { endpoint } = req.body;
    try {
      db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").run(endpoint);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error unsubscribing from push:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Notifications API
  app.get("/api/notifications/:userId", (req, res) => {
    try {
      const notifications = db.prepare("SELECT * FROM notifications WHERE userId = ? ORDER BY timestamp DESC LIMIT 50").all(req.params.userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", (req, res) => {
    try {
      db.prepare("UPDATE notifications SET readStatus = 1 WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/notifications/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM notifications WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/emergency-types", (req, res) => {
    const { id, name, icon, deptId } = req.body;
    try {
      db.prepare("INSERT INTO emergency_types (id, name, icon, deptId) VALUES (?, ?, ?, ?)").run(id, name, icon, deptId);
      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating emergency type:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/emergency-types/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM emergency_types WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting emergency type:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Timeline Read Status
  app.patch("/api/timeline/read", (req, res) => {
    const { complaintId, userId } = req.body;
    try {
      // Mark all messages in this complaint NOT authored by the current user as read
      db.prepare("UPDATE timeline SET readStatus = 1 WHERE complaintId = ? AND authorId != ?").run(complaintId, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking timeline as read:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Suggestions
  app.get("/api/suggestions", (req, res) => {
    const list = db.prepare("SELECT * FROM suggestions ORDER BY date DESC").all();
    res.json(list);
  });

  app.post("/api/suggestions", (req, res) => {
    const { id, userId, userName, userContact, description, date, status } = req.body;
    
    // Storage optimization: Limit description length
    if (description && description.length > 1000) {
      return res.status(400).json({ error: "Description too long (max 1000 chars)" });
    }

    db.prepare("INSERT INTO suggestions (id, userId, userName, userContact, description, date, status) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(id, userId, userName, userContact, description, date, status || 'pending');
    res.json({ success: true });
  });

  app.patch("/api/suggestions/:id", (req, res) => {
    const { status } = req.body;
    try {
      db.prepare("UPDATE suggestions SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating suggestion:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/suggestions/:id", (req, res) => {
    db.prepare("DELETE FROM suggestions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

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
    const { id, name, email, password, role, dept, deptName, avatar, color, address, contact, area, createdAt } = req.body;
    
    // Validation for storage optimization
    if (name && name.length > 100) return res.status(400).json({ error: "Name too long" });
    if (email && email.length > 100) return res.status(400).json({ error: "Email too long" });
    if (address && address.length > 200) return res.status(400).json({ error: "Address too long" });

    try {
      db.prepare(`
        INSERT INTO users (id, name, email, password, role, dept, deptName, avatar, color, address, contact, area, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, email, password, role, dept, deptName, avatar, color, address, contact, area, createdAt || new Date().toISOString());
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
    const { name, email, password, role, dept, deptName, avatar, color, address, contact, area } = req.body;
    try {
      db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, password = ?, role = ?, dept = ?, deptName = ?, avatar = ?, color = ?, address = ?, contact = ?, area = ?
        WHERE id = ?
      `).run(name, email, password, role, dept, deptName, avatar, color, address, contact, area, req.params.id);
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
          authorName: t.authorName,
          readStatus: t.readStatus
        }))
      }));
      
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/complaints", (req, res) => {
    const { id, category, subcategory, description, status, priority, date, resident, residentId, address, contact, area, billReferenceNumber, gpsAddress, lat, lng, timeline } = req.body;
    
    // Storage optimization: Limit description length
    if (description && description.length > 2000) {
      return res.status(400).json({ error: "Description too long (max 2000 chars)" });
    }
    if (address && address.length > 300) return res.status(400).json({ error: "Address too long" });

    try {
      const insertComplaint = db.transaction(() => {
        db.prepare(`
          INSERT INTO complaints (id, category, subcategory, description, status, priority, date, resident, residentId, address, contact, area, billReferenceNumber, gpsAddress, lat, lng)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, category, subcategory, description, status, priority, date, resident, residentId, address, contact, area, billReferenceNumber, gpsAddress, lat, lng);
        
        const insertTimeline = db.prepare("INSERT INTO timeline (complaintId, time, text, authorId, authorName) VALUES (?, ?, ?, ?, ?)");
        for (const t of timeline) {
          // Limit timeline text
          const safeText = t.text.substring(0, 500);
          insertTimeline.run(id, t.time, safeText, t.authorId || residentId, t.authorName || resident);
        }
      });
      insertComplaint();

      // Notify Admins and relevant Officers
      notifyAdminsAndOfficers({
        title: `📝 New Complaint: ${category}`,
        body: `${resident} submitted a new complaint in ${area || 'Mozang'}.`,
        data: { url: `/admin-complaints?id=${id}` }
      }, category); // Assuming category matches deptId for simplicity, or we map it

      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating complaint:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/complaints/:id", (req, res) => {
    const { status, priority, timelineEntry, closureReason } = req.body;
    try {
      const complaint = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id);
      if (!complaint) return res.status(404).json({ error: "Complaint not found" });

      const update = db.transaction(() => {
        if (status) {
          if (status === 'resolved' || status === 'closed-not-actionable') {
            db.prepare("UPDATE complaints SET status = ?, resolvedAt = ?, closureReason = ? WHERE id = ?")
              .run(status, new Date().toISOString().split('T')[0], closureReason || null, req.params.id);
          } else {
            db.prepare("UPDATE complaints SET status = ? WHERE id = ?").run(status, req.params.id);
          }
        }
        if (priority) {
          db.prepare("UPDATE complaints SET priority = ? WHERE id = ?").run(priority, req.params.id);
        }
        if (timelineEntry) {
          db.prepare("INSERT INTO timeline (complaintId, time, text, authorId, authorName) VALUES (?, ?, ?, ?, ?)")
            .run(req.params.id, timelineEntry.time, timelineEntry.text, timelineEntry.authorId, timelineEntry.authorName);
        }
      });
      update();

      // Notifications
      if (status && status !== complaint.status) {
        // Notify resident about status change
        sendPushNotification(complaint.residentId, {
          title: `📋 Complaint Update`,
          body: `Your complaint status has been updated to: ${status}.`,
          data: { url: `/my-complaints?id=${req.params.id}` }
        });
      }

      if (timelineEntry) {
        // If author is resident, notify admins/officers
        if (timelineEntry.authorId === complaint.residentId) {
          notifyAdminsAndOfficers({
            title: `💬 New Message: ${complaint.category}`,
            body: `${complaint.resident} sent a message regarding complaint #${complaint.id.substring(0, 8)}.`,
            data: { url: `/admin-complaints?id=${req.params.id}` }
          }, complaint.category);
        } else {
          // If author is NOT resident, notify resident
          sendPushNotification(complaint.residentId, {
            title: `💬 New Message: ${complaint.category}`,
            body: `An officer sent a message regarding your complaint.`,
            data: { url: `/my-complaints?id=${req.params.id}` }
          });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Analytics
  app.post("/api/analytics/track", (req, res) => {
    const { type, userId, sessionId, path, source, device, browser, os, location, duration, timestamp } = req.body;
    try {
      db.prepare(`
        INSERT INTO analytics_events (type, userId, sessionId, path, source, device, browser, os, location, duration, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(type, userId || null, sessionId || null, path || null, source || null, device || null, browser || null, os || null, location || null, duration || null, timestamp || new Date().toISOString());
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error tracking analytics:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/analytics/stats", (req, res) => {
    try {
      const stats: any = {};
      
      // Basic counts
      stats.total_events = db.prepare("SELECT count(*) as count FROM analytics_events").get().count;
      stats.unique_visitors = db.prepare("SELECT count(DISTINCT sessionId) as count FROM analytics_events").get().count;
      
      // Device breakdown
      stats.devices = db.prepare("SELECT device, count(*) as count FROM analytics_events WHERE device IS NOT NULL GROUP BY device").all();
      
      // Source breakdown
      stats.sources = db.prepare("SELECT source, count(*) as count FROM analytics_events WHERE source IS NOT NULL GROUP BY source").all();
      
      // Path breakdown
      stats.paths = db.prepare("SELECT path, count(*) as count FROM analytics_events WHERE path IS NOT NULL GROUP BY path").all();
      
      // Browser/OS
      stats.browsers = db.prepare("SELECT browser, count(*) as count FROM analytics_events WHERE browser IS NOT NULL GROUP BY browser").all();
      stats.os = db.prepare("SELECT os, count(*) as count FROM analytics_events WHERE os IS NOT NULL GROUP BY os").all();
      
      // User Funnel (Link Clicked -> Website Opened -> Registered -> Complaint -> Resolved)
      // Note: This is a simplified funnel based on event types
      stats.funnel = {
        link_clicked: db.prepare("SELECT count(*) as count FROM analytics_events WHERE type = 'link_click'").get().count,
        website_opened: db.prepare("SELECT count(*) as count FROM analytics_events WHERE type = 'page_view'").get().count,
        registered: db.prepare("SELECT count(*) as count FROM analytics_events WHERE type = 'registration'").get().count,
        complaint_submitted: db.prepare("SELECT count(*) as count FROM analytics_events WHERE type = 'complaint_submit'").get().count,
        complaint_resolved: db.prepare("SELECT count(*) as count FROM analytics_events WHERE type = 'complaint_resolve'").get().count,
      };

      // Peak usage time (hour-wise)
      stats.peak_times = db.prepare(`
        SELECT strftime('%H', timestamp) as hour, count(*) as count 
        FROM analytics_events 
        GROUP BY hour 
        ORDER BY hour ASC
      `).all();

      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching analytics stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Emergencies
  app.get("/api/emergencies", (req, res) => {
    try {
      const list = db.prepare("SELECT * FROM emergencies ORDER BY timestamp DESC").all();
      res.json(list);
    } catch (error: any) {
      console.error('Error fetching emergencies:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/emergencies", (req, res) => {
    const { id, userId, userName, userContact, area, type, description, timestamp, lat, lng } = req.body;
    try {
      db.prepare(`
        INSERT INTO emergencies (id, userId, userName, userContact, area, type, description, timestamp, lat, lng)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, userName, userContact, area, type, description || null, timestamp || new Date().toISOString(), lat || null, lng || null);
      
      // Notify Admins and relevant Officers
      const typeInfo = db.prepare("SELECT deptId FROM emergency_types WHERE name = ?").get(type) as { deptId: string };
      notifyAdminsAndOfficers({
        title: `🚨 Emergency: ${type}`,
        body: `${userName} reported an emergency in ${area}.`,
        data: { url: `/emergencies-admin?emergencyId=${id}` }
      }, typeInfo?.deptId);

      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating emergency:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/emergencies/:id", (req, res) => {
    const { status } = req.body;
    try {
      db.prepare("UPDATE emergencies SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating emergency:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/emergencies/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM emergencies WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting emergency:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Backup & Restore
  app.get("/api/backup", (req, res) => {
    try {
      const tables = ['users', 'departments', 'sub_categories', 'complaints', 'suggestions', 'timeline', 'announcements', 'settings', 'areas'];
      const backup: any = {};
      for (const table of tables) {
        backup[table] = db.prepare(`SELECT * FROM ${table}`).all();
      }
      res.json(backup);
    } catch (error: any) {
      console.error('Backup failed:', error);
      res.status(500).json({ error: 'Backup failed', message: error.message });
    }
  });

  app.post("/api/restore", (req, res) => {
    const backup = req.body;
    try {
      const restore = db.transaction(() => {
        // Clear tables
        const tables = ['users', 'departments', 'sub_categories', 'complaints', 'suggestions', 'timeline', 'announcements', 'settings', 'areas'];
        for (const table of tables) {
          db.prepare(`DELETE FROM ${table}`).run();
          if (backup[table]) {
            const data = backup[table];
            if (data.length > 0) {
              const keys = Object.keys(data[0]);
              const placeholders = keys.map(() => '?').join(',');
              const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`);
              for (const row of data) {
                stmt.run(keys.map(k => row[k]));
              }
            }
          }
        }
      });
      restore();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Restore failed:', error);
      res.status(500).json({ error: 'Restore failed', message: error.message });
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
    
    // Storage optimization
    if (title && title.length > 200) return res.status(400).json({ error: "Title too long" });
    if (text && text.length > 3000) return res.status(400).json({ error: "Text too long" });

    try {
      db.prepare("INSERT INTO announcements (id, tag, title, text, date) VALUES (?, ?, ?, ?, ?)").run(id, tag, title, text, date);
      
      // Notify all users via push
      const users = db.prepare("SELECT id FROM users").all() as { id: string }[];
      users.forEach(user => {
        sendPushNotification(user.id, {
          title: `📢 New Announcement: ${title}`,
          body: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          data: { url: `/announcements?announcementId=${id}` }
        });
      });

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

  // Areas
  app.get("/api/areas", (req, res) => {
    try {
      const areas = db.prepare("SELECT * FROM areas ORDER BY name ASC").all();
      res.json(areas);
    } catch (error: any) {
      console.error('Error fetching areas:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/areas", (req, res) => {
    const { id, name } = req.body;
    try {
      db.prepare("INSERT INTO areas (id, name) VALUES (?, ?)").run(id, name);
      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating area:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/areas/:id", (req, res) => {
    const { name } = req.body;
    try {
      db.prepare("UPDATE areas SET name = ? WHERE id = ?").run(name, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating area:', error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/areas/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM areas WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting area:', error);
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
