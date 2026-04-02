import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
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
  ArrowRight,
  ShieldAlert,
  Phone,
  Facebook,
  Users2,
  Menu,
  ArrowLeft,
  Lightbulb,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { User, Role, Complaint, Announcement, Status, Priority, Department, Category, SubCategory } from './types';
import { STATUS_COLORS, PRIORITY_COLORS } from './constants';

// --- ERROR HANDLING ---
function handleApiError(error: unknown) {
  console.error('API Error: ', error);
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(message);
}

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean, errorInfo: string | null }> {
  state = { hasError: false, errorInfo: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white border border-border rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-2xl font-serif mb-4">Application Error</h2>
            <p className="text-muted mb-8 text-sm leading-relaxed">{this.state.errorInfo || "Something went wrong."}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-ink text-white rounded-xl font-bold hover:bg-accent transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mozang_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginRole, setLoginRole] = useState<Role>('resident');
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('mozang_page') || 'dashboard';
  });
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({
    issues_resolved: '0',
    departments_count: '6'
  });
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Form states
  const [newCategory, setNewCategory] = useState('water');
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSuggestion, setNewSuggestion] = useState('');

  // User Management
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [userRole, setUserRole] = useState<Role>('resident');
  const [userDept, setUserDept] = useState('');
  const [userContact, setUserContact] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userColor, setUserColor] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Dept Management
  const [deptName, setDeptName] = useState('');

  // Announcement Management
  const [annTag, setAnnTag] = useState<'Notice' | 'Update' | 'Alert' | 'Event'>('Notice');
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [lastAnnouncementId, setLastAnnouncementId] = useState<string | null>(() => localStorage.getItem('mozang_last_announcement'));

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (announcements.length > 0) {
      const latest = announcements[0];
      if (lastAnnouncementId && latest.id !== lastAnnouncementId) {
        if (Notification.permission === 'granted') {
          new Notification('New Announcement: ' + latest.title, {
            body: latest.text,
            icon: '/favicon.ico'
          });
        }
      }
      setLastAnnouncementId(latest.id);
      localStorage.setItem('mozang_last_announcement', latest.id);
    }
  }, [announcements]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('mozang_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mozang_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('mozang_page', currentPage);
  }, [currentPage]);

  // --- DATA FETCHING ---
  const fetchData = async () => {
    console.log('Fetching data from API...');
    try {
      const endpoints = [
        { name: 'users', url: '/api/users' },
        { name: 'departments', url: '/api/departments' },
        { name: 'subcategories', url: '/api/subcategories' },
        { name: 'complaints', url: '/api/complaints' },
        { name: 'announcements', url: '/api/announcements' },
        { name: 'suggestions', url: '/api/suggestions' },
        { name: 'settings', url: '/api/settings' }
      ];

      const results = await Promise.all(endpoints.map(async (e) => {
        const res = await fetch(e.url);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch ${e.name}: ${res.status} ${res.statusText}. Response: ${text.substring(0, 100)}`);
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Expected JSON from ${e.name} but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        return res.json();
      }));

      const [uList, dList, subList, cList, aList, sugList, sList] = results;

      console.log('Data fetched successfully:', {
        users: uList.length,
        depts: dList.length,
        subs: subList.length,
        complaints: cList.length,
        announcements: aList.length,
        suggestions: sugList.length,
        settings: Object.keys(sList).length
      });

      setUsers(uList);
      setDepartments(dList);
      setSubCategories(subList);
      setComplaints(cList);
      setAnnouncements(aList);
      setSuggestions(sugList);
      setSettings(sList);

      if (dList.length > 0 && !newCategory) setNewCategory(dList[0].id);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentPage === 'submit' && currentUser) {
      setNewAddress(currentUser.address || '');
      setNewContact(currentUser.contact || '');
    }
  }, [currentPage, currentUser]);

  useEffect(() => {
    console.log('Users state updated:', users.length, 'users loaded');
  }, [users]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = () => {
    console.log('Attempting login with:', { loginEmail, loginRole, usersCount: users.length });
    const u = users.find(u => u.email === loginEmail && u.password === loginPass);
    if (!u) {
      console.log('User not found in:', users.map(u => u.email));
      showToast('Invalid credentials.');
      return;
    }
    if (u.role !== loginRole) {
      console.log('Role mismatch:', { userRole: u.role, loginRole });
      showToast('Role mismatch.');
      return;
    }
    
    console.log('Login successful:', u.name);
    setCurrentUser(u);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPass('');
    localStorage.removeItem('mozang_user');
    localStorage.removeItem('mozang_page');
  };

  const addUser = async () => {
    if (!userName || !userEmail || !userPass) {
      showToast('Fill all fields');
      return;
    }
    const id = String(Date.now());
    const newUser: User = {
      id,
      name: userName,
      email: userEmail,
      password: userPass,
      role: userRole,
      dept: userRole === 'officer' ? userDept : undefined,
      deptName: userRole === 'officer' ? departments.find(d => d.id === userDept)?.name : undefined,
      avatar: userName.split(' ').map(n => n[0]).join('').toUpperCase(),
      color: userColor || '#' + Math.floor(Math.random()*16777215).toString(16),
      address: userAddress,
      contact: userContact
    };
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) throw new Error('Failed to create user');
      showToast('User created');
      setUserName(''); setUserEmail(''); setUserPass('');
      setUserAvatar(''); setUserColor('');
      setUserAddress(''); setUserContact('');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const updateUser = async () => {
    if (!editingUserId || !userName || !userEmail || !userPass) {
      showToast('Fill all fields');
      return;
    }
    const updatedUser: User = {
      id: editingUserId,
      name: userName,
      email: userEmail,
      password: userPass,
      role: userRole,
      dept: userRole === 'officer' ? userDept : undefined,
      deptName: userRole === 'officer' ? departments.find(d => d.id === userDept)?.name : undefined,
      avatar: userName.split(' ').map(n => n[0]).join('').toUpperCase(),
      color: userColor || '#' + Math.floor(Math.random()*16777215).toString(16),
      address: userAddress,
      contact: userContact
    };
    
    try {
      const res = await fetch(`/api/users/${editingUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
      if (!res.ok) throw new Error('Failed to update user');
      showToast('User updated');
      setUserName(''); setUserEmail(''); setUserPass('');
      setUserAvatar(''); setUserColor('');
      setUserAddress(''); setUserContact('');
      setEditingUserId(null);
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const deleteUser = async (id: string) => {
    if (id === 'A001') return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      showToast('User deleted');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const addDept = async () => {
    if (!deptName) return;
    const id = deptName.toLowerCase().replace(/\s+/g, '-');
    const newDept: Department = {
      id,
      name: deptName,
      icon: ''
    };
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDept)
      });
      if (!res.ok) throw new Error('Failed to add department');
      setDeptName('');
      showToast('Department added');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const updateDept = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/departments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Failed to update department');
      showToast('Department updated');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const addSubCategory = async (deptId: string, name: string) => {
    const id = `${deptId}-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    try {
      const res = await fetch('/api/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deptId, name })
      });
      if (!res.ok) throw new Error('Failed to add sub-category');
      showToast('Sub-category added');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const deleteSubCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/subcategories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete sub-category');
      showToast('Sub-category deleted');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const deleteDept = async (id: string) => {
    try {
      const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete department');
      showToast('Department deleted');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const submitComplaint = async () => {
    if (!newAddress || !newContact || !newDesc) {
      showToast('Please fill in all required fields.');
      return;
    }
    const nextId = complaints.length > 0 
      ? Math.max(...complaints.map(c => {
          const match = c.id.match(/CMP-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })) + 1 
      : 1;
    const id = `CMP-${nextId}`;
    const today = new Date().toISOString().split('T')[0];
    const newComplaint: Complaint = {
      id,
      category: newCategory,
      subcategory: newSubCategory,
      description: newDesc,
      status: 'pending',
      priority: 'medium',
      date: today,
      resident: currentUser?.name || 'Unknown',
      residentId: currentUser?.id || 'Unknown',
      address: newAddress,
      contact: newContact,
      timeline: [{ 
        time: today, 
        text: 'Complaint submitted by resident',
        authorId: currentUser?.id,
        authorName: currentUser?.name
      }]
    };
    
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComplaint)
      });
      if (!res.ok) throw new Error('Failed to submit complaint');
      showToast(`Complaint ${id} submitted successfully!`);
      setCurrentPage('my-complaints');
      // Reset form
      setNewAddress('');
      setNewContact('');
      setNewDesc('');
      setNewSubCategory('');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    const today = new Date().toISOString().split('T')[0];
    const msgs: Record<Status, string> = {
      pending: 'Moved back to pending',
      'in-progress': 'Status updated to In Progress',
      resolved: 'Issue marked as Resolved',
      rejected: 'Complaint rejected by admin'
    };
    
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;

    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          timelineEntry: { 
            time: today, 
            text: msgs[status],
            authorId: currentUser?.id,
            authorName: currentUser?.name
          }
        })
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(`Status updated to ${status}`);
      setSelectedComplaint(null);
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const addComment = async (id: string, text: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timelineEntry: { 
            time: today, 
            text,
            authorId: currentUser?.id,
            authorName: currentUser?.name
          }
        })
      });
      if (!res.ok) throw new Error('Failed to add comment');
      showToast('Comment added');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const submitSuggestion = async () => {
    if (!newSuggestion.trim()) {
      showToast('Please enter your suggestion.');
      return;
    }
    const id = `SUG-${String(Date.now()).slice(-6)}`;
    const today = new Date().toISOString().split('T')[0];
    const suggestion = {
      id,
      userId: currentUser?.id,
      userName: currentUser?.name,
      description: newSuggestion,
      date: today
    };

    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestion)
      });
      if (!res.ok) throw new Error('Failed to submit suggestion');
      showToast('Suggestion submitted successfully!');
      setNewSuggestion('');
      setCurrentPage('dashboard');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const deleteSuggestion = async (id: string) => {
    try {
      const res = await fetch(`/api/suggestions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete suggestion');
      showToast('Suggestion removed.');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const postAnnouncement = async () => {
    if (!annTitle || !annBody) {
      showToast('Please fill in all fields.');
      return;
    }
    const id = String(Date.now());
    const newAnn: Announcement = {
      id,
      tag: annTag,
      title: annTitle,
      text: annBody,
      date: new Date().toISOString().split('T')[0]
    };
    
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnn)
      });
      if (!res.ok) throw new Error('Failed to post announcement');
      showToast('Announcement posted!');
      setAnnTitle('');
      setAnnBody('');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete announcement');
      showToast('Announcement removed.');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) throw new Error('Failed to update setting');
      showToast('Setting updated successfully!');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  // --- RENDER HELPERS ---
  const getMyComplaints = () => complaints.filter(c => c.residentId === currentUser?.id);
  const getDeptComplaints = () => complaints.filter(c => c.category === currentUser?.dept);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-paper">
        {/* Login Art */}
        <div className="flex-1 bg-ink p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full bg-radial from-accent/20 to-transparent blur-3xl"></div>
          <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-radial from-accent2/15 to-transparent blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-radial from-white/5 to-transparent blur-3xl"></div>
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-2xl font-serif text-white relative z-10"
          >
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/30 text-white font-bold text-sm">
              MCP
            </div>
            <span>Mozang <span className="text-accent">Community Portal</span></span>
          </motion.div>
          
          <div className="relative z-10 max-w-lg">
            <motion.h1 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl text-white mb-6 font-serif leading-tight tracking-tight"
            >
              Your voice.<br />
              <span className="text-accent">Your community.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 text-xl leading-relaxed font-light"
            >
              Building a better Mozang together. Submit complaints, track progress, and stay connected with the departments that serve you.
            </motion.p>
          </div>
          
          <div className="space-y-12 relative z-10">
            <div className="flex gap-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-4xl font-serif text-white mb-1">{settings.issues_resolved || '0'}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Issues Resolved</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="text-4xl font-serif text-white mb-1">{settings.departments_count || '0'}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Departments</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="text-4xl font-serif text-white mb-1">{settings.users_count || '0'}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Users</div>
              </motion.div>
            </div>

            {/* Footer Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-1">
                <div className="text-white font-serif text-lg">Muhammad Faisal</div>
                <div className="text-accent text-xs font-bold uppercase tracking-widest">Founder</div>
                <div className="text-white/50 text-sm flex items-center gap-2">
                  <MapPin size={14} /> Mozang The Heart of Lahore
                </div>
              </div>
              <a 
                href="https://facebook.com/Mozangpk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
              >
                <Facebook size={18} className="text-white group-hover:text-accent transition-colors" />
                <span className="text-white/80 text-sm font-medium">Facebook.com/Mozangpk</span>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full md:w-[500px] bg-paper flex items-center justify-center p-8 md:p-16 relative">
          <div className="w-full max-w-sm relative z-10">
            <div className="mb-12">
              <h2 className="text-4xl font-serif mb-3 text-ink">Sign in</h2>
              <p className="text-muted text-lg">Access the community portal</p>
            </div>
            
            <div className="flex gap-1 bg-cream p-1.5 rounded-2xl mb-10 shadow-inner">
              {(['resident', 'officer', 'admin'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => {
                    setLoginRole(r);
                  }}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${loginRole === r ? 'bg-white text-ink shadow-lg' : 'text-muted hover:text-ink'}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">Email Address</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input 
                    type="email" 
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl outline-none focus:border-accent transition-all shadow-sm focus:shadow-lg focus:shadow-accent/5"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted px-1">Password</label>
                <div className="relative">
                  <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input 
                    type="password" 
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-2xl outline-none focus:border-accent transition-all shadow-sm focus:shadow-lg focus:shadow-accent/5"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <button 
                onClick={handleLogin}
                className="w-full py-4 bg-ink text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-accent transition-all transform hover:-translate-y-1 mt-6 flex items-center justify-center gap-3 shadow-xl shadow-ink/10 hover:shadow-accent/20"
              >
                Sign In <ArrowRight size={20} />
              </button>
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
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-3 text-xl font-serif text-white">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-[10px] shadow-lg shadow-accent/20">
              MCP
            </div>
            <span>Mozang <span className="text-accent">Community Portal</span></span>
          </div>
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

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className={`w-64 bg-cream border-r border-border p-6 fixed inset-y-0 left-0 z-[60] md:relative md:block transition-transform duration-300 transform ${showMobileMenu ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="space-y-8">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 px-3">Main</div>
              <div className="space-y-1">
                <SidebarItem 
                  icon={<Home size={18} />} 
                  label="Dashboard" 
                  active={currentPage === 'dashboard'} 
                  onClick={() => { setCurrentPage('dashboard'); setShowMobileMenu(false); }} 
                />
                <SidebarItem 
                  icon={<BarChart3 size={18} />} 
                  label="Insights" 
                  active={currentPage === 'insights'} 
                  onClick={() => { setCurrentPage('insights'); setShowMobileMenu(false); }} 
                />
                {currentUser.role === 'resident' && (
                  <>
                    <SidebarItem 
                      icon={<PlusCircle size={18} />} 
                      label="Submit Complaint" 
                      active={currentPage === 'submit'} 
                      onClick={() => { setCurrentPage('submit'); setShowMobileMenu(false); }} 
                    />
                    <SidebarItem 
                      icon={<Lightbulb size={18} />} 
                      label="Submit Suggestion" 
                      active={currentPage === 'submit-suggestion'} 
                      onClick={() => { setCurrentPage('submit-suggestion'); setShowMobileMenu(false); }} 
                    />
                    <SidebarItem 
                      icon={<ClipboardList size={18} />} 
                      label="My Complaints" 
                      active={currentPage === 'my-complaints'} 
                      onClick={() => { setCurrentPage('my-complaints'); setShowMobileMenu(false); }} 
                      count={getMyComplaints().length}
                    />
                  </>
                )}
                {currentUser.role === 'officer' && (
                  <>
                    <SidebarItem 
                      icon={<Lightbulb size={18} />} 
                      label="Submit Suggestion" 
                      active={currentPage === 'submit-suggestion'} 
                      onClick={() => { setCurrentPage('submit-suggestion'); setShowMobileMenu(false); }} 
                    />
                    <SidebarItem 
                      icon={<ClipboardList size={18} />} 
                      label="Assigned" 
                      active={currentPage === 'dept-complaints'} 
                      onClick={() => { setCurrentPage('dept-complaints'); setShowMobileMenu(false); }} 
                      count={getDeptComplaints().filter(c => c.status !== 'resolved').length}
                    />
                    <SidebarItem 
                      icon={<CheckCircle2 size={18} />} 
                      label="Resolved" 
                      active={currentPage === 'resolved'} 
                      onClick={() => { setCurrentPage('resolved'); setShowMobileMenu(false); }} 
                    />
                  </>
                )}
                {currentUser.role === 'admin' && (
                  <>
                    <SidebarItem 
                      icon={<Lightbulb size={18} />} 
                      label="Suggestions" 
                      active={currentPage === 'manage-suggestions'} 
                      onClick={() => { setCurrentPage('manage-suggestions'); setShowMobileMenu(false); }} 
                      count={suggestions.length}
                    />
                    <SidebarItem 
                      icon={<ClipboardList size={18} />} 
                      label="All Complaints" 
                      active={currentPage === 'all-complaints'} 
                      onClick={() => { setCurrentPage('all-complaints'); setShowMobileMenu(false); }} 
                      count={complaints.filter(c => c.status === 'pending').length}
                    />
                    <SidebarItem 
                      icon={<UserIcon size={18} />} 
                      label="Manage Users" 
                      active={currentPage === 'manage-users'} 
                      onClick={() => { setCurrentPage('manage-users'); setShowMobileMenu(false); }} 
                    />
                    <SidebarItem 
                      icon={<Building2 size={18} />} 
                      label="Manage Departments" 
                      active={currentPage === 'manage-departments'} 
                      onClick={() => { setCurrentPage('manage-departments'); setShowMobileMenu(false); }} 
                    />
                    <SidebarItem 
                      icon={<LayoutDashboard size={18} />} 
                      label="Departments Overview" 
                      active={currentPage === 'departments'} 
                      onClick={() => { setCurrentPage('departments'); setShowMobileMenu(false); }} 
                    />
                    <SidebarItem 
                      icon={<Filter size={18} />} 
                      label="Portal Settings" 
                      active={currentPage === 'portal-settings'} 
                      onClick={() => { setCurrentPage('portal-settings'); setShowMobileMenu(false); }} 
                    />
                  </>
                )}
              </div>
            </div>

            <div>
              {currentUser.role !== 'officer' && (
                <>
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4 px-3">Info</div>
                  <div className="space-y-1">
                    <SidebarItem 
                      icon={<Megaphone size={18} />} 
                      label="Announcements" 
                      active={currentPage === (currentUser.role === 'admin' ? 'announcements-admin' : 'announcements')} 
                      onClick={() => { setCurrentPage(currentUser.role === 'admin' ? 'announcements-admin' : 'announcements'); setShowMobileMenu(false); }} 
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/50 z-[55] md:hidden" 
              onClick={() => setShowMobileMenu(false)}
            />
          )}
        </AnimatePresence>

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
                  departments={departments}
                />
              )}
              {currentPage === 'submit' && (
                <SubmitForm 
                  newCategory={newCategory} setNewCategory={setNewCategory}
                  newSubCategory={newSubCategory} setNewSubCategory={setNewSubCategory}
                  newAddress={newAddress} setNewAddress={setNewAddress}
                  newContact={newContact} setNewContact={setNewContact}
                  newDesc={newDesc} setNewDesc={setNewDesc}
                  onSubmit={submitComplaint}
                  onCancel={() => setCurrentPage('dashboard')}
                  departments={departments}
                  subCategories={subCategories}
                />
              )}
              {currentPage === 'submit-suggestion' && (
                <SubmitSuggestionForm 
                  newSuggestion={newSuggestion} 
                  setNewSuggestion={setNewSuggestion}
                  onSubmit={submitSuggestion}
                  onCancel={() => setCurrentPage('dashboard')}
                />
              )}
              {currentPage === 'manage-suggestions' && (
                <SuggestionsList 
                  suggestions={suggestions}
                  onDelete={deleteSuggestion}
                />
              )}
              {currentPage === 'insights' && (
                <InsightsView 
                  user={currentUser}
                  complaints={complaints}
                  departments={departments}
                  users={users}
                />
              )}
              {currentPage === 'my-complaints' && (
                <ComplaintsList 
                  title="My Complaints" 
                  list={getMyComplaints()} 
                  onSelect={setSelectedComplaint}
                  departments={departments}
                  onBack={() => setCurrentPage('dashboard')}
                />
              )}
              {currentPage === 'dept-complaints' && (
                <ComplaintsList 
                  title="Assigned Complaints" 
                  list={getDeptComplaints().filter(c => c.status !== 'resolved')} 
                  onSelect={setSelectedComplaint}
                  departments={departments}
                  onBack={() => setCurrentPage('dashboard')}
                />
              )}
              {currentPage === 'resolved' && (
                <ComplaintsList 
                  title="Resolved Complaints" 
                  list={getDeptComplaints().filter(c => c.status === 'resolved')} 
                  onSelect={setSelectedComplaint}
                  departments={departments}
                  onBack={() => setCurrentPage('dashboard')}
                />
              )}
              {currentPage === 'all-complaints' && (
                <ComplaintsList 
                  title="All Complaints" 
                  list={complaints} 
                  onSelect={setSelectedComplaint}
                  showFilters
                  departments={departments}
                  onBack={() => setCurrentPage('dashboard')}
                />
              )}
              {currentPage === 'manage-users' && (
                <AdminUsersView 
                  users={users}
                  userName={userName} setUserName={setUserName}
                  userEmail={userEmail} setUserEmail={setUserEmail}
                  userPass={userPass} setUserPass={setUserPass}
                  userRole={userRole} setUserRole={setUserRole}
                  userDept={userDept} setUserDept={setUserDept}
                  userContact={userContact} setUserContact={setUserContact}
                  userAddress={userAddress} setUserAddress={setUserAddress}
                  userColor={userColor} setUserColor={setUserColor}
                  editingUserId={editingUserId} setEditingUserId={setEditingUserId}
                  departments={departments}
                  onAdd={addUser}
                  onUpdate={updateUser}
                  onDelete={deleteUser}
                />
              )}
              {currentPage === 'departments' && (
                <DepartmentsView 
                  complaints={complaints}
                  departments={departments}
                />
              )}
              {currentPage === 'portal-settings' && (
                <PortalSettingsView 
                  settings={settings}
                  onUpdate={updateSetting}
                />
              )}
              {currentPage === 'manage-departments' && (
                <AdminDeptsView 
                  departments={departments}
                  deptName={deptName} setDeptName={setDeptName}
                  onAdd={addDept}
                  onDelete={deleteDept}
                  onUpdate={updateDept}
                  subCategories={subCategories}
                  onAddSub={addSubCategory}
                  onDeleteSub={deleteSubCategory}
                  complaints={complaints}
                />
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
            onAddComment={addComment}
            user={currentUser}
            departments={departments}
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

function PortalSettingsView({ settings, onUpdate }: any) {
  const [issuesResolved, setIssuesResolved] = useState(settings.issues_resolved || '0');
  const [deptsCount, setDeptsCount] = useState(settings.departments_count || '0');
  const [usersCount, setUsersCount] = useState(settings.users_count || '0');

  useEffect(() => {
    setIssuesResolved(settings.issues_resolved || '0');
    setDeptsCount(settings.departments_count || '0');
    setUsersCount(settings.users_count || '0');
  }, [settings]);

  const handleSave = () => {
    onUpdate('issues_resolved', issuesResolved);
    onUpdate('departments_count', deptsCount);
    onUpdate('users_count', usersCount);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Portal Settings</h1>
        <p className="text-muted mt-1">Manage the statistics displayed on the login page.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Issues Resolved Count</label>
            <input 
              type="number" 
              value={issuesResolved}
              onChange={(e) => setIssuesResolved(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            />
            <p className="text-[10px] text-muted">Actual in DB: {settings.actual_resolved}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Departments Count</label>
            <input 
              type="number" 
              value={deptsCount}
              onChange={(e) => setDeptsCount(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            />
            <p className="text-[10px] text-muted">Actual in DB: {settings.actual_departments}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Users Count</label>
            <input 
              type="number" 
              value={usersCount}
              onChange={(e) => setUsersCount(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            />
            <p className="text-[10px] text-muted">Actual in DB: {settings.actual_users}</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="px-8 py-3.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}

function Dashboard({ user, complaints, announcements, onNavigate, onSelectComplaint, departments }: any) {
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
                  <ComplaintCard key={c.id} complaint={c} onClick={() => onSelectComplaint(c)} departments={departments} />
                ))
              )}
            </div>
          </div>

          {user.role === 'resident' && (
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
          )}
        </div>
      </div>
    );
  }

  if (r === 'officer') {
    const deptComplaints = complaints.filter((c: any) => c.category === user.dept);
    const deptIcon = '';
    return (
      <div className="space-y-8">
        <div className="page-header">
          <h1 className="text-4xl font-serif">{user.deptName}</h1>
          <p className="text-muted mt-1">Officer Panel — Welcome, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending" value={deptComplaints.filter((c: any) => c.status === 'pending').length} color="gold" sub="needs attention" />
          <StatCard label="In Progress" value={deptComplaints.filter((c: any) => c.status === 'in-progress').length} color="blue" sub="currently active" />
          <StatCard label="Resolved" value={deptComplaints.filter((c: any) => c.status === 'resolved').length} color="green" sub="closed issues" />
          <StatCard label="Total" value={deptComplaints.length} color="red" sub="all time" />
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif">Priority Queue</h2>
            <button 
              onClick={() => onNavigate('dept-complaints')}
              className="text-xs font-bold text-accent uppercase tracking-widest hover:underline"
            >
              View All Assigned
            </button>
          </div>
          <div className="space-y-3">
            {deptComplaints.filter((c: any) => c.status !== 'resolved').length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-serif mb-2">All caught up!</h3>
                <p className="text-muted">No open complaints in your department.</p>
              </div>
            ) : (
              deptComplaints.filter((c: any) => c.status !== 'resolved').map((c: any) => (
                <ComplaintCard key={c.id} complaint={c} onClick={() => onSelectComplaint(c)} departments={departments} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif">Recently Resolved</h2>
            <button 
              onClick={() => onNavigate('resolved')}
              className="text-xs font-bold text-accent uppercase tracking-widest hover:underline"
            >
              View All Resolved
            </button>
          </div>
          <div className="space-y-3">
            {deptComplaints.filter((c: any) => c.status === 'resolved').length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center">
                <div className="text-4xl mb-4">📜</div>
                <h3 className="text-xl font-serif mb-2">No resolved issues yet</h3>
                <p className="text-muted">Issues you resolve will appear here.</p>
              </div>
            ) : (
              deptComplaints.filter((c: any) => c.status === 'resolved').slice(0, 3).map((c: any) => (
                <ComplaintCard key={c.id} complaint={c} onClick={() => onSelectComplaint(c)} departments={departments} />
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
            {departments.map((d: any) => {
              const all = complaints.filter((c: any) => c.category === d.id);
              const res = all.filter((c: any) => c.status === 'resolved');
              const pct = all.length === 0 ? 0 : Math.round((res.length / all.length) * 100);
              return (
                <div key={d.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">{d.name}</span>
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

function ComplaintCard({ complaint, onClick, departments, viewMode = 'card' }: { complaint: Complaint, onClick: () => void, departments: Department[], viewMode?: 'list' | 'card' | 'screenshot', key?: string }) {
  const dept = departments.find(d => d.id === complaint.category);
  
  if (viewMode === 'list') {
    return (
      <div 
        onClick={onClick}
        className="bg-white border border-border p-4 rounded-xl flex items-center justify-between hover:border-accent transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="font-mono text-[10px] text-muted bg-cream px-2 py-0.5 rounded shrink-0">{complaint.id}</span>
          <h3 className="text-sm font-medium truncate">{complaint.description}</h3>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <span className="text-[10px] text-muted uppercase font-bold tracking-widest">{complaint.date}</span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${STATUS_COLORS[complaint.status]}`}>
            {complaint.status.replace('-', ' ')}
          </span>
          <ChevronRight size={14} className="text-muted group-hover:text-accent transition-colors" />
        </div>
      </div>
    );
  }

  const isScreenshot = viewMode === 'screenshot';

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${isScreenshot ? 'border-2 border-ink' : ''}`}
    >
      {isScreenshot && (
        <div className="absolute top-0 right-0 bg-ink text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">
          Official Record
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] text-muted bg-cream px-2 py-0.5 rounded w-fit">{complaint.id}</span>
          <h3 className="text-lg font-serif group-hover:text-accent transition-colors line-clamp-1">{complaint.description}</h3>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[complaint.status]}`}>
            {complaint.status.replace('-', ' ')}
          </span>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${PRIORITY_COLORS[complaint.priority]}`}>
            {complaint.priority} priority
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Calendar size={14} />
          <span>{complaint.date}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Building2 size={14} />
          <span>{dept?.name || complaint.category}</span>
        </div>
      </div>

      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <MapPin size={14} className="text-muted" />
          <span className="font-medium">{complaint.address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Phone size={14} className="text-muted" />
          <span className="font-medium">{complaint.contact}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <UserIcon size={14} className="text-muted" />
          <span className="font-medium">{complaint.resident}</span>
        </div>
        {isScreenshot && (
          <div className="bg-cream p-4 rounded-xl text-sm leading-relaxed italic text-ink mt-2">
            {complaint.description}
          </div>
        )}
      </div>

      {!isScreenshot && (
        <div className="mt-4 flex justify-end">
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View Details <ArrowRight size={12} />
          </span>
        </div>
      )}
    </motion.div>
  );
}

function SubmitForm({ 
  newCategory, setNewCategory, 
  newSubCategory, setNewSubCategory,
  newAddress, setNewAddress, 
  newContact, setNewContact,
  newDesc, setNewDesc, 
  onSubmit, onCancel,
  departments,
  subCategories
}: any) {
  const filteredSubs = subCategories.filter((s: any) => s.deptId === newCategory);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={onCancel}
          className="flex items-center gap-2 text-muted hover:text-ink transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="page-header">
        <h1 className="text-4xl font-serif">Submit a Complaint</h1>
        <p className="text-muted mt-1">Describe your issue and it will be routed to the appropriate department.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Department / Category *</label>
            <select 
              value={newCategory}
              onChange={(e) => {
                setNewCategory(e.target.value);
                setNewSubCategory('');
              }}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            >
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Sub-category (Problem Type)</label>
            <select 
              value={newSubCategory}
              onChange={(e) => setNewSubCategory(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            >
              <option value="">Select a specific issue...</option>
              {filteredSubs.map((s: any) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Complete Address *</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-3.5 text-muted" size={18} />
              <input 
                type="text" 
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
                placeholder="Enter your complete address"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Contact Number *</label>
            <input 
              type="text" 
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="Enter your contact number"
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

function ComplaintsList({ title, list, onSelect, showFilters, departments, onBack }: any) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [dept, setDept] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'screenshot'>('card');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');

  const filtered = list.filter((c: any) => {
    const matchesSearch = c.description.toLowerCase().includes(search.toLowerCase()) || 
                          c.address.toLowerCase().includes(search.toLowerCase()) ||
                          c.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || c.status === status;
    const matchesDept = !dept || c.category === dept;
    return matchesSearch && matchesStatus && matchesDept;
  }).sort((a: any, b: any) => {
    if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'priority') {
      const p: any = { high: 3, medium: 2, low: 1 };
      return p[b.priority] - p[a.priority];
    }
    return a.status.localeCompare(b.status);
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted hover:text-ink transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="page-header">
        <h1 className="text-4xl font-serif">{title}</h1>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, description or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-border rounded-xl outline-none focus:border-accent transition-colors"
          />
        </div>
        
        <div className="flex items-center bg-white border border-border rounded-xl p-1 gap-1">
          <button 
            onClick={() => setViewMode('card')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-ink text-white' : 'text-muted hover:bg-cream'}`}
            title="Card View"
          >
            <LayoutDashboard size={18} />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-ink text-white' : 'text-muted hover:bg-cream'}`}
            title="List View"
          >
            <ClipboardList size={18} />
          </button>
          <button 
            onClick={() => setViewMode('screenshot')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'screenshot' ? 'bg-ink text-white' : 'text-muted hover:bg-cream'}`}
            title="Screenshot View"
          >
            <MapPin size={18} />
          </button>
        </div>

        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-3 bg-white border border-border rounded-xl outline-none focus:border-accent transition-colors text-sm font-medium"
        >
          <option value="date">Sort by Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="status">Sort by Status</option>
        </select>

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
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className={viewMode === 'list' ? 'space-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white border border-border rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-serif mb-2">No results found</h3>
            <p className="text-muted">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filtered.map((c: any) => (
            <ComplaintCard 
              key={c.id} 
              complaint={c} 
              onClick={() => onSelect(c)} 
              departments={departments} 
              viewMode={viewMode}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DepartmentsView({ complaints, departments }: any) {
  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Departments</h1>
        <p className="text-muted mt-1">Complaint distribution across all departments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((d: any) => {
          const all = complaints.filter((c: any) => c.category === d.id);
          const pend = all.filter((c: any) => c.status === 'pending').length;
          const inP = all.filter((c: any) => c.status === 'in-progress').length;
          const res = all.filter((c: any) => c.status === 'resolved').length;
          return (
            <div key={d.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center text-2xl">
                  <Building2 size={24} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-ink">{d.name}</h3>
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

function AdminUsersView({ 
  users, 
  userName, setUserName, 
  userEmail, setUserEmail, 
  userPass, setUserPass, 
  userRole, setUserRole, 
  userDept, setUserDept, 
  userContact, setUserContact,
  userAddress, setUserAddress,
  userColor, setUserColor,
  editingUserId, setEditingUserId,
  departments, 
  onAdd, 
  onUpdate,
  onDelete 
}: any) {
  const handleEdit = (u: any) => {
    setEditingUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserPass(u.password);
    setUserRole(u.role);
    setUserDept(u.dept || '');
    setUserContact(u.contact || '');
    setUserAddress(u.address || '');
    setUserColor(u.color || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPass('');
    setUserRole('resident');
    setUserDept('');
    setUserContact('');
    setUserAddress('');
    setUserColor('');
  };

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Manage Users</h1>
        <p className="text-muted mt-1">Create and manage resident and officer accounts.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <h3 className="font-bold">{editingUserId ? 'Edit User Profile' : 'Add New User'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Full Name</label>
            <input 
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Email Address</label>
            <input 
              type="email" 
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Password (Visible to Admin)</label>
            <input 
              type="text" 
              value={userPass}
              onChange={(e) => setUserPass(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Contact Number</label>
            <input 
              type="text" 
              value={userContact}
              onChange={(e) => setUserContact(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="0300-1234567"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Address</label>
            <input 
              type="text" 
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="House #123, Street #456"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">User Role</label>
            <select 
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as Role)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            >
              <option value="resident">Resident</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {userRole === 'officer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide">Assign Department</label>
              <select 
                value={userDept}
                onChange={(e) => setUserDept(e.target.value)}
                className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              >
                <option value="">Select Department</option>
                {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Profile Color (Hex)</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={userColor || '#000000'}
                onChange={(e) => setUserColor(e.target.value)}
                className="h-12 w-12 p-1 bg-paper border border-border rounded-lg outline-none cursor-pointer"
              />
              <input 
                type="text" 
                value={userColor}
                onChange={(e) => setUserColor(e.target.value)}
                className="flex-1 px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
                placeholder="#000000"
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            {editingUserId ? (
              <>
                <button 
                  onClick={onUpdate}
                  className="flex-1 py-3.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                >
                  Update User
                </button>
                <button 
                  onClick={handleCancel}
                  className="px-6 py-3.5 bg-cream text-ink rounded-xl font-bold hover:bg-border transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={onAdd}
                className="w-full py-3.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
              >
                Create User
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream border-bottom border-border">
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Department</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-cream/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-ink">{u.name}</div>
                      <div className="text-xs text-muted">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    u.role === 'resident' ? 'bg-green/10 text-green' :
                    u.role === 'officer' ? 'bg-accent2/10 text-accent2' :
                    'bg-accent/10 text-accent'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-muted">
                  {u.deptName || '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(u)}
                      className="p-2 text-muted hover:text-accent transition-colors"
                      title="Edit Profile"
                    >
                      <UserIcon size={18} />
                    </button>
                    {u.id !== 'A001' && (
                      <button 
                        onClick={() => onDelete(u.id)}
                        className="p-2 text-muted hover:text-rose-500 transition-colors"
                        title="Delete User"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDeptsView({ 
  departments, 
  deptName, setDeptName, 
  onAdd, 
  onDelete, 
  onUpdate,
  subCategories,
  onAddSub,
  onDeleteSub,
  complaints 
}: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [selectedDeptForSubs, setSelectedDeptForSubs] = useState<string | null>(null);

  const handleStartEdit = (d: any) => {
    setEditingId(d.id);
    setEditName(d.name);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      onUpdate(editingId, editName);
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Manage Departments</h1>
        <p className="text-muted mt-1">Configure the departments and their specific problem categories.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <h3 className="font-bold">Add New Department</h3>
        <div className="flex flex-wrap gap-6 items-end">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold tracking-wide">Department Name</label>
            <input 
              type="text" 
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="e.g. Waste Management"
            />
          </div>
          <button 
            onClick={onAdd}
            className="px-8 py-3.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
          >
            Add Department
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((d: any) => {
          const count = complaints.filter((c: any) => c.category === d.id).length;
          const isEditing = editingId === d.id;
          const deptSubs = subCategories.filter((s: any) => s.deptId === d.id);

          return (
            <div key={d.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm group flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center text-2xl">
                  <Building2 size={24} className="text-accent" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleStartEdit(d)}
                    className="p-2 text-muted hover:text-accent transition-colors"
                    title="Edit Department"
                  >
                    <MapPin size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(d.id)}
                    className="p-2 text-muted hover:text-rose-500 transition-colors"
                    title="Delete Department"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-3 mb-4">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-paper border border-border rounded-lg outline-none focus:border-accent text-sm"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 py-2 bg-accent text-white rounded-lg text-xs font-bold"
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="flex-1 py-2 bg-cream text-ink rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <h3 className="font-bold text-ink mb-1">{d.name}</h3>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted font-medium uppercase tracking-wider">{count} complaints</span>
                <span className="text-[10px] font-mono text-muted bg-cream px-2 py-0.5 rounded">{d.id}</span>
              </div>

              <div className="mt-auto pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Sub-categories</span>
                  <button 
                    onClick={() => setSelectedDeptForSubs(selectedDeptForSubs === d.id ? null : d.id)}
                    className="text-[10px] text-accent font-bold hover:underline"
                  >
                    {selectedDeptForSubs === d.id ? 'Close' : 'Manage'}
                  </button>
                </div>

                {selectedDeptForSubs === d.id && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="New sub-category..."
                        className="flex-1 px-3 py-2 bg-paper border border-border rounded-lg outline-none focus:border-accent text-xs"
                      />
                      <button 
                        onClick={() => {
                          if (newSubName) {
                            onAddSub(d.id, newSubName);
                            setNewSubName('');
                          }
                        }}
                        className="p-2 bg-accent text-white rounded-lg"
                      >
                        <PlusCircle size={14} />
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {deptSubs.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between p-2 bg-cream rounded-lg text-[10px]">
                          <span className="font-medium truncate mr-2">{s.name}</span>
                          <button 
                            onClick={() => onDeleteSub(s.id)}
                            className="text-muted hover:text-rose-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {deptSubs.length === 0 && (
                        <div className="text-[10px] text-muted italic text-center py-2">No sub-categories added</div>
                      )}
                    </div>
                  </div>
                )}
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

function ComplaintModal({ complaint, onClose, onUpdateStatus, onAddComment, user, departments }: any) {
  const userRole = user.role;
  const canUpdate = userRole === 'admin' || (userRole === 'officer' && user.dept === complaint.category);
  const dept = departments.find((d: any) => d.id === complaint.category);
  const [comment, setComment] = useState('');

  // Sequential commenting logic: can only send if the last message wasn't from you
  const lastEntry = complaint.timeline[complaint.timeline.length - 1];
  const canComment = !lastEntry || lastEntry.authorId !== user.id;

  const handleSendComment = () => {
    if (!comment.trim()) return;
    onAddComment(complaint.id, comment);
    setComment('');
  };

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
            <div className="flex flex-col gap-2">
              <button 
                onClick={onClose}
                className="flex items-center gap-2 text-muted hover:text-ink transition-colors font-bold text-[10px] uppercase tracking-widest mb-2"
              >
                <ArrowLeft size={14} /> Back to List
              </button>
              <span className="font-mono text-[10px] bg-cream px-2 py-1 rounded text-muted w-fit">{complaint.id}</span>
              <h2 className="text-3xl font-serif mt-1">{complaint.description.substring(0, 50)}...</h2>
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
              {dept?.name || complaint.category}
            </span>
            {complaint.subcategory && (
              <span className="bg-accent/10 px-3 py-1 rounded-full text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                {complaint.subcategory}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Submitted By</div>
              <div className="text-sm font-medium flex items-center gap-2"><UserIcon size={14} className="text-muted" /> {complaint.resident}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Date</div>
              <div className="text-sm font-medium flex items-center gap-2"><Calendar size={14} className="text-muted" /> {complaint.date}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Address</div>
              <div className="text-sm font-medium flex items-center gap-2"><MapPin size={14} className="text-muted" /> {complaint.address}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Contact</div>
              <div className="text-sm font-medium flex items-center gap-2"><Phone size={14} className="text-muted" /> {complaint.contact}</div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Description</div>
            <div className="bg-cream p-6 rounded-2xl text-sm leading-relaxed text-ink">
              {complaint.description}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Timeline & Comments</div>
            <div className="space-y-4 pl-4 border-l-2 border-border">
              {complaint.timeline.map((t: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-accent border-2 border-paper" />
                  <div className="flex justify-between items-center mb-0.5">
                    <div className="text-[10px] font-mono text-muted">{t.time}</div>
                    {t.authorName && (
                      <div className="text-[10px] font-bold text-accent uppercase tracking-widest">{t.authorName}</div>
                    )}
                  </div>
                  <div className="text-sm font-medium">{t.text}</div>
                </div>
              ))}
            </div>
          </div>

          {complaint.status !== 'resolved' && (
            <div className="mt-8 space-y-3">
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest">Add Comment</div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={canComment ? "Type your message..." : "Waiting for reply..."}
                  disabled={!canComment}
                  className="flex-1 px-4 py-2 bg-cream border border-border rounded-xl text-sm outline-none focus:border-accent disabled:opacity-50"
                />
                <button 
                  onClick={handleSendComment}
                  disabled={!canComment || !comment.trim()}
                  className="px-4 py-2 bg-ink text-white rounded-xl text-xs font-bold hover:bg-accent transition-all disabled:opacity-50"
                >
                  Send
                </button>
              </div>
              {!canComment && (
                <p className="text-[10px] text-accent font-medium italic">You must wait for a reply before sending another message.</p>
              )}
            </div>
          )}
        </div>

        {canUpdate && (
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

function SubmitSuggestionForm({ newSuggestion, setNewSuggestion, onSubmit, onCancel }: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={onCancel}
          className="flex items-center gap-2 text-muted hover:text-ink transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="page-header">
        <h1 className="text-4xl font-serif">Submit a Suggestion</h1>
        <p className="text-muted mt-1">Help us improve the Mozang Community Portal with your ideas.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wide">Your Suggestion</label>
          <textarea 
            value={newSuggestion}
            onChange={(e) => setNewSuggestion(e.target.value)}
            className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors min-h-[200px] resize-none"
            placeholder="Describe your suggestion here..."
          />
        </div>
        <button 
          onClick={onSubmit}
          className="w-full py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
        >
          Submit Suggestion
        </button>
      </div>
    </div>
  );
}

function SuggestionsList({ suggestions, onDelete }: any) {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Community Suggestions</h1>
        <p className="text-muted mt-1">Review ideas and feedback from residents and officers.</p>
      </div>

      <div className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-serif mb-2">No suggestions yet</h3>
            <p className="text-muted">New suggestions will appear here.</p>
          </div>
        ) : (
          suggestions.map((s: any) => (
            <div key={s.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{s.userName}</span>
                  <span className="text-[10px] text-muted">•</span>
                  <span className="text-[10px] text-muted">{s.date}</span>
                </div>
                <p className="text-ink leading-relaxed">{s.description}</p>
              </div>
              <button 
                onClick={() => onDelete(s.id)}
                className="p-2 text-muted hover:text-rose-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InsightsView({ user, complaints, departments, users }: any) {
  const role = user.role;
  
  // Data processing
  const statusData = [
    { name: 'Pending', value: complaints.filter((c: any) => c.status === 'pending').length, color: '#f59e0b' },
    { name: 'In Progress', value: complaints.filter((c: any) => c.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Resolved', value: complaints.filter((c: any) => c.status === 'resolved').length, color: '#10b981' },
  ];

  const categoryData = departments.map((d: any) => ({
    name: d.name.split(' ')[0],
    count: complaints.filter((c: any) => c.category === d.id).length
  }));

  const priorityData = [
    { name: 'High', value: complaints.filter((c: any) => c.priority === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: complaints.filter((c: any) => c.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: complaints.filter((c: any) => c.priority === 'low').length, color: '#10b981' },
  ];

  // Mock data for trends (since we don't have historical data yet)
  const trendData = [
    { name: 'Week 1', complaints: 4, resolved: 2 },
    { name: 'Week 2', complaints: 7, resolved: 5 },
    { name: 'Week 3', complaints: 5, resolved: 4 },
    { name: 'Week 4', complaints: 9, resolved: 7 },
  ];

  const resolutionTimeData = [
    { name: 'Jan', time: 4.5 },
    { name: 'Feb', time: 3.8 },
    { name: 'Mar', time: 3.2 },
    { name: 'Apr', time: 2.5 },
  ];

  const deptPerformance = departments.map((d: any) => {
    const total = complaints.filter((c: any) => c.category === d.id).length;
    const resolved = complaints.filter((c: any) => c.category === d.id && c.status === 'resolved').length;
    const rate = total === 0 ? 0 : Math.round((resolved / total) * 100);
    return { name: d.name.split(' ')[0], rate };
  });

  return (
    <div className="space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">Graphical Insights</h1>
        <p className="text-muted mt-1">Visualizing community data and performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Common Charts */}
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-accent" />
            Complaint Status Overview
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-accent" />
            Complaints Over Time
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="complaints" stroke="#c8502a" fill="#c8502a" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {role === 'resident' && (
          <div className="bg-white border border-border rounded-2xl p-8 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-accent" />
              Category-wise Complaints
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#c8502a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {role === 'officer' && (
          <>
            <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
                <Clock size={20} className="text-accent" />
                Average Resolution Time (Days)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={resolutionTimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
                <ShieldAlert size={20} className="text-accent" />
                Priority-wise Complaints
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {role === 'admin' && (
          <>
            <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
                <Users2 size={20} className="text-accent" />
                System Usage (Active Users)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="complaints" stroke="#c8502a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-serif mb-6 flex items-center gap-2">
                <LayoutDashboard size={20} className="text-accent" />
                Department Performance (%)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptPerformance}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
