import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  Home, 
  PlusCircle, 
  ClipboardList, 
  Megaphone, 
  LayoutDashboard, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  X, 
  MapPin, 
  User as UserIcon, 
  Calendar,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { User, Role, Complaint, Announcement, Status, Priority } from './types';
import { DEPARTMENTS, DEPT_ICONS, STATUS_COLORS, PRIORITY_COLORS } from './constants';

// --- SEED DATA ---
const INITIAL_USERS: Record<string, User> = {
  'resident@demo.com': { id: 'R001', name: 'Ahmed Khan', email: 'resident@demo.com', role: 'resident', avatar: 'AK', color: '#2a9968' },
  'officer@demo.com': { id: 'O001', name: 'Capt. Raza', email: 'officer@demo.com', role: 'officer', avatar: 'CR', color: '#2a6bc8', dept: 'water', deptName: 'Water & Sewerage' },
  'admin@demo.com': { id: 'A001', name: 'Director Shah', email: 'admin@demo.com', role: 'admin', avatar: 'DS', color: '#c8502a' },
};

const INITIAL_COMPLAINTS: Complaint[] = [
  { id: 'CMP-001', title: 'Street light broken on Main Street', category: 'electricity', description: 'Three street lights have been non-functional for 2 weeks near the intersection of Main St and Park Ave. This is a safety hazard at night.', status: 'in-progress', priority: 'high', date: '2025-03-28', resident: 'Ahmed Khan', residentId: 'R001', area: 'Block 14, Gulberg', timeline: [{ time: '2025-03-28', text: 'Complaint submitted by resident' }, { time: '2025-03-29', text: 'Assigned to Electricity Dept.' }, { time: '2025-03-30', text: 'Technician visit scheduled' }] },
  { id: 'CMP-002', title: 'Sewage overflow on Cavalry Ground road', category: 'water', description: 'Sewage water has been overflowing onto the road for 3 days. The smell is unbearable and it is a health hazard for the whole neighborhood.', status: 'pending', priority: 'high', date: '2025-03-29', resident: 'Sara Malik', residentId: 'R002', area: 'Cavalry Ground', timeline: [{ time: '2025-03-29', text: 'Complaint submitted by resident' }] },
  { id: 'CMP-003', title: 'Large pothole causing accidents', category: 'roads', description: 'A massive pothole has developed on the main road near the school. Two motorcycles have already had accidents because of it.', status: 'pending', priority: 'medium', date: '2025-03-30', resident: 'Ahmed Khan', residentId: 'R001', area: 'Model Town Link Road', timeline: [{ time: '2025-03-30', text: 'Complaint submitted by resident' }] },
  { id: 'CMP-004', title: 'Garbage not collected for 5 days', category: 'sanitation', description: 'The garbage collection truck has not come to our street for 5 consecutive days. Waste is piling up and stray dogs are creating a mess.', status: 'resolved', priority: 'medium', date: '2025-03-22', resident: 'Fatima Rizvi', residentId: 'R003', area: 'DHA Phase 5', timeline: [{ time: '2025-03-22', text: 'Complaint submitted' }, { time: '2025-03-23', text: 'Assigned to Sanitation Dept.' }, { time: '2025-03-25', text: 'Collection resumed' }, { time: '2025-03-25', text: 'Marked as Resolved' }] },
  { id: 'CMP-005', title: 'Park swings broken, children at risk', category: 'parks', description: 'The swings in Al-Hamra Park are severely damaged. Two children got hurt last week. Urgent repair is needed.', status: 'in-progress', priority: 'medium', date: '2025-03-27', resident: 'Umar Siddiqui', residentId: 'R004', area: 'Al-Hamra Park', timeline: [{ time: '2025-03-27', text: 'Complaint submitted' }, { time: '2025-03-28', text: 'Parks team dispatched for inspection' }] },
  { id: 'CMP-006', title: 'Power outage every evening for a week', category: 'electricity', description: 'We are facing load shedding every single evening from 6pm to 10pm despite being on an exempted feeder. This is causing huge losses for businesses.', status: 'resolved', priority: 'high', date: '2025-03-20', resident: 'Sara Malik', residentId: 'R002', area: 'Johar Town', timeline: [{ time: '2025-03-20', text: 'Complaint submitted' }, { time: '2025-03-21', text: 'Investigation started' }, { time: '2025-03-23', text: 'Faulty transformer replaced' }, { time: '2025-03-24', text: 'Issue resolved' }] },
  { id: 'CMP-007', title: 'Noise pollution from illegal construction at night', category: 'safety', description: 'A construction site next to our apartment complex is running heavy machinery all night violating noise regulations.', status: 'pending', priority: 'low', date: '2025-03-31', resident: 'Fatima Rizvi', residentId: 'R003', area: 'Shadman Colony', timeline: [{ time: '2025-03-31', text: 'Complaint submitted' }] },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', tag: 'Notice', title: 'Scheduled Water Maintenance — April 3rd', text: 'Water supply will be interrupted in Zone A & B from 8AM–2PM for pipeline maintenance.', date: '2025-03-31' },
  { id: '2', tag: 'Update', title: 'New Road Repair Drive Launched', text: '50+ roads across the city to be repaired under the Urban Development Initiative.', date: '2025-03-30' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('resident@demo.com');
  const [loginPass, setLoginPass] = useState('pass');
  const [loginRole, setLoginRole] = useState<Role>('resident');
  const [loginDept, setLoginDept] = useState('water');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('water');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newArea, setNewArea] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annTag, setAnnTag] = useState('Notice');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = () => {
    const u = INITIAL_USERS[loginEmail];
    if (!u || loginPass !== 'pass') {
      showToast('Invalid credentials. Use demo info.');
      return;
    }
    if (u.role !== loginRole) {
      showToast('Role mismatch. Select the correct tab.');
      return;
    }
    
    let user = { ...u };
    if (u.role === 'officer') {
      user.dept = loginDept;
      user.deptName = DEPARTMENTS[loginDept];
    }
    
    setCurrentUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('resident@demo.com');
    setLoginRole('resident');
  };

  const submitComplaint = () => {
    if (!newTitle || !newArea || !newDesc) {
      showToast('Please fill in all required fields.');
      return;
    }
    const id = `CMP-${String(complaints.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const newComplaint: Complaint = {
      id,
      title: newTitle,
      category: newCategory,
      description: newDesc,
      status: 'pending',
      priority: newPriority,
      date: today,
      resident: currentUser?.name || 'Unknown',
      residentId: currentUser?.id || 'Unknown',
      area: newArea,
      timeline: [{ time: today, text: 'Complaint submitted by resident' }]
    };
    setComplaints([newComplaint, ...complaints]);
    showToast(`Complaint ${id} submitted successfully!`);
    setCurrentPage('my-complaints');
    // Reset form
    setNewTitle('');
    setNewArea('');
    setNewDesc('');
  };

  const updateStatus = (id: string, status: Status) => {
    const today = new Date().toISOString().split('T')[0];
    const msgs: Record<Status, string> = {
      pending: 'Moved back to pending',
      'in-progress': 'Status updated to In Progress',
      resolved: 'Issue marked as Resolved',
      rejected: 'Complaint rejected by admin'
    };
    
    setComplaints(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status,
          timeline: [...c.timeline, { time: today, text: msgs[status] }]
        };
      }
      return c;
    }));
    
    showToast(`Status updated to ${status}`);
    setSelectedComplaint(null);
  };

  const postAnnouncement = () => {
    if (!annTitle || !annBody) {
      showToast('Please fill in all fields.');
      return;
    }
    const newAnn: Announcement = {
      id: String(Date.now()),
      tag: annTag,
      title: annTitle,
      text: annBody,
      date: new Date().toISOString().split('T')[0]
    };
    setAnnouncements([newAnn, ...announcements]);
    showToast('Announcement posted!');
    setAnnTitle('');
    setAnnBody('');
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    showToast('Announcement removed.');
  };

  // --- RENDER HELPERS ---
  const getMyComplaints = () => complaints.filter(c => c.residentId === currentUser?.id);
  const getDeptComplaints = () => complaints.filter(c => c.category === currentUser?.dept);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Login Art */}
        <div className="flex-1 bg-ink p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-radial from-accent/25 to-transparent"></div>
          <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-radial from-accent2/20 to-transparent"></div>
          
          <div className="text-2xl font-serif text-white relative z-10">
            Civic<span className="text-accent">Connect</span>
          </div>
          
          <div className="relative z-10 max-w-lg">
            <h1 className="text-4xl md:text-6xl text-white mb-6 leading-tight">Your voice.<br />Your community.</h1>
            <p className="text-white/60 text-lg leading-relaxed">Submit complaints, track progress, and stay connected with the departments that serve you.</p>
          </div>
          
          <div className="flex gap-12 relative z-10 mt-12">
            <div>
              <div className="text-3xl font-serif text-white">1,247</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Issues Resolved</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-white">6</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Departments</div>
            </div>
            <div>
              <div className="text-3xl font-serif text-white">92%</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full md:w-[460px] bg-paper flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-sm">
            <h2 className="text-3xl font-serif mb-2">Sign in</h2>
            <p className="text-muted text-sm mb-8">Choose your role to continue</p>
            
            <div className="flex gap-1 bg-cream p-1 rounded-xl mb-8">
              {(['resident', 'officer', 'admin'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => {
                    setLoginRole(r);
                    setLoginEmail(`${r}@demo.com`);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${loginRole === r ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wide">Email Address</label>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border rounded-lg outline-none focus:border-accent transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold tracking-wide">Password</label>
                <input 
                  type="password" 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border rounded-lg outline-none focus:border-accent transition-colors"
                  placeholder="••••••••"
                />
              </div>
              
              {loginRole === 'officer' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold tracking-wide">Department</label>
                  <select 
                    value={loginDept}
                    onChange={(e) => setLoginDept(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-border rounded-lg outline-none focus:border-accent transition-colors"
                  >
                    {Object.entries(DEPARTMENTS).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={handleLogin}
                className="w-full py-3.5 bg-ink text-white rounded-lg font-semibold hover:bg-accent transition-all transform hover:-translate-y-0.5 mt-4 flex items-center justify-center gap-2"
              >
                Sign In <ArrowRight size={18} />
              </button>
            </div>

            <div className="mt-8 p-4 bg-cream rounded-xl">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">🔑 Demo credentials</p>
              <div className="text-xs font-mono text-ink leading-relaxed">
                resident@demo.com / pass<br />
                officer@demo.com / pass<br />
                admin@demo.com / pass
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Nav */}
      <nav className="h-16 bg-ink px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="text-xl font-serif text-white">
          Civic<span className="text-accent">Connect</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.avatar}
            </div>
            <div className="hidden sm:block">
              <div className="text-white text-sm font-medium leading-none mb-1">{currentUser.name}</div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                currentUser.role === 'resident' ? 'bg-green/20 text-green' :
                currentUser.role === 'officer' ? 'bg-accent2/20 text-accent2' :
                'bg-accent/20 text-accent'
              }`}>
                {currentUser.role === 'officer' ? currentUser.deptName : currentUser.role}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-white/60 hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-cream border-r border-border p-6 hidden md:block">
          <div className="space-y-8">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 px-3">Main</div>
              <div className="space-y-1">
                <SidebarItem 
                  icon={<Home size={18} />} 
                  label="Dashboard" 
                  active={currentPage === 'dashboard'} 
                  onClick={() => setCurrentPage('dashboard')} 
                />
                {currentUser.role === 'resident' && (
                  <>
                    <SidebarItem 
                      icon={<PlusCircle size={18} />} 
                      label="Submit Complaint" 
                      active={currentPage === 'submit'} 
                      onClick={() => setCurrentPage('submit')} 
                    />
                    <SidebarItem 
                      icon={<ClipboardList size={18} />} 
                      label="My Complaints" 
                      active={currentPage === 'my-complaints'} 
                      onClick={() => setCurrentPage('my-complaints')} 
                      count={getMyComplaints().length}
                    />
                  </>
                )}
                {currentUser.role === 'officer' && (
                  <>
                    <SidebarItem 
                      icon={<ClipboardList size={18} />} 
                      label="Assigned" 
                      active={currentPage === 'dept-complaints'} 
                      onClick={() => setCurrentPage('dept-complaints')} 
                      count={getDeptComplaints().filter(c => c.status !== 'resolved').length}
                    />
                    <SidebarItem 
                      icon={<CheckCircle2 size={18} />} 
                      label="Resolved" 
                      active={currentPage === 'resolved'} 
                      onClick={() => setCurrentPage('resolved')} 
                    />
                  </>
                )}
                {currentUser.role === 'admin' && (
                  <>
                    <SidebarItem 
                      icon={<ClipboardList size={18} />} 
                      label="All Complaints" 
                      active={currentPage === 'all-complaints'} 
                      onClick={() => setCurrentPage('all-complaints')} 
                      count={complaints.filter(c => c.status === 'pending').length}
                    />
                    <SidebarItem 
                      icon={<Building2 size={18} />} 
                      label="Departments" 
                      active={currentPage === 'departments'} 
                      onClick={() => setCurrentPage('departments')} 
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 px-3">Info</div>
              <div className="space-y-1">
                <SidebarItem 
                  icon={<Megaphone size={18} />} 
                  label="Announcements" 
                  active={currentPage === (currentUser.role === 'admin' ? 'announcements-admin' : 'announcements')} 
                  onClick={() => setCurrentPage(currentUser.role === 'admin' ? 'announcements-admin' : 'announcements')} 
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentPage === 'dashboard' && (
                <Dashboard 
                  user={currentUser} 
                  complaints={complaints} 
                  announcements={announcements} 
                  onNavigate={setCurrentPage}
                  onSelectComplaint={setSelectedComplaint}
                />
              )}
              {currentPage === 'submit' && (
                <SubmitForm 
                  newTitle={newTitle} setNewTitle={setNewTitle}
                  newCategory={newCategory} setNewCategory={setNewCategory}
                  newPriority={newPriority} setNewPriority={setNewPriority}
                  newArea={newArea} setNewArea={setNewArea}
                  newDesc={newDesc} setNewDesc={setNewDesc}
                  onSubmit={submitComplaint}
                  onCancel={() => setCurrentPage('dashboard')}
                />
              )}
              {currentPage === 'my-complaints' && (
                <ComplaintsList 
                  title="My Complaints" 
                  list={getMyComplaints()} 
                  onSelect={setSelectedComplaint}
                />
              )}
              {currentPage === 'dept-complaints' && (
                <ComplaintsList 
                  title="Assigned Complaints" 
                  list={getDeptComplaints().filter(c => c.status !== 'resolved')} 
                  onSelect={setSelectedComplaint}
                />
              )}
              {currentPage === 'resolved' && (
                <ComplaintsList 
                  title="Resolved Complaints" 
                  list={getDeptComplaints().filter(c => c.status === 'resolved')} 
                  onSelect={setSelectedComplaint}
                />
              )}
              {currentPage === 'all-complaints' && (
                <ComplaintsList 
                  title="All Complaints" 
                  list={complaints} 
                  onSelect={setSelectedComplaint}
                  showFilters
                />
              )}
              {currentPage === 'departments' && (
                <DepartmentsView complaints={complaints} />
              )}
              {currentPage === 'announcements' && (
                <AnnouncementsView 
                  announcements={announcements} 
                />
              )}
              {currentPage === 'announcements-admin' && (
                <AnnouncementsAdmin 
                  announcements={announcements}
                  annTitle={annTitle} setAnnTitle={setAnnTitle}
                  annBody={annBody} setAnnBody={setAnnBody}
                  annTag={annTag} setAnnTag={setAnnTag}
                  onPost={postAnnouncement}
                  onDelete={deleteAnnouncement}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <ComplaintModal 
            complaint={selectedComplaint} 
            onClose={() => setSelectedComplaint(null)} 
            onUpdateStatus={updateStatus}
            userRole={currentUser.role}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-ink text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center text-[10px]">✓</div>
            <span className="text-sm font-medium">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- COMPONENTS ---

function SidebarItem({ icon, label, active, onClick, count }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? 'bg-ink text-white shadow-lg' : 'text-muted hover:bg-border/50 hover:text-ink'
      }`}
    >
      <span className={active ? 'text-accent' : 'text-muted'}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-accent text-white' : 'bg-accent/10 text-accent'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function Dashboard({ user, complaints, announcements, onNavigate, onSelectComplaint }: any) {
  const r = user.role;
  
  if (r === 'resident') {
    const mine = complaints.filter((c: any) => c.residentId === user.id);
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif leading-tight">Good morning, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-muted mt-1">Here's the status of your community complaints.</p>
          </div>
          <button 
            onClick={() => onNavigate('submit')}
            className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 flex items-center gap-2"
          >
            <PlusCircle size={18} /> New Complaint
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Submitted" value={mine.length} color="red" sub="all time" />
          <StatCard label="Pending" value={mine.filter((c: any) => c.status === 'pending').length} color="gold" sub="awaiting review" />
          <StatCard label="In Progress" value={mine.filter((c: any) => c.status === 'in-progress').length} color="blue" sub="being handled" />
          <StatCard label="Resolved" value={mine.filter((c: any) => c.status === 'resolved').length} color="green" sub="issues closed" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-serif">Recent Complaints</h2>
            <div className="space-y-3">
              {mine.length === 0 ? (
                <div className="bg-white border border-border rounded-2xl p-12 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <h3 className="text-xl font-serif mb-2">No complaints yet</h3>
                  <p className="text-muted">Submit your first complaint to get started.</p>
                </div>
              ) : (
                mine.slice(0, 4).map((c: any) => (
                  <ComplaintCard key={c.id} complaint={c} onClick={() => onSelectComplaint(c)} />
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-serif">Latest Announcements</h2>
            <div className="space-y-4">
              {announcements.slice(0, 3).map((a: any) => (
                <div key={a.id} className="bg-ink p-6 rounded-2xl text-white relative overflow-hidden">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">{a.tag}</div>
                  <h3 className="text-lg font-serif mb-2">{a.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (r === 'officer') {
    const deptComplaints = complaints.filter((c: any) => c.category === user.dept);
    return (
      <div className="space-y-8">
        <div className="page-header">
          <h1 className="text-4xl font-serif">{DEPT_ICONS[user.dept]} {user.deptName}</h1>
          <p className="text-muted mt-1">Officer Panel — Welcome, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending" value={deptComplaints.filter((c: any) => c.status === 'pending').length} color="gold" sub="needs attention" />
          <StatCard label="In Progress" value={deptComplaints.filter((c: any) => c.status === 'in-progress').length} color="blue" sub="currently active" />
          <StatCard label="Resolved" value={deptComplaints.filter((c: any) => c.status === 'resolved').length} color="green" sub="closed issues" />
          <StatCard label="Total" value={deptComplaints.length} color="red" sub="all time" />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-serif">Priority Queue</h2>
          <div className="space-y-3">
            {deptComplaints.filter((c: any) => c.status !== 'resolved').length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-serif mb-2">All caught up!</h3>
                <p className="text-muted">No open complaints in your department.</p>
              </div>
            ) : (
              deptComplaints.filter((c: any) => c.status !== 'resolved').map((c: any) => (
                <ComplaintCard key={c.id} complaint={c} onClick={() => onSelectComplaint(c)} />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Admin Overview</h1>
        <p className="text-muted mt-1">System-wide complaint management and analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Complaints" value={complaints.length} color="red" />
        <StatCard label="Pending" value={complaints.filter((c: any) => c.status === 'pending').length} color="gold" />
        <StatCard label="In Progress" value={complaints.filter((c: any) => c.status === 'in-progress').length} color="blue" />
        <StatCard label="Resolved" value={complaints.filter((c: any) => c.status === 'resolved').length} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-border rounded-2xl p-8">
          <h3 className="text-lg font-semibold mb-6">Department Breakdown</h3>
          <div className="space-y-6">
            {Object.entries(DEPARTMENTS).map(([id, name]) => {
              const all = complaints.filter(c => c.category === id);
              const res = all.filter(c => c.status === 'resolved');
              const pct = all.length === 0 ? 0 : Math.round((res.length / all.length) * 100);
              return (
                <div key={id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">{DEPT_ICONS[id]} {name}</span>
                    <span className="text-muted">{res.length}/{all.length} resolved</span>
                  </div>
                  <div className="h-2 bg-cream rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className="h-full bg-green rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8">
          <h3 className="text-lg font-semibold mb-6">Status Summary</h3>
          <div className="space-y-4">
            {[
              { label: 'Pending', icon: '🔴', count: complaints.filter(c => c.status === 'pending').length, color: 'text-orange-600' },
              { label: 'In Progress', icon: '🔵', count: complaints.filter(c => c.status === 'in-progress').length, color: 'text-blue-600' },
              { label: 'Resolved', icon: '🟢', count: complaints.filter(c => c.status === 'resolved').length, color: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-4 bg-cream rounded-xl">
                <span className="text-sm font-medium">{s.icon} {s.label}</span>
                <span className="text-2xl font-serif">{s.count}</span>
              </div>
            ))}
            <button 
              onClick={() => onNavigate('all-complaints')}
              className="w-full mt-4 py-3 border-2 border-border rounded-xl text-sm font-bold hover:bg-ink hover:text-white transition-all flex items-center justify-center gap-2"
            >
              View All Complaints <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, sub }: any) {
  const borderColors: any = {
    red: 'border-t-accent',
    blue: 'border-t-accent2',
    gold: 'border-t-gold',
    green: 'border-t-green'
  };
  return (
    <div className={`bg-white border border-border ${borderColors[color]} border-t-4 rounded-2xl p-6 shadow-sm`}>
      <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">{label}</div>
      <div className="text-4xl font-serif text-ink">{value}</div>
      {sub && <div className="text-[10px] text-muted mt-1 uppercase tracking-tight">{sub}</div>}
    </div>
  );
}

function ComplaintCard({ complaint, onClick }: { complaint: Complaint, onClick: () => void, key?: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4 cursor-pointer hover:border-accent transition-all hover:shadow-lg"
    >
      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${PRIORITY_COLORS[complaint.priority]}`} />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-ink truncate mb-1">{complaint.title}</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-medium text-muted uppercase tracking-wide">
          <span className="flex items-center gap-1">{DEPT_ICONS[complaint.category]} {DEPARTMENTS[complaint.category]}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {complaint.area}</span>
          <span className="flex items-center gap-1"><UserIcon size={12} /> {complaint.resident}</span>
          <span className="flex items-center gap-1"><Calendar size={12} /> {complaint.date}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="font-mono text-[10px] bg-cream px-2 py-0.5 rounded text-muted">{complaint.id}</span>
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[complaint.status]}`}>
          {complaint.status.replace('-', ' ')}
        </span>
      </div>
    </motion.div>
  );
}

function SubmitForm({ 
  newTitle, setNewTitle, 
  newCategory, setNewCategory, 
  newPriority, setNewPriority, 
  newArea, setNewArea, 
  newDesc, setNewDesc, 
  onSubmit, onCancel 
}: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Submit a Complaint</h1>
        <p className="text-muted mt-1">Describe your issue and it will be routed to the appropriate department.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Complaint Title *</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="Brief description of the issue"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Department / Category *</label>
            <select 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            >
              {Object.entries(DEPARTMENTS).map(([id, name]) => (
                <option key={id} value={id}>{DEPT_ICONS[id]} {name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Priority</label>
            <select 
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Priority)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Location / Area *</label>
            <input 
              type="text" 
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="e.g. Block 5, Gulberg III"
            />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Description *</label>
            <textarea 
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors min-h-[150px] resize-none"
              placeholder="Please describe the issue in detail — the more information you provide, the faster we can resolve it."
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={onSubmit}
            className="px-8 py-3.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
          >
            Submit Complaint
          </button>
          <button 
            onClick={onCancel}
            className="px-8 py-3.5 border-2 border-border rounded-xl font-bold hover:bg-cream transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ComplaintsList({ title, list, onSelect, showFilters }: any) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dept, setDept] = useState('');

  const filtered = list.filter((c: any) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || c.status === status;
    const matchesDept = !dept || c.category === dept;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">{title}</h1>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-xl outline-none focus:border-accent transition-colors"
          />
        </div>
        <select 
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-3 bg-white border border-border rounded-xl outline-none focus:border-accent transition-colors text-sm font-medium"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        {showFilters && (
          <select 
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="px-4 py-3 bg-white border border-border rounded-xl outline-none focus:border-accent transition-colors text-sm font-medium"
          >
            <option value="">All Departments</option>
            {Object.entries(DEPARTMENTS).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-serif mb-2">No results found</h3>
            <p className="text-muted">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filtered.map((c: any) => (
            <ComplaintCard key={c.id} complaint={c} onClick={() => onSelect(c)} />
          ))
        )}
      </div>
    </div>
  );
}

function DepartmentsView({ complaints }: any) {
  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Departments</h1>
        <p className="text-muted mt-1">Complaint distribution across all departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(DEPARTMENTS).map(([id, name]) => {
          const all = complaints.filter((c: any) => c.category === id);
          const pend = all.filter((c: any) => c.status === 'pending').length;
          const inP = all.filter((c: any) => c.status === 'in-progress').length;
          const res = all.filter((c: any) => c.status === 'resolved').length;
          return (
            <div key={id} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center text-2xl">
                  {DEPT_ICONS[id]}
                </div>
                <div>
                  <h3 className="font-bold text-ink">{name}</h3>
                  <p className="text-xs text-muted font-medium uppercase tracking-wider">{all.length} total complaints</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-cream p-3 rounded-xl text-center">
                  <div className="text-xl font-serif">{pend}</div>
                  <div className="text-[9px] font-bold text-muted uppercase tracking-widest">Pending</div>
                </div>
                <div className="bg-cream p-3 rounded-xl text-center">
                  <div className="text-xl font-serif">{inP}</div>
                  <div className="text-[9px] font-bold text-muted uppercase tracking-widest">Active</div>
                </div>
                <div className="bg-green/10 p-3 rounded-xl text-center">
                  <div className="text-xl font-serif text-green">{res}</div>
                  <div className="text-[9px] font-bold text-green uppercase tracking-widest">Resolved</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnnouncementsView({ announcements }: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Announcements</h1>
        <p className="text-muted mt-1">Stay updated with official notices and community news.</p>
      </div>

      <div className="space-y-4">
        {announcements.map((a: any) => (
          <div key={a.id} className="bg-ink p-8 rounded-3xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:opacity-20 transition-opacity">📢</div>
            <div className="relative z-10">
              <div className="inline-block px-3 py-1 bg-accent/30 text-accent text-[10px] font-bold uppercase tracking-widest rounded-lg mb-4">
                {a.tag}
              </div>
              <h3 className="text-2xl font-serif mb-3">{a.title}</h3>
              <p className="text-white/60 leading-relaxed mb-6">{a.text}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <Calendar size={12} /> {a.date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsAdmin({ announcements, annTitle, setAnnTitle, annBody, setAnnBody, annTag, setAnnTag, onPost, onDelete }: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Manage Announcements</h1>
        <p className="text-muted mt-1">Post and manage public notices for residents.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <h3 className="font-bold">Post New Announcement</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Title</label>
            <input 
              type="text" 
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="Announcement title..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Message</label>
            <textarea 
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors min-h-[100px] resize-none"
              placeholder="Write the announcement..."
            />
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-semibold tracking-wide">Tag</label>
              <select 
                value={annTag}
                onChange={(e) => setAnnTag(e.target.value)}
                className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              >
                <option>Notice</option>
                <option>Update</option>
                <option>Alert</option>
                <option>Event</option>
              </select>
            </div>
            <button 
              onClick={onPost}
              className="px-8 py-3.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
            >
              Post Announcement
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.map((a: any) => (
          <div key={a.id} className="bg-ink p-6 rounded-2xl text-white flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="inline-block px-2 py-0.5 bg-accent/30 text-accent text-[9px] font-bold uppercase tracking-widest rounded mb-2">
                {a.tag}
              </div>
              <h3 className="text-lg font-serif mb-1">{a.title}</h3>
              <p className="text-white/50 text-sm line-clamp-2">{a.text}</p>
            </div>
            <button 
              onClick={() => onDelete(a.id)}
              className="p-2 text-white/30 hover:text-rose-500 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplaintModal({ complaint, onClose, onUpdateStatus, userRole }: any) {
  const canUpdate = userRole === 'officer' || userRole === 'admin';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-paper w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="font-mono text-[10px] bg-cream px-2 py-1 rounded text-muted">{complaint.id}</span>
              <h2 className="text-3xl font-serif mt-2">{complaint.title}</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-cream rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[complaint.status]}`}>
              {complaint.status.replace('-', ' ')}
            </span>
            <span className="bg-cream px-3 py-1 rounded-full text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              {DEPT_ICONS[complaint.category]} {DEPARTMENTS[complaint.category]}
            </span>
            <span className="bg-cream px-3 py-1 rounded-full text-[10px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
              {complaint.priority} priority
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Submitted By</div>
              <div className="text-sm font-medium flex items-center gap-2"><UserIcon size={14} className="text-muted" /> {complaint.resident}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Date</div>
              <div className="text-sm font-medium flex items-center gap-2"><Calendar size={14} className="text-muted" /> {complaint.date}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Area</div>
              <div className="text-sm font-medium flex items-center gap-2"><MapPin size={14} className="text-muted" /> {complaint.area}</div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Description</div>
            <div className="bg-cream p-6 rounded-2xl text-sm leading-relaxed text-ink">
              {complaint.description}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Timeline</div>
            <div className="space-y-4 pl-4 border-l-2 border-border">
              {complaint.timeline.map((t: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent border-2 border-paper" />
                  <div className="text-[10px] font-mono text-muted mb-0.5">{t.time}</div>
                  <div className="text-sm font-medium">{t.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {canUpdate && complaint.status !== 'resolved' && (
          <div className="p-8 bg-cream border-t border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              <StatusButton 
                active={complaint.status === 'pending'} 
                onClick={() => onUpdateStatus(complaint.id, 'pending')}
                label="Pending"
              />
              <StatusButton 
                active={complaint.status === 'in-progress'} 
                onClick={() => onUpdateStatus(complaint.id, 'in-progress')}
                label="In Progress"
              />
              <StatusButton 
                active={complaint.status === 'resolved'} 
                onClick={() => onUpdateStatus(complaint.id, 'resolved')}
                label="Mark Resolved"
                isSuccess
              />
              {userRole === 'admin' && (
                <StatusButton 
                  active={complaint.status === 'rejected'} 
                  onClick={() => onUpdateStatus(complaint.id, 'rejected')}
                  label="Reject"
                  isDanger
                />
              )}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatusButton({ active, onClick, label, isSuccess, isDanger }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border-2 ${
        active 
          ? 'bg-ink text-white border-ink' 
          : isSuccess 
            ? 'border-green/30 text-green hover:bg-green/10' 
            : isDanger
              ? 'border-accent/30 text-accent hover:bg-accent/10'
              : 'border-border bg-white hover:border-accent hover:text-accent'
      }`}
    >
      {label}
    </button>
  );
}
