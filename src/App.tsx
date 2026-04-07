import React, { useState, useEffect, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
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
  Clock,
  Download,
  Upload,
  FileText,
  Database,
  RefreshCw,
  Share,
  Plus,
  Zap,
  Flame,
  Droplets,
  Truck,
  Send,
  Trash2,
  Share2,
  CheckCircle,
  Check,
  CheckCheck,
  LayoutGrid,
  List
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
  const [loginError, setLoginError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('mozang_page') || 'dashboard';
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [analyticsStats, setAnalyticsStats] = useState<any>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [emergencyTypes, setEmergencyTypes] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [sessionId] = useState(() => {
    const saved = sessionStorage.getItem('mozang_session_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('mozang_session_id', newId);
    return newId;
  });

  // --- PUSH NOTIFICATIONS ---
  const subscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;
      
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BJOuphg0lDz4c_cNOMxsw4sRr-Mmh_d3hd-dSPMe6ByS9Z2iWp5YOR2Evr3J0oomHNwP7YVtxvy7f2dM3I2tNCU'
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          subscription: JSON.parse(JSON.stringify(subscription))
        })
      });
      setIsSubscribed(true);
      console.log('Push subscription successful');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  };

  useEffect(() => {
    if (currentUser && typeof window !== 'undefined' && 'Notification' in window && (window as any).Notification.permission === 'granted') {
      subscribeToPush();
    }
  }, [currentUser]);

  const trackEvent = async (type: string, data: any = {}) => {
    if (typeof window === 'undefined') return;
    const userAgent = window.navigator.userAgent;
    const device = /mobile/i.test(userAgent) ? 'mobile' : 'desktop';
    const browser = /chrome/i.test(userAgent) ? 'chrome' : /safari/i.test(userAgent) ? 'safari' : /firefox/i.test(userAgent) ? 'firefox' : 'other';
    const os = /android/i.test(userAgent) ? 'android' : /iphone|ipad|ipod/i.test(userAgent) ? 'ios' : /windows/i.test(userAgent) ? 'windows' : /mac/i.test(userAgent) ? 'macos' : 'other';
    
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('utm_source') || urlParams.get('source') || 'direct';

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          userId: currentUser?.id,
          sessionId,
          path: window.location.pathname + window.location.hash,
          source,
          device,
          browser,
          os,
          location: currentUser?.area,
          timestamp: new Date().toISOString(),
          ...data
        })
      });
    } catch (e) {
      console.error('Tracking failed', e);
    }
  };

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show popup automatically if not already in standalone mode
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      if (!isStandaloneMode) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    // For iOS, we can't detect beforeinstallprompt, so we show the guide if not standalone
    if (isIOSDevice && !isStandaloneMode) {
      setShowInstallPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowInstallPrompt(true);
      } else {
        showToast('Please open in Chrome or Edge to install.');
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  useEffect(() => {
    trackEvent('page_view');
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('utm_source') || urlParams.has('source')) {
      trackEvent('link_click');
    }
  }, [currentPage]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
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
  const [newArea, setNewArea] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBillRef, setNewBillRef] = useState('');
  const [newSuggestion, setNewSuggestion] = useState('');

  // User Management
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [userRole, setUserRole] = useState<Role>('resident');
  const [userDept, setUserDept] = useState('');
  const [userContact, setUserContact] = useState('');
  const [userArea, setUserArea] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [userColor, setUserColor] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Dept Management
  const [deptName, setDeptName] = useState('');

  // Area Management
  const [newAreaName, setNewAreaName] = useState('');

  // Announcement Management
  const [annTag, setAnnTag] = useState<'Notice' | 'Update' | 'Alert' | 'Event'>('Notice');
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');

  // Insights Date Range
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [lastAnnouncementId, setLastAnnouncementId] = useState<string | null>(() => localStorage.getItem('mozang_last_announcement'));

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && (window as any).Notification.permission === 'default') {
      (window as any).Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (announcements.length > 0) {
      const latest = announcements[0];
      if (lastAnnouncementId && latest.id !== lastAnnouncementId) {
        if (typeof window !== 'undefined' && 'Notification' in window && (window as any).Notification.permission === 'granted') {
          new (window as any).Notification('New Announcement: ' + latest.title, {
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
    const handleDeepLinking = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const complaintId = urlParams.get('id');
      const emergencyId = urlParams.get('emergencyId');
      const announcementId = urlParams.get('announcementId');

      if (complaintId) {
        const complaint = complaints.find(c => c.id === complaintId);
        if (complaint) {
          setSelectedComplaint(complaint);
          if (currentUser?.role === 'resident') {
            setCurrentPage('my-complaints');
          } else if (currentUser?.role === 'officer') {
            setCurrentPage('dept-complaints');
          } else {
            setCurrentPage('all-complaints');
          }
        }
      } else if (emergencyId) {
        setCurrentPage('emergencies-admin');
      } else if (announcementId) {
        setCurrentPage('announcements');
      }
    };

    if (complaints.length > 0) {
      handleDeepLinking();
    }
  }, [complaints, currentUser]);

  // Notification for acknowledged suggestions
  useEffect(() => {
    if (currentUser && suggestions.length > 0) {
      const myAcknowledged = suggestions.filter(s => s.userId === currentUser.id && s.status === 'acknowledged');
      const lastSeenAckCount = parseInt(localStorage.getItem(`mozang_ack_count_${currentUser.id}`) || '0');
      
      if (myAcknowledged.length > lastSeenAckCount) {
        showToast('One of your suggestions has been acknowledged by the admin!');
        localStorage.setItem(`mozang_ack_count_${currentUser.id}`, myAcknowledged.length.toString());
      }
    }
  }, [suggestions, currentUser]);

  // --- DATA FETCHING ---
  const fetchData = async () => {
    console.log('Fetching data from API...');
    const startTime = Date.now();
    try {
      const endpoints = [
        { name: 'users', url: '/api/users' },
        { name: 'departments', url: '/api/departments' },
        { name: 'subcategories', url: '/api/subcategories' },
        { name: 'complaints', url: '/api/complaints' },
        { name: 'announcements', url: '/api/announcements' },
        { name: 'suggestions', url: '/api/suggestions' },
        { name: 'settings', url: '/api/settings' },
        { name: 'areas', url: '/api/areas' },
        { name: 'emergencies', url: '/api/emergencies' },
        { name: 'emergencyTypes', url: '/api/emergency-types' }
      ];

      if (currentUser) {
        endpoints.push({ name: 'notifications', url: `/api/notifications/${currentUser.id}` });
      }

      if (currentUser?.role === 'admin') {
        endpoints.push({ name: 'analytics', url: '/api/analytics/stats' });
      }

      console.log(`Starting Promise.all for ${endpoints.length} endpoints...`);
      const results = await Promise.all(endpoints.map(async (e) => {
        try {
          const res = await fetch(e.url);
          if (!res.ok) {
            const text = await res.text();
            console.error(`Failed to fetch ${e.name}:`, res.status, text);
            return { __error: true, name: e.name, status: res.status, message: text };
          }
          return res.json();
        } catch (err: any) {
          console.error(`Network error fetching ${e.name}:`, err);
          return { __error: true, name: e.name, message: err.message };
        }
      }));

      console.log(`Data fetched in ${Date.now() - startTime}ms`);

      // Map results back to named variables
      const dataMap: any = {};
      endpoints.forEach((e, i) => {
        if (results[i] && results[i].__error) {
          if (e.name === 'analytics') {
            setAnalyticsError(`Failed to fetch analytics: ${results[i].message}`);
          }
        } else {
          dataMap[e.name] = results[i];
        }
      });

      setUsers(dataMap.users || []);
      setDepartments(dataMap.departments || []);
      setSubCategories(dataMap.subcategories || []);
      setComplaints(dataMap.complaints || []);
      setAnnouncements(dataMap.announcements || []);
      setSuggestions(dataMap.suggestions || []);
      setSettings(dataMap.settings || {});
      setAreas(dataMap.areas || []);
      setEmergencies(dataMap.emergencies || []);
      setEmergencyTypes(dataMap.emergencyTypes || []);
      setNotifications(dataMap.notifications || []);
      
      if (dataMap.analytics) {
        setAnalyticsStats(dataMap.analytics);
        setAnalyticsError(null);
      } else if (currentUser?.role === 'admin' && !analyticsStats && !analyticsError) {
        // If it's still null and no error was set, maybe it's just empty
        setAnalyticsStats({
          total_events: 0,
          unique_visitors: 0,
          devices: [],
          sources: [],
          paths: [],
          browsers: [],
          os: [],
          funnel: { link_clicked: 0, website_opened: 0, registered: 0, complaint_submitted: 0, complaint_resolved: 0 },
          peak_times: []
        });
      }

      if (dataMap.departments?.length > 0 && !newCategory) setNewCategory(dataMap.departments[0].id);
    } catch (error: any) {
      console.error('Critical error in fetchData:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.role]);

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

  const handleLogin = async () => {
    setLoginError(null);
    const email = loginEmail.trim().toLowerCase();
    
    if (!email || !loginPass) {
      setLoginError('Please enter both email and password.');
      return;
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: loginPass })
      });

      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.error || 'Incorrect email or password.');
        return;
      }

      const u = await res.json();
      console.log('Login successful:', u.name, 'Role:', u.role);
      setCurrentUser(u);
      localStorage.setItem('mozang_user', JSON.stringify(u));
      trackEvent('login');
      setCurrentPage('dashboard');
    } catch (e) {
      console.error('Login error:', e);
      setLoginError('An error occurred during login. Please try again.');
    }
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
      contact: userContact,
      area: userArea
    };
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (!res.ok) throw new Error('Failed to create user');
      showToast('User created');
      trackEvent('registration', { role: userRole });
      setUserName(''); setUserEmail(''); setUserPass('');
      setUserAvatar(''); setUserColor('');
      setUserAddress(''); setUserContact(''); setUserArea('');
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
      contact: userContact,
      area: userArea
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
      setUserAddress(''); setUserContact(''); setUserArea('');
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

  const addArea = async () => {
    if (!newAreaName) return;
    const id = `area-${Date.now()}`;
    try {
      const res = await fetch('/api/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: newAreaName })
      });
      if (!res.ok) throw new Error('Failed to add area');
      setNewAreaName('');
      showToast('Area added');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const updateArea = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/areas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Failed to update area');
      showToast('Area updated');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const deleteArea = async (id: string) => {
    try {
      const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete area');
      showToast('Area deleted');
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
      area: newArea || currentUser?.area,
      billReferenceNumber: newBillRef,
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
      trackEvent('complaint_submit', { category: newCategory });
      setCurrentPage('my-complaints');
      // Reset form
      setNewAddress('');
      setNewContact('');
      setNewArea('');
      setNewDesc('');
      setNewBillRef('');
      setNewSubCategory('');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const updateStatus = async (id: string, status: Status, closureReason?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const msgs: Record<Status, string> = {
      pending: 'Moved back to pending',
      'in-progress': 'Status updated to In Progress',
      resolved: 'Issue marked as Resolved',
      rejected: 'Complaint rejected by admin',
      'closed-not-actionable': `Closed as Not Actionable: ${closureReason}`
    };
    
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;

    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          closureReason,
          timelineEntry: { 
            time: today, 
            text: msgs[status],
            authorId: currentUser?.id,
            authorName: currentUser?.name
          }
        })
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(`Status updated to ${status.replace('-', ' ')}`);
      if (status === 'resolved') {
        trackEvent('complaint_resolve', { complaintId: id });
      }
      setSelectedComplaint(null);
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const backupData = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mozang_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('Backup downloaded successfully');
    } catch (error) {
      console.error('Backup failed:', error);
      showToast('Backup failed');
    }
  };

  const restoreData = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const res = await fetch('/api/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (res.ok) {
            showToast('System restored successfully');
            setTimeout(() => window.location.reload(), 1500);
          } else {
            const errData = await res.json();
            showToast(`Restore failed: ${errData.message || 'Unknown error'}`);
          }
        } catch (err: any) {
          console.error('Restore processing failed:', err);
          showToast(`Restore failed: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } catch (error: any) {
      console.error('Restore failed:', error);
      showToast(`Restore failed: ${error.message}`);
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

  const markAsRead = async (complaintId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/timeline/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId,
          userId: currentUser.id
        })
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      fetchData();
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      fetchData();
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      console.error('Failed to delete notification', e);
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
      userContact: currentUser?.contact,
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

  const acknowledgeSuggestion = async (id: string) => {
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' })
      });
      if (!res.ok) throw new Error('Failed to acknowledge suggestion');
      showToast('Suggestion acknowledged');
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

  const [reportingEmergency, setReportingEmergency] = useState<string | null>(null);

  const reportEmergency = async (type: string, details?: any) => {
    if (!currentUser) return;
    if (reportingEmergency) return; // Anti-spam cooldown
    
    // Check for duplicate reporting (2 hour cooldown)
    const area = details?.area || currentUser.area;
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const existing = emergencies.find((e: any) => 
      e.userId === currentUser.id && 
      e.type === type && 
      e.area === area && 
      e.timestamp > twoHoursAgo
    );

    if (existing) {
      showToast('Matter is under process. Please wait, our team is working on it.');
      return;
    }

    setReportingEmergency(type);
    const id = 'E' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const emergency = {
      id,
      userId: currentUser.id,
      userName: details?.userName || currentUser.name,
      userContact: details?.userContact || currentUser.contact,
      area: area,
      type,
      description: details?.description || `Emergency ${type} reported by ${currentUser.name} in ${area}`,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    try {
      const res = await fetch('/api/emergencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emergency)
      });
      if (!res.ok) throw new Error('Failed to report emergency');
      showToast(`Emergency ${type} reported successfully!`);
      trackEvent('emergency_report', { emergencyType: type });
      fetchData();
    } catch (e) {
      handleApiError(e);
    } finally {
      // Short cooldown to prevent rapid clicking
      setTimeout(() => setReportingEmergency(null), 3000);
    }
  };

  const updateEmergencyStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/emergencies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update emergency');
      showToast('Emergency status updated');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const deleteEmergency = async (id: string) => {
    try {
      const res = await fetch(`/api/emergencies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete emergency');
      showToast('Emergency record removed');
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

  const addEmergencyType = async (name: string, deptId: string) => {
    try {
      const id = String(Date.now());
      const icon = 'AlertCircle';
      const res = await fetch('/api/emergency-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, icon, deptId })
      });
      if (!res.ok) throw new Error('Failed to add emergency type');
      showToast('Emergency type added');
      fetchData();
    } catch (e) {
      handleApiError(e);
    }
  };

  const deleteEmergencyType = async (id: string) => {
    try {
      const res = await fetch(`/api/emergency-types/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete emergency type');
      showToast('Emergency type removed');
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
            className="mb-8 relative z-10 text-center md:text-left"
          >
            <p className="font-amiri text-white/90 text-lg md:text-xl leading-relaxed mb-2" dir="rtl">
              اللَّهُمَّ صَلِّ عَلٰی مُحَمَّدٍ وَعَلٰی آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلٰی إِبْرَاهِيمَ وَعَلٰی آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ
            </p>
            <p className="font-amiri text-white/90 text-lg md:text-xl leading-relaxed" dir="rtl">
              اللَّهُمَّ بَارِكْ عَلٰی مُحَمَّدٍ، وَعَلٰی آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلٰی إِبْرَاهِيمَ وَعَلٰی آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 text-2xl font-serif text-white relative z-10 mb-12"
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

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-8 pt-6 border-t border-white/10"
            >
              <p className="text-white/60 text-sm leading-relaxed font-medium text-right md:text-left" dir="rtl">
                یہ اقدام صرف بانی کی ذاتی کاوش ہے، جو میرے والدین کے لیے صدقہ جاریہ کے طور پر شروع کیا گیا ہے۔ اس کا کسی بھی سیاسی جماعت یا تنظیم سے کوئی تعلق نہیں ہے۔
              </p>
            </motion.div>

            {/* PWA Install Section for Landing Page */}
            {!isStandalone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm"
              >
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-xl shadow-2xl shadow-accent/20">
                    MCP
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-white font-serif text-xl mb-2">Get the Mozang CP App</h3>
                    <p className="text-white/50 text-sm mb-4">Install our app on your phone or desktop for instant access, offline support, and a better experience.</p>
                    
                    {isIOS ? (
                      <div className="inline-flex flex-col gap-2 text-left bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">iOS Installation Guide:</p>
                        <div className="flex items-center gap-3 text-xs text-white/80">
                          <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center border border-white/10">
                            <Share size={12} className="text-accent" />
                          </div>
                          <span>Tap the <strong>Share</strong> icon in Safari</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/80">
                          <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center border border-white/10">
                            <Plus size={12} className="text-white" />
                          </div>
                          <span>Select <strong>Add to Home Screen</strong></span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleInstallClick}
                        disabled={!deferredPrompt && !isIOS}
                        className={`px-8 py-3 rounded-2xl font-bold uppercase tracking-widest transition-all shadow-xl ${
                          (deferredPrompt || isIOS) 
                            ? 'bg-accent text-white hover:bg-white hover:text-ink shadow-accent/20' 
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                      >
                        {deferredPrompt ? 'Install Now' : 'App Ready to Install'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
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
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium"
                >
                  <AlertCircle size={18} />
                  {loginError}
                </motion.div>
              )}
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
            <span>Mozang <span className="text-accent">Community Portal</span> <span className="text-[8px] opacity-30 ml-2">v2.1</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {!isStandalone && (
            <button
              onClick={() => setShowInstallPrompt(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent rounded-full border border-accent/30 transition-all text-xs font-bold uppercase tracking-widest"
            >
              <Plus size={14} /> Install App
            </button>
          )}
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
                  icon={<Megaphone size={18} />} 
                  label="Inbox" 
                  active={currentPage === 'inbox'} 
                  onClick={() => { setCurrentPage('inbox'); setShowMobileMenu(false); }} 
                  count={notifications.filter(n => !n.readStatus).length}
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
                      icon={<BarChart3 size={18} />} 
                      label="Dept Insights" 
                      active={currentPage === 'insights'} 
                      onClick={() => { setCurrentPage('insights'); setShowMobileMenu(false); }} 
                    />
                    <SidebarItem 
                      icon={<ShieldAlert size={18} />} 
                      label="Emergencies" 
                      active={currentPage === 'emergencies-admin'} 
                      onClick={() => { setCurrentPage('emergencies-admin'); setShowMobileMenu(false); }} 
                    />
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
                      count={getDeptComplaints().filter(c => c.status !== 'resolved' && c.status !== 'closed-not-actionable').length}
                    />
                    <SidebarItem 
                      icon={<CheckCircle2 size={18} />} 
                      label="Closed" 
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
                      icon={<MapPin size={18} />} 
                      label="Manage Areas" 
                      active={currentPage === 'manage-areas'} 
                      onClick={() => { setCurrentPage('manage-areas'); setShowMobileMenu(false); }} 
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
                    <SidebarItem 
                      icon={<Database size={18} />} 
                      label="System Management" 
                      active={currentPage === 'system-management'} 
                      onClick={() => { setCurrentPage('system-management'); setShowMobileMenu(false); }} 
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
                    {currentUser.role === 'admin' && (
                      <>
                        <SidebarItem 
                          icon={<BarChart3 size={18} />} 
                          label="Advanced Analytics" 
                          active={currentPage === 'advanced-analytics'} 
                          onClick={() => { setCurrentPage('advanced-analytics'); setShowMobileMenu(false); }} 
                        />
                        <SidebarItem 
                          icon={<ShieldAlert size={18} />} 
                          label="Manage Emergencies" 
                          active={currentPage === 'emergencies-admin'} 
                          onClick={() => { setCurrentPage('emergencies-admin'); setShowMobileMenu(false); }} 
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {!isStandalone && (
              <div className="mt-auto pt-6 border-t border-border">
                <button
                  onClick={() => setShowInstallPrompt(true)}
                  className="w-full p-4 bg-accent/10 hover:bg-accent/20 text-accent rounded-2xl flex items-center gap-3 transition-all group"
                >
                  <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                    <Plus size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold uppercase tracking-widest">Install App</div>
                    <div className="text-[10px] text-accent/60">Faster Access</div>
                  </div>
                </button>
              </div>
            )}
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
          <AnimatePresence>
        {showInstallPrompt && !isStandalone && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-6 md:w-96"
          >
            <div className="bg-white border-2 border-accent rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
              <button 
                onClick={() => setShowInstallPrompt(false)}
                className="absolute top-4 right-4 text-muted hover:text-ink"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center shrink-0 text-white font-bold shadow-lg shadow-accent/20">
                  MCP
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-lg leading-tight mb-1">Install Mozang CP</h3>
                  <p className="text-xs text-muted leading-relaxed mb-4">
                    Install our app for faster access and offline support. Minimal storage required.
                  </p>
                  
                  {isIOS ? (
                    <div className="space-y-3 bg-cream/50 p-3 rounded-xl border border-border/50">
                      <p className="text-[10px] font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                        How to install on iOS:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-border shadow-sm">
                            <Share size={12} className="text-accent2" />
                          </div>
                          <span>Tap the <strong>Share</strong> button below</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center border border-border shadow-sm">
                            <Plus size={12} className="text-ink" />
                          </div>
                          <span>Select <strong>Add to Home Screen</strong></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button 
                        onClick={handleInstallClick}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg ${
                          deferredPrompt 
                            ? 'bg-ink text-white hover:bg-accent shadow-ink/10' 
                            : 'bg-cream text-muted border border-border cursor-default'
                        }`}
                      >
                        {deferredPrompt ? 'Install Now' : 'App Ready to Install'}
                      </button>
                      {!deferredPrompt && (
                        <p className="text-[10px] text-muted text-center italic">
                          If the button is disabled, try refreshing the page or check your browser's menu for "Install App".
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  onReportEmergency={reportEmergency}
                  emergencyTypes={emergencyTypes}
                  reportingEmergency={reportingEmergency}
                />
              )}
              {currentPage === 'submit' && (
                <SubmitForm 
                  newCategory={newCategory} setNewCategory={setNewCategory}
                  newSubCategory={newSubCategory} setNewSubCategory={setNewSubCategory}
                  newAddress={newAddress} setNewAddress={setNewAddress}
                  newContact={newContact} setNewContact={setNewContact}
                  newArea={newArea} setNewArea={setNewArea}
                  areas={areas}
                  newDesc={newDesc} setNewDesc={setNewDesc}
                  newBillRef={newBillRef} setNewBillRef={setNewBillRef}
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
                  mySuggestions={suggestions.filter((s: any) => s.userId === currentUser?.id)}
                  onDelete={deleteSuggestion}
                />
              )}
              {currentPage === 'manage-suggestions' && (
                <SuggestionsList 
                  suggestions={suggestions}
                  onDelete={deleteSuggestion}
                  onAcknowledge={acknowledgeSuggestion}
                  userRole={currentUser?.role}
                />
              )}
              {currentPage === 'insights' && (
                <InsightsView 
                  user={currentUser}
                  complaints={complaints}
                  departments={departments}
                  users={users}
                  areas={areas}
                  fromDate={fromDate}
                  toDate={toDate}
                  setFromDate={setFromDate}
                  setToDate={setToDate}
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
                  title="Closed Complaints" 
                  list={getDeptComplaints().filter(c => c.status === 'resolved' || c.status === 'closed-not-actionable')} 
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
                  userArea={userArea} setUserArea={setUserArea}
                  userAddress={userAddress} setUserAddress={setUserAddress}
                  userColor={userColor} setUserColor={setUserColor}
                  editingUserId={editingUserId} setEditingUserId={setEditingUserId}
                  departments={departments}
                  areas={areas}
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
              {currentPage === 'manage-areas' && (
                <AdminAreasView 
                  areas={areas}
                  newAreaName={newAreaName}
                  setNewAreaName={setNewAreaName}
                  onAdd={addArea}
                  onDelete={deleteArea}
                  onUpdate={updateArea}
                  complaints={complaints}
                />
              )}
              {currentPage === 'system-management' && (
                <SystemManagementView 
                  complaints={complaints}
                  onBackup={backupData}
                  onRestore={restoreData}
                />
              )}
              {currentPage === 'inbox' && (
                <InboxView 
                  notifications={notifications}
                  onMarkRead={markNotificationRead}
                  onDelete={deleteNotification}
                  onNavigate={(url: string) => {
                    const [path, query] = url.split('?');
                    const params = new URLSearchParams(query);
                    const id = params.get('id');
                    const emergencyId = params.get('emergencyId');
                    const announcementId = params.get('announcementId');
                    
                    if (id) {
                      const complaint = complaints.find(c => c.id === id);
                      if (complaint) {
                        setSelectedComplaint(complaint);
                      }
                    }
                    
                    if (path === '/my-complaints') setCurrentPage('my-complaints');
                    else if (path === '/dept-complaints') setCurrentPage('dept-complaints');
                    else if (path === '/admin-complaints') setCurrentPage('all-complaints');
                    else if (path === '/announcements') setCurrentPage('announcements');
                    else if (path === '/emergencies-admin') setCurrentPage('emergencies-admin');
                  }}
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
              {currentPage === 'emergencies-admin' && (
                <EmergenciesAdmin 
                  user={currentUser}
                  emergencies={emergencies}
                  onUpdateStatus={updateEmergencyStatus}
                  onDelete={deleteEmergency}
                  onReportEmergency={reportEmergency}
                  emergencyTypes={emergencyTypes}
                  onAddType={addEmergencyType}
                  onDeleteType={deleteEmergencyType}
                  departments={departments}
                />
              )}
              {currentPage === 'advanced-analytics' && (
                <AdvancedAnalytics 
                  stats={analyticsStats}
                  complaints={complaints}
                  users={users}
                  error={analyticsError}
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
            onMarkAsRead={markAsRead}
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

function Dashboard({ user, complaints, announcements, onNavigate, onSelectComplaint, departments, onReportEmergency, emergencyTypes, reportingEmergency }: any) {
  const r = user.role;
  
  const isClosed = (c: any) => c.status === 'resolved' || c.status === 'closed-not-actionable';

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

        {/* Emergency Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 shadow-xl shadow-red-100"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 animate-pulse">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">Emergency Reporting</h2>
                <p className="text-red-700 text-sm">Immediate issues? Click a button below to alert the authorities.</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
              {emergencyTypes.map((type: any) => (
                <button 
                  key={type.id}
                  disabled={!!reportingEmergency}
                  onClick={() => onReportEmergency(type.name)}
                  className={`flex-1 md:flex-none px-6 py-3 bg-white border-2 border-red-500 text-red-600 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${reportingEmergency === type.name ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500 hover:text-white'}`}
                >
                  {reportingEmergency === type.name ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {type.name === 'Electricity' ? <Zap size={18} /> : 
                       type.name === 'Gas' ? <Flame size={18} /> : 
                       type.name === 'Water' ? <Droplets size={18} /> : 
                       <AlertCircle size={18} />}
                    </>
                  )}
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Submitted" value={mine.length} color="red" sub="all time" />
          <StatCard label="Pending" value={mine.filter((c: any) => c.status === 'pending').length} color="gold" sub="awaiting review" />
          <StatCard label="In Progress" value={mine.filter((c: any) => c.status === 'in-progress').length} color="blue" sub="being handled" />
          <StatCard label="Closed" value={mine.filter(isClosed).length} color="green" sub="resolved or closed" />
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
                mine.slice(0, 4).map((c: any, idx: number) => (
                  <ComplaintCard key={c.id} complaint={c} idx={idx} onClick={() => onSelectComplaint(c)} departments={departments} />
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
    const deptComplaints = complaints.filter((c: any) => String(c.category) === String(user.dept));
    return (
      <div className="space-y-8">
        <div className="page-header">
          <h1 className="text-4xl font-serif">{user.deptName}</h1>
          <p className="text-muted mt-1">Officer Panel — Welcome, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Pending" value={deptComplaints.filter((c: any) => c.status === 'pending').length} color="gold" sub="needs attention" />
          <StatCard label="In Progress" value={deptComplaints.filter((c: any) => c.status === 'in-progress').length} color="blue" sub="currently active" />
          <StatCard label="Closed" value={deptComplaints.filter(isClosed).length} color="green" sub="resolved or closed" />
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
            {deptComplaints.filter((c: any) => !isClosed(c)).length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-serif mb-2">All caught up!</h3>
                <p className="text-muted">No open complaints in your department.</p>
              </div>
            ) : (
              deptComplaints.filter((c: any) => !isClosed(c)).map((c: any, idx: number) => (
                <ComplaintCard key={c.id} complaint={c} idx={idx} onClick={() => onSelectComplaint(c)} departments={departments} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif">Recently Closed</h2>
            <button 
              onClick={() => onNavigate('resolved')}
              className="text-xs font-bold text-accent uppercase tracking-widest hover:underline"
            >
              View All Closed
            </button>
          </div>
          <div className="space-y-3">
            {deptComplaints.filter(isClosed).length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-12 text-center">
                <div className="text-4xl mb-4">📜</div>
                <h3 className="text-xl font-serif mb-2">No closed issues yet</h3>
                <p className="text-muted">Issues you close will appear here.</p>
              </div>
            ) : (
              deptComplaints.filter(isClosed).slice(0, 3).map((c: any, idx: number) => (
                <ComplaintCard key={c.id} complaint={c} idx={idx} onClick={() => onSelectComplaint(c)} departments={departments} />
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
        <StatCard label="Closed" value={complaints.filter(isClosed).length} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-border rounded-2xl p-8">
          <h3 className="text-lg font-semibold mb-6">Department Breakdown</h3>
          <div className="space-y-6">
            {departments.map((d: any) => {
              const all = complaints.filter((c: any) => c.category === d.id);
              const closed = all.filter(isClosed);
              const pct = all.length === 0 ? 0 : Math.round((closed.length / all.length) * 100);
              return (
                <div key={d.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">{d.name}</span>
                    <span className="text-muted">{closed.length}/{all.length} closed</span>
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
              { label: 'Closed (Not Actionable)', icon: '⚪', count: complaints.filter(c => c.status === 'closed-not-actionable').length, color: 'text-gray-600' },
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
              <ClipboardList size={16} /> View All Complaints
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

function ComplaintCard({ complaint, onClick, departments, viewMode = 'card', idx }: { complaint: Complaint, onClick: () => void, departments: Department[], viewMode?: 'list' | 'card' | 'screenshot', key?: string, idx: number }) {
  const dept = departments.find(d => d.id === complaint.category);
  
  if (viewMode === 'list') {
    return (
      <div 
        onClick={onClick}
        className="bg-white border border-border p-4 rounded-xl flex items-center justify-between hover:border-accent transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="font-mono text-[10px] text-muted bg-cream px-2 py-0.5 rounded shrink-0">#{idx + 1}</span>
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
      <div className="absolute top-4 left-4 text-[10px] font-mono text-muted/50">#{idx + 1}</div>
      {isScreenshot && (
        <div className="absolute top-0 right-0 bg-ink text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">
          Official Record
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] text-muted bg-cream px-2 py-0.5 rounded w-fit">{complaint.id}</span>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_COLORS[complaint.status]}`}>
            {complaint.status.replace('-', ' ')}
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

      <div className="mb-4">
        <p className="text-base font-bold text-ink leading-relaxed">
          {complaint.description}
        </p>
      </div>

      <div className={`pt-4 border-t border-border space-y-3 ${isScreenshot ? 'bg-cream/30 -mx-6 px-6 pb-6' : ''}`}>
        <div className="flex items-center gap-2 text-xs">
          <MapPin size={14} className="text-muted" />
          <span className="font-medium">{complaint.address}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Phone size={14} className="text-muted" />
          <span className="font-medium">{complaint.contact}</span>
        </div>
        {complaint.billReferenceNumber && (
          <div className="flex items-center gap-2 text-xs">
            <ClipboardList size={14} className="text-muted" />
            <span className="font-medium">Bill Ref: {complaint.billReferenceNumber}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <UserIcon size={14} className="text-muted" />
          <span className="font-medium">{complaint.resident}</span>
        </div>
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
  newArea, setNewArea,
  areas,
  newDesc, setNewDesc, 
  newBillRef, setNewBillRef,
  onSubmit, onCancel,
  departments,
  subCategories
}: any) {
  const filteredSubs = subCategories.filter((s: any) => s.deptId === newCategory);
  const showBillRef = ['water', 'electricity', 'gas'].includes(newCategory);

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
                maxLength={300}
                className="w-full pl-12 pr-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
                placeholder="Enter your complete address"
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Area *</label>
            <select 
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            >
              <option value="">Select Area</option>
              {areas.map((area: any) => (
                <option key={area.id} value={area.name}>{area.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Contact Number *</label>
            <input 
              type="text" 
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="Enter your contact number"
            />
          </div>

          {showBillRef && (
            <div className="md:col-span-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-semibold tracking-wide">Bill Reference Number (Optional)</label>
              <input 
                type="text" 
                value={newBillRef}
                onChange={(e) => setNewBillRef(e.target.value)}
                className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
                placeholder="Enter your bill reference number"
              />
            </div>
          )}

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
      return (p[b.priority] || 0) - (p[a.priority] || 0);
    }
    return (a.status || '').localeCompare(b.status || '');
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
          filtered.map((c: any, idx: number) => (
            <ComplaintCard 
              key={c.id} 
              complaint={c} 
              idx={idx}
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
  userArea, setUserArea,
  userAddress, setUserAddress,
  userColor, setUserColor,
  editingUserId, setEditingUserId,
  departments, 
  areas,
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
    setUserArea(u.area || '');
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
    setUserArea('');
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
              maxLength={100}
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
              maxLength={100}
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
              maxLength={50}
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
              maxLength={20}
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
              maxLength={200}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="House #123, Street #456"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Area</label>
            <select 
              value={userArea}
              onChange={(e) => setUserArea(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
            >
              <option value="">Select Area</option>
              {areas.map((area: any) => (
                <option key={area.id} value={area.name}>{area.name}</option>
              ))}
            </select>
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
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest w-12">#</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Role</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Department</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u: any, idx: number) => (
              <tr key={u.id} className="hover:bg-cream/50 transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-muted">
                  {idx + 1}
                </td>
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
        {departments.map((d: any, idx: number) => {
          const count = complaints.filter((c: any) => c.category === d.id).length;
          const isEditing = editingId === d.id;
          const deptSubs = subCategories.filter((s: any) => s.deptId === d.id);

          return (
            <div key={d.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm group flex flex-col relative">
              <div className="absolute top-4 left-4 text-[10px] font-mono text-muted/50">#{idx + 1}</div>
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

function AdminAreasView({ 
  areas, 
  newAreaName, setNewAreaName, 
  onAdd, onDelete, onUpdate,
  complaints 
}: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (area: any) => {
    setEditingId(area.id);
    setEditName(area.name);
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
        <h1 className="text-4xl font-serif">Manage Areas</h1>
        <p className="text-muted mt-1">Add or remove community areas for complaint categorization.</p>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
        <h3 className="font-bold">Add New Area</h3>
        <div className="flex flex-wrap gap-6 items-end">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold tracking-wide">Area Name</label>
            <input 
              type="text" 
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="e.g. Model Town"
            />
          </div>
          <button 
            onClick={onAdd}
            className="px-8 py-3.5 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
          >
            Add Area
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area: any, idx: number) => {
          const count = complaints.filter((c: any) => c.area === area.name).length;
          const isEditing = editingId === area.id;

          return (
            <div key={area.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm group flex flex-col relative">
              <div className="absolute top-4 left-4 text-[10px] font-mono text-muted/50">#{idx + 1}</div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center text-2xl">
                  <MapPin size={24} className="text-accent" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleStartEdit(area)}
                    className="p-2 text-muted hover:text-accent transition-colors"
                    title="Edit Area"
                  >
                    <ClipboardList size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(area.id)}
                    className="p-2 text-muted hover:text-rose-500 transition-colors"
                    title="Delete Area"
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
                <h3 className="font-bold text-ink mb-1">{area.name}</h3>
              )}

              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-muted font-medium uppercase tracking-wider">{count} complaints</span>
                <span className="text-[10px] font-mono text-muted bg-cream px-2 py-0.5 rounded">ID: {area.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InboxView({ notifications, onMarkRead, onDelete, onNavigate }: any) {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif">Inbox</h1>
          <p className="text-muted">Your notification activity and history.</p>
        </div>
      </div>

      <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4 opacity-20">📭</div>
            <h3 className="text-xl font-serif mb-2">Your inbox is empty</h3>
            <p className="text-muted">No notifications yet. Stay tuned!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n: any) => (
              <div 
                key={n.id} 
                className={`p-6 flex items-start gap-4 hover:bg-cream/30 transition-colors ${!n.readStatus ? 'bg-accent/5' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  !n.readStatus ? 'bg-accent text-white' : 'bg-cream text-muted'
                }`}>
                  {n.title.includes('Complaint') ? <ClipboardList size={20} /> : 
                   n.title.includes('Announcement') ? <Megaphone size={20} /> : 
                   <AlertCircle size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-bold truncate ${!n.readStatus ? 'text-ink' : 'text-muted'}`}>{n.title}</h4>
                    <span className="text-[10px] text-muted whitespace-nowrap ml-2">{new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted mb-4 line-clamp-2">{n.body}</p>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        onMarkRead(n.id);
                        const data = JSON.parse(n.data || '{}');
                        if (data.url) onNavigate(data.url);
                      }}
                      className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                    >
                      View Details <ArrowRight size={12} />
                    </button>
                    {!n.readStatus && (
                      <button 
                        onClick={() => onMarkRead(n.id)}
                        className="text-xs font-bold text-muted hover:text-ink"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button 
                      onClick={() => onDelete(n.id)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
        {announcements.map((a: any, idx: number) => (
          <div key={a.id} className="bg-ink p-8 rounded-3xl text-white relative overflow-hidden group">
            <div className="absolute top-4 left-4 text-[10px] font-mono text-white/30">#{idx + 1}</div>
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

function AdvancedAnalytics({ stats, complaints, users, error }: any) {
  if (error) return (
    <div className="p-12 text-center space-y-4">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle size={32} />
      </div>
      <h3 className="text-xl font-serif">Analytics Loading Failed</h3>
      <p className="text-muted max-w-md mx-auto">{error}</p>
    </div>
  );
  
  if (!stats) return (
    <div className="p-12 text-center space-y-4">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="text-muted">Loading advanced analytics data...</p>
      <p className="text-xs text-muted/50 italic">This may take a moment for large datasets</p>
    </div>
  );

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6'];

  const funnelData = [
    { name: 'Link Clicks', value: stats.funnel.link_clicked },
    { name: 'Page Views', value: stats.funnel.website_opened },
    { name: 'Registrations', value: Math.max(stats.funnel.registered, users.length) },
    { name: 'Complaints', value: Math.max(stats.funnel.complaint_submitted, complaints.length) },
    { name: 'Resolved', value: Math.max(stats.funnel.complaint_resolved, complaints.filter((c: any) => c.status === 'resolved').length) },
  ];

  const deviceData = stats.devices.map((d: any) => ({ name: d.device, value: d.count }));
  const sourceData = stats.sources.map((s: any) => ({ name: s.source, value: s.count }));
  
  // Calculate some smart insights
  const mostProblematicArea = complaints.length > 0 
    ? Object.entries(complaints.reduce((acc: any, c: any) => { acc[c.area] = (acc[c.area] || 0) + 1; return acc; }, {}))
        .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))[0]?.[0]
    : 'N/A';

  const peakHour = stats.peak_times.length > 0
    ? [...stats.peak_times].sort((a: any, b: any) => b.count - a.count)[0]?.hour
    : 'N/A';

  const conversionRate = stats.funnel.link_clicked > 0 
    ? ((stats.funnel.registered / stats.funnel.link_clicked) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-serif">Advanced Analytics</h1>
        <div className="text-xs text-muted font-bold uppercase tracking-widest">Real-time Data Dashboard</div>
      </div>

      {/* Smart Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-ink text-white rounded-3xl p-6 shadow-xl shadow-ink/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-yellow-400" />
            </div>
            <h3 className="font-bold">Smart Insight</h3>
          </div>
          <p className="text-white/80 text-sm mb-2">Most problematic area detected:</p>
          <div className="text-2xl font-serif text-accent">{mostProblematicArea}</div>
          <p className="text-white/40 text-[10px] mt-4 uppercase tracking-widest">Based on complaint volume</p>
        </div>

        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-accent" />
            </div>
            <h3 className="font-bold">Peak Usage</h3>
          </div>
          <p className="text-muted text-sm mb-2">Most active hour of the day:</p>
          <div className="text-2xl font-serif text-ink">
            {peakHour === 'N/A' ? 'N/A' : `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`}
          </div>
          <p className="text-muted text-[10px] mt-4 uppercase tracking-widest">Heatmap peak detected</p>
        </div>

        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <h3 className="font-bold">Conversion</h3>
          </div>
          <p className="text-muted text-sm mb-2">Link to Registration rate:</p>
          <div className="text-2xl font-serif text-ink">{conversionRate}%</div>
          <p className="text-muted text-[10px] mt-4 uppercase tracking-widest">Marketing efficiency</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Funnel */}
        <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-serif mb-6">User Journey Funnel</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#E63946" radius={[0, 10, 10, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 bg-background rounded-2xl border border-border">
              <div className="text-xs text-muted font-bold uppercase mb-1">Total Visitors</div>
              <div className="text-2xl font-serif">{stats.unique_visitors}</div>
            </div>
            <div className="p-4 bg-background rounded-2xl border border-border">
              <div className="text-xs text-muted font-bold uppercase mb-1">Total Events</div>
              <div className="text-2xl font-serif">{stats.total_events}</div>
            </div>
          </div>
        </div>

        {/* Device & Source Distribution */}
        <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-serif mb-6">Traffic Distribution</h3>
          <div className="grid grid-cols-2 h-[250px]">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-muted uppercase mb-2">Devices</span>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {deviceData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-muted uppercase mb-2">Sources</span>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {sourceData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {sourceData.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }}></div>
                  {s.name}
                </span>
                <span className="font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Usage Heatmap */}
      <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-serif mb-6">Hourly Activity Heatmap</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.peak_times}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E63946" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#E63946" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <YAxis hide />
              <Tooltip labelFormatter={(h) => `${h}:00`} />
              <Area type="monotone" dataKey="count" stroke="#E63946" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function EmergenciesAdmin({ user, emergencies, onUpdateStatus, onDelete, onReportEmergency, emergencyTypes, onAddType, onDeleteType, departments }: any) {
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [timeFilter, setTimeFilter] = useState<number>(24); // Default 24h
  
  // Form states for manual add
  const [mType, setMType] = useState(emergencyTypes[0]?.name || 'Electricity');
  const [mName, setMName] = useState('');
  const [mContact, setMContact] = useState('');
  const [mArea, setMArea] = useState('');
  const [mDesc, setMDesc] = useState('');

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDept, setNewTypeDept] = useState('');

  useEffect(() => {
    if (departments.length > 0 && !newTypeDept) {
      setNewTypeDept(departments[0].id);
    }
  }, [departments]);

  // Filter emergencies for officers
  const filteredByDept = emergencies.filter((e: any) => {
    if (user.role === 'admin') return true;
    const typeInfo = emergencyTypes.find((t: any) => t.name === e.type);
    return typeInfo?.deptId === user.dept;
  });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onReportEmergency(mType, {
      userName: mName,
      userContact: mContact,
      area: mArea,
      description: mDesc
    });
    setShowAddForm(false);
    // Reset form
    setMName('');
    setMContact('');
    setMArea('');
    setMDesc('');
  };

  // Stats
  const now = new Date();
  const filteredEmergencies = filteredByDept.filter((e: any) => {
    const eDate = new Date(e.timestamp);
    const diffHours = (now.getTime() - eDate.getTime()) / (1000 * 60 * 60);
    return diffHours <= timeFilter;
  });

  const total = filteredEmergencies.length;
  
  // Area Breakdown (Type-wise)
  const areaBreakdown = filteredEmergencies.reduce((acc: any, e: any) => {
    if (!acc[e.area]) acc[e.area] = {};
    acc[e.area][e.type] = (acc[e.area][e.type] || 0) + 1;
    return acc;
  }, {});

  const areaStats = Object.entries(areaBreakdown).sort((a: any, b: any) => {
    const sumA = Object.values(a[1] as any).reduce((s: any, v: any) => s + v, 0) as number;
    const sumB = Object.values(b[1] as any).reduce((s: any, v: any) => s + v, 0) as number;
    return sumB - sumA;
  });

  const typeStats = filteredEmergencies.reduce((acc: any, e: any) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, emergencyTypes.reduce((acc: any, t: any) => ({ ...acc, [t.name]: 0 }), {}));

  const maxTypeCount = Math.max(...Object.values(typeStats) as number[]) || 1;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif">Emergency Management</h1>
          <p className="text-muted">Real-time monitoring and officer forwarding.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowTypeManager(!showTypeManager)}
            className="px-4 py-2.5 bg-cream border border-border text-ink rounded-xl font-bold hover:bg-background transition-all flex items-center gap-2"
          >
            <Database size={18} />
            Types
          </button>
          <div className="flex bg-white border border-border rounded-xl p-1">
            {[1, 2, 5, 24].map(h => (
              <button
                key={h}
                onClick={() => setTimeFilter(h)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeFilter === h ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:text-ink'}`}
              >
                {h}H
              </button>
            ))}
          </div>
          <div className="flex bg-white border border-border rounded-xl p-1">
            <button 
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-accent text-white' : 'text-muted hover:bg-background'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-accent text-white' : 'text-muted hover:bg-background'}`}
            >
              <List size={18} />
            </button>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-2.5 bg-ink text-white rounded-xl font-bold hover:bg-ink/90 transition-all flex items-center gap-2"
          >
            {showAddForm ? <X size={18} /> : <Plus size={18} />}
            {showAddForm ? 'Cancel' : 'Add Emergency'}
          </button>
        </div>
      </div>

      {showTypeManager && (
        <div className="bg-white border border-border rounded-3xl p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif">Manage Emergency Types</h3>
            <button onClick={() => setShowTypeManager(false)} className="text-muted hover:text-ink"><X size={20} /></button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Enter new emergency type (e.g. Fire, Medical)"
              className="flex-1 px-4 py-3 bg-paper border border-border rounded-xl outline-none focus:border-accent"
            />
            <select
              value={newTypeDept}
              onChange={(e) => setNewTypeDept(e.target.value)}
              className="px-4 py-3 bg-paper border border-border rounded-xl outline-none focus:border-accent"
            >
              <option value="">Select Department</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button 
              onClick={() => {
                if (newTypeName.trim() && newTypeDept) {
                  onAddType(newTypeName.trim(), newTypeDept);
                  setNewTypeName('');
                } else if (!newTypeDept) {
                  alert('Please select a department');
                }
              }}
              className="px-8 py-3 bg-accent text-white rounded-xl font-bold"
            >
              Add Type
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {emergencyTypes.map((t: any) => {
              const dept = departments.find((d: any) => d.id === t.deptId);
              return (
                <div key={t.id} className="flex flex-col p-4 bg-cream rounded-2xl border border-border/50 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">{t.name}</span>
                    <button 
                      onClick={() => onDeleteType(t.id)}
                      className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-widest">
                    <Building2 size={12} />
                    {dept?.name || 'No Dept'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-600 text-white rounded-3xl p-6 shadow-xl shadow-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-60">Total Active ({timeFilter}H)</span>
          </div>
          <div className="text-4xl font-serif mb-1">{total}</div>
          <p className="text-white/60 text-sm">Incoming emergencies</p>
        </div>

        <div className="bg-white border border-border rounded-3xl p-6 shadow-sm col-span-1 md:col-span-2">
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-4">Area Breakdown (Type-wise)</h3>
          <div className="flex flex-wrap gap-3">
            {areaStats.length === 0 ? (
              <p className="text-muted text-sm italic">No data available for the last {timeFilter} hours</p>
            ) : (
              areaStats.map(([area, types]: any) => (
                <div key={area} className="px-4 py-3 bg-background border border-border rounded-2xl space-y-2 min-w-[140px]">
                  <div className="font-bold text-ink border-b border-border pb-1 mb-2">{area}</div>
                  <div className="space-y-1">
                    {Object.entries(types).map(([type, count]: any) => (
                      <div key={type} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted font-medium">{type}</span>
                        <span className="font-bold text-accent">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Poll-like Type Breakdown */}
      <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-serif mb-6">Emergency Distribution (Last {timeFilter}H)</h3>
        <div className="space-y-6">
          {Object.entries(typeStats).map(([type, count]: any) => {
            const percentage = Math.round((count / (total || 1)) * 100);
            const barWidth = (count / maxTypeCount) * 100;
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                      type === 'Electricity' ? 'bg-yellow-500' : type === 'Gas' ? 'bg-orange-500' : type === 'Water' ? 'bg-blue-500' : 'bg-accent'
                    }`}>
                      {type === 'Electricity' ? <Zap size={16} /> : type === 'Gas' ? <Flame size={16} /> : type === 'Water' ? <Droplets size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <span className="font-bold">{type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted">{count} Reports</span>
                    <span className="font-bold text-accent">{percentage}%</span>
                  </div>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden border border-border">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      type === 'Electricity' ? 'bg-yellow-500' : type === 'Gas' ? 'bg-orange-500' : type === 'Water' ? 'bg-blue-500' : 'bg-accent'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleManualAdd} className="bg-white border-2 border-accent rounded-3xl p-8 shadow-xl space-y-6">
              <h3 className="text-xl font-serif">Add Manual Emergency</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted">Emergency Type</label>
                  <select 
                    value={mType}
                    onChange={(e) => setMType(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-accent"
                  >
                    {emergencyTypes.map((t: any) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted">Resident Name</label>
                  <input 
                    type="text" 
                    required
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-accent"
                    placeholder="Enter name..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted">Contact Number</label>
                  <input 
                    type="text" 
                    required
                    value={mContact}
                    onChange={(e) => setMContact(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-accent"
                    placeholder="Enter contact..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-muted">Area / Location</label>
                  <input 
                    type="text" 
                    required
                    value={mArea}
                    onChange={(e) => setMArea(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-accent"
                    placeholder="Enter area..."
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-muted">Description</label>
                <textarea 
                  required
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:border-accent h-24"
                  placeholder="Describe the emergency..."
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
              >
                Submit Emergency Report
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List / Card View */}
      <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
        {filteredEmergencies.length === 0 ? (
          <div className="col-span-full bg-white border border-border rounded-3xl p-12 text-center">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-serif mb-2">No emergencies reported</h3>
            <p className="text-muted">System is clear. All quiet in Mozang.</p>
          </div>
        ) : (
          filteredEmergencies.map((e: any) => (
            <div key={e.id} className={`bg-white border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all ${viewMode === 'list' ? 'flex items-center justify-between gap-6' : ''}`}>
              <div className={`space-y-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                      e.type === 'Electricity' ? 'bg-yellow-500' : e.type === 'Gas' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {e.type === 'Electricity' ? <Zap size={20} /> : e.type === 'Gas' ? <Flame size={20} /> : <Droplets size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold">{e.type} Emergency</h3>
                      <p className="text-muted text-[10px] uppercase tracking-widest">{new Date(e.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    e.status === 'pending' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {e.status}
                  </div>
                </div>

                <div className={`grid gap-3 bg-background p-4 rounded-2xl border border-border ${viewMode === 'list' ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  <div className="flex items-center gap-2">
                    <UserIcon size={14} className="text-muted" />
                    <span className="text-xs font-bold truncate">{e.userName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-muted" />
                    <span className="text-xs font-bold">{e.userContact}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted" />
                    <span className="text-xs font-bold truncate">{e.area}</span>
                  </div>
                </div>

                <p className="text-sm text-ink italic line-clamp-2">"{e.description}"</p>
              </div>

              <div className={`flex gap-2 ${viewMode === 'list' ? 'flex-col min-w-[140px]' : 'mt-6'}`}>
                {e.status === 'pending' && (
                  <button 
                    onClick={() => onUpdateStatus(e.id, 'resolved')}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle size={16} /> Resolve
                  </button>
                )}
                <button 
                  onClick={() => {
                    const report = `EMERGENCY REPORT\nType: ${e.type}\nArea: ${e.area}\nResident: ${e.userName}\nContact: ${e.userContact}\nTime: ${new Date(e.timestamp).toLocaleString()}\nDescription: ${e.description}`;
                    navigator.clipboard.writeText(report);
                    // Using a simple alert since showToast isn't passed here
                    alert('Report copied to clipboard for sharing!');
                  }}
                  className="flex-1 py-3 bg-ink text-white rounded-xl font-bold hover:bg-ink/90 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Share2 size={16} /> Forward
                </button>
                {user.role === 'admin' && (
                  <button 
                    onClick={() => onDelete(e.id)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
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
              maxLength={200}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors"
              placeholder="Announcement title..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide">Message</label>
            <textarea 
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
              maxLength={3000}
              className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors min-h-[100px] resize-none"
              placeholder="Write the announcement..."
            />
            <div className="text-[10px] text-right text-muted">{annBody.length}/3000</div>
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
        {announcements.map((a: any, idx: number) => (
          <div key={a.id} className="bg-ink p-6 rounded-2xl text-white flex justify-between items-start gap-4 relative">
            <div className="absolute top-2 left-2 text-[8px] font-mono text-white/20">#{idx + 1}</div>
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

function ComplaintModal({ complaint, onClose, onUpdateStatus, onAddComment, onMarkAsRead, user, departments }: any) {
  const userRole = user.role;
  const canUpdate = userRole === 'admin' || (userRole === 'officer' && user.dept === complaint.category);
  const dept = departments.find((d: any) => d.id === complaint.category);
  const [comment, setComment] = useState('');
  const [showReasonPrompt, setShowReasonPrompt] = useState(false);
  const [closureReason, setClosureReason] = useState('');

  useEffect(() => {
    if (complaint && onMarkAsRead) {
      onMarkAsRead(complaint.id);
    }
  }, [complaint.id]);

  // Sequential commenting logic: anyone can comment anytime now
  const canComment = true;

  const handleSendComment = () => {
    if (!comment.trim()) return;
    onAddComment(complaint.id, comment);
    setComment('');
  };

  const handleUpdateStatus = (status: Status) => {
    if (status === 'closed-not-actionable') {
      setShowReasonPrompt(true);
    } else {
      onUpdateStatus(complaint.id, status);
    }
  };

  const submitClosure = () => {
    if (!closureReason.trim()) return;
    onUpdateStatus(complaint.id, 'closed-not-actionable', closureReason);
    setShowReasonPrompt(false);
    setClosureReason('');
  };

  const isClosed = complaint.status === 'resolved' || complaint.status === 'closed-not-actionable';

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
              <h2 className="text-2xl font-serif mt-1 font-bold">{complaint.description}</h2>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 bg-cream/30 p-6 rounded-2xl border border-border/50">
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Resident Name</div>
              <div className="text-sm font-bold flex items-center gap-2 text-accent"><UserIcon size={14} /> {complaint.resident}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Contact Phone</div>
              <div className="text-sm font-bold flex items-center gap-2 text-accent"><Phone size={14} /> {complaint.contact}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Date Submitted</div>
              <div className="text-sm font-medium flex items-center gap-2"><Calendar size={14} className="text-muted" /> {complaint.date}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Location</div>
              <div className="text-sm font-medium flex items-center gap-2"><MapPin size={14} className="text-muted" /> {complaint.address}</div>
            </div>
            {complaint.billReferenceNumber && (
              <div className="col-span-full pt-4 border-t border-border/50">
                <div className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Bill Reference Number</div>
                <div className="text-sm font-medium flex items-center gap-2"><ClipboardList size={14} className="text-muted" /> {complaint.billReferenceNumber}</div>
              </div>
            )}
          </div>

          {complaint.closureReason && (
            <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-2xl">
              <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2">Closure Reason (Not Actionable)</div>
              <p className="text-sm text-rose-900 font-medium italic">"{complaint.closureReason}"</p>
            </div>
          )}

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
                    <div className="text-[10px] font-mono text-muted flex items-center gap-2">
                      {t.time}
                      {t.authorId === user.id && (
                        <span className="flex items-center">
                          {t.readStatus === 'read' ? (
                            <CheckCheck size={12} className="text-blue-500" />
                          ) : (
                            <Check size={12} className="text-muted" />
                          )}
                        </span>
                      )}
                    </div>
                    {t.authorName && (
                      <div className="text-[10px] font-bold text-accent uppercase tracking-widest">{t.authorName}</div>
                    )}
                  </div>
                  <div className="text-sm font-medium">{t.text}</div>
                </div>
              ))}
            </div>
          </div>

          {!isClosed && (
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
            </div>
          )}
        </div>

        {canUpdate && !isClosed && (
          <div className="p-8 bg-cream border-t border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Update Status</h3>
            
            {showReasonPrompt ? (
              <div className="space-y-4">
                <div className="text-xs font-bold text-muted uppercase tracking-widest">Reason for closing (Mandatory)</div>
                <textarea 
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="Explain why this complaint is not actionable..."
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-accent h-24 resize-none"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={submitClosure}
                    disabled={!closureReason.trim()}
                    className="flex-1 py-3 bg-ink text-white rounded-xl text-xs font-bold hover:bg-accent transition-all disabled:opacity-50"
                  >
                    Confirm Closure
                  </button>
                  <button 
                    onClick={() => setShowReasonPrompt(false)}
                    className="px-6 py-3 bg-white border border-border text-muted rounded-xl text-xs font-bold hover:bg-cream transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <StatusButton 
                  active={complaint.status === 'pending'} 
                  onClick={() => handleUpdateStatus('pending')}
                  label="Pending"
                />
                <StatusButton 
                  active={complaint.status === 'in-progress'} 
                  onClick={() => handleUpdateStatus('in-progress')}
                  label="In Progress"
                />
                <StatusButton 
                  active={complaint.status === 'resolved'} 
                  onClick={() => handleUpdateStatus('resolved')}
                  label="Mark Resolved"
                  isSuccess
                />
                <StatusButton 
                  active={complaint.status === 'closed-not-actionable'} 
                  onClick={() => handleUpdateStatus('closed-not-actionable')}
                  label="Close (Not Actionable)"
                  isDanger
                />
                {userRole === 'admin' && (
                  <StatusButton 
                    active={complaint.status === 'rejected'} 
                    onClick={() => handleUpdateStatus('rejected')}
                    label="Reject"
                    isDanger
                  />
                )}
              </div>
            )}
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

function SubmitSuggestionForm({ newSuggestion, setNewSuggestion, onSubmit, onCancel, mySuggestions, onDelete }: any) {
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
            maxLength={1000}
            className="w-full px-4 py-3 bg-paper border border-border rounded-lg outline-none focus:border-accent transition-colors min-h-[200px] resize-none"
            placeholder="Describe your suggestion here..."
          />
          <div className="text-[10px] text-right text-muted">{newSuggestion.length}/1000</div>
        </div>
        <button 
          onClick={onSubmit}
          className="w-full py-4 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
        >
          Submit Suggestion
        </button>
      </div>

      {mySuggestions && mySuggestions.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif">My Suggestions</h2>
          <div className="space-y-4">
            {mySuggestions.map((s: any, idx: number) => (
              <div key={s.id} className="bg-white border border-border p-6 rounded-2xl flex justify-between items-start gap-4 shadow-sm group relative">
                <div className="absolute top-4 left-4 text-[10px] font-mono text-muted/50">#{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{s.date}</span>
                    {s.userContact && (
                      <>
                        <span className="text-[10px] text-muted">•</span>
                        <span className="text-[10px] text-muted flex items-center gap-1"><Phone size={10} /> {s.userContact}</span>
                      </>
                    )}
                    <span className="text-[10px] text-muted">•</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${s.status === 'acknowledged' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-ink leading-relaxed">{s.description}</p>
                </div>
                <button 
                  onClick={() => onDelete(s.id)}
                  className="p-2 text-muted hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SuggestionsList({ suggestions, onDelete, onAcknowledge, userRole }: any) {
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
          suggestions.map((s: any, idx: number) => (
            <div key={s.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex justify-between items-start gap-4 group relative">
              <div className="absolute top-4 left-4 text-[10px] font-mono text-muted/50">#{idx + 1}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{s.userName}</span>
                  {s.userContact && (
                    <>
                      <span className="text-[10px] text-muted">•</span>
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1"><Phone size={10} /> {s.userContact}</span>
                    </>
                  )}
                  <span className="text-[10px] text-muted">•</span>
                  <span className="text-[10px] text-muted">{s.date}</span>
                  <span className={`ml-2 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${s.status === 'acknowledged' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-ink leading-relaxed">{s.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {userRole === 'admin' && s.status === 'pending' && (
                  <button 
                    onClick={() => onAcknowledge(s.id)}
                    className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                <button 
                  onClick={() => onDelete(s.id)}
                  className="p-2 text-muted hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function InsightsView({ 
  user, 
  complaints, 
  departments, 
  users, 
  areas, 
  fromDate, toDate, setFromDate, setToDate 
}: any) {
  const role = user.role;
  const [timeScale, setTimeScale] = useState<'daily' | 'weekly' | 'monthly' | 'annually'>('weekly');
  
  // Filter complaints by date range and department (for officers)
  const filteredComplaints = complaints.filter((c: any) => {
    const inDateRange = (!fromDate || !toDate) || (c.date >= fromDate && c.date <= toDate);
    if (user.role === 'officer') {
      return inDateRange && String(c.category) === String(user.dept);
    }
    return inDateRange;
  });

  const isClosed = (c: any) => c.status === 'resolved' || c.status === 'closed-not-actionable';

  // Data processing
  const statusData = [
    { name: 'Pending', value: filteredComplaints.filter((c: any) => c.status === 'pending').length, color: '#f59e0b' },
    { name: 'In Progress', value: filteredComplaints.filter((c: any) => c.status === 'in-progress').length, color: '#3b82f6' },
    { name: 'Resolved', value: filteredComplaints.filter((c: any) => c.status === 'resolved').length, color: '#10b981' },
    { name: 'Closed (N/A)', value: filteredComplaints.filter((c: any) => c.status === 'closed-not-actionable').length, color: '#9ca3af' },
  ];

  const categoryData = departments.map((d: any) => ({
    name: d.name.split(' ')[0],
    count: filteredComplaints.filter((c: any) => c.category === d.id).length
  }));

  const priorityData = [
    { name: 'High', value: filteredComplaints.filter((c: any) => c.priority === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: filteredComplaints.filter((c: any) => c.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: filteredComplaints.filter((c: any) => c.priority === 'low').length, color: '#10b981' },
  ];

  // Real data for trends
  const getTrendData = () => {
    const counts: Record<string, { total: number, closed: number }> = {};
    
    filteredComplaints.forEach((c: any) => {
      let key = '';
      const d = new Date(c.date);
      if (timeScale === 'daily') {
        key = c.date;
      } else if (timeScale === 'weekly') {
        const firstDay = new Date(d.setDate(d.getDate() - d.getDay()));
        key = `Week of ${firstDay.toISOString().split('T')[0]}`;
      } else if (timeScale === 'monthly') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else if (timeScale === 'annually') {
        key = `${d.getFullYear()}`;
      }
      
      if (!counts[key]) counts[key] = { total: 0, closed: 0 };
      counts[key].total++;
      if (isClosed(c)) counts[key].closed++;
    });

    return Object.entries(counts)
      .map(([name, data]) => ({ name, complaints: data.total, closed: data.closed }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const trendData = getTrendData();

  const deptPerformance = departments
    .filter((d: any) => user.role !== 'officer' || String(d.id) === String(user.dept))
    .map((d: any) => {
      const total = filteredComplaints.filter((c: any) => String(c.category) === String(d.id)).length;
      const closed = filteredComplaints.filter((c: any) => String(c.category) === String(d.id) && isClosed(c)).length;
      return { name: d.name, count: total, closed };
    });

  // Area-wise Statistics
  const areaStats = areas.map((a: any) => {
    const area = a.name;
    const areaComplaints = filteredComplaints.filter((c: any) => c.area === area);
    const total = areaComplaints.length;
    const closed = areaComplaints.filter(isClosed).length;
    
    const categoryCounts: Record<string, number> = {};
    areaComplaints.forEach((c: any) => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });
    
    let topCategory = 'None';
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([catId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = departments.find((d: any) => d.id === catId)?.name || catId;
      }
    });

    return { area, total, closed, topCategory };
  }).filter((stat: any) => stat.total > 0).sort((a: any, b: any) => b.total - a.total);

  const areaChartData = areaStats.map((s: any) => ({
    name: s.area.length > 10 ? s.area.substring(0, 10) + '...' : s.area,
    count: s.total,
    fullName: s.area
  }));

  return (
    <div className="space-y-8">
      <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif">Community Insights</h1>
          <p className="text-muted mt-1">Comprehensive statistics and area-wise performance metrics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Filter Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 bg-paper border border-border rounded-lg text-xs font-medium outline-none focus:border-accent"
            />
            <span className="text-muted">to</span>
            <input 
              type="date" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 bg-paper border border-border rounded-lg text-xs font-medium outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Total Complaints</div>
          <div className="text-3xl font-serif text-ink">{filteredComplaints.length}</div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Closed (Total)</div>
          <div className="text-3xl font-serif text-emerald-600">{filteredComplaints.filter(isClosed).length}</div>
          <div className="text-[10px] text-muted mt-1">
            {filteredComplaints.filter((c: any) => c.status === 'resolved').length} Resolved / {filteredComplaints.filter((c: any) => c.status === 'closed-not-actionable').length} N/A
          </div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">In Progress</div>
          <div className="text-3xl font-serif text-blue-600">{filteredComplaints.filter((c: any) => c.status === 'in-progress').length}</div>
        </div>
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1">Pending</div>
          <div className="text-3xl font-serif text-amber-500">{filteredComplaints.filter((c: any) => c.status === 'pending').length}</div>
        </div>
      </div>

      <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
        <h3 className="text-xl font-serif mb-6 flex items-center gap-2 text-accent">
          <MapPin size={24} />
          Area-wise Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areaStats.map((stat: any, idx: number) => (
            <div key={idx} className="p-4 bg-cream rounded-xl border border-border/50">
              <div className="text-sm font-bold text-ink mb-1">{stat.area}</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-widest">Total / Closed</div>
                  <div className="text-2xl font-serif text-accent">{stat.total} <span className="text-sm text-muted">/ {stat.closed}</span></div>
                </div>
              </div>
            </div>
          ))}
          {areaStats.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted italic">
              No area-wise data available yet for this range.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-serif flex items-center gap-2">
              <TrendingUp size={20} className="text-accent" />
              Complaints Over Time
            </h3>
            <div className="flex bg-cream p-1 rounded-lg border border-border">
              {(['daily', 'weekly', 'monthly', 'annually'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTimeScale(s)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${timeScale === s ? 'bg-ink text-white shadow-sm' : 'text-muted hover:text-ink'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c8502a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#c8502a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="complaints" name="Total Complaints" stroke="#c8502a" fill="url(#colorTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="closed" name="Closed Issues" stroke="#10b981" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

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
            <BarChart3 size={20} className="text-accent" />
            Department Performance
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  interval={0} 
                  height={80} 
                  tick={{ fontSize: 10 }}
                />
                <YAxis />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Bar dataKey="count" name="Total Complaints" fill="#c8502a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="closed" name="Closed Issues" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemManagementView({ complaints, onBackup, onRestore }: any) {
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');

  const handleExport = () => {
    const filtered = complaints.filter((c: any) => {
      if (!exportFrom || !exportTo) return true;
      return c.date >= exportFrom && c.date <= exportTo;
    });

    const dataToExport = filtered.map((c: any) => ({
      ID: c.id,
      Date: c.date,
      Category: c.category,
      Subcategory: c.subcategory || 'N/A',
      Description: c.description,
      Status: c.status,
      Priority: c.priority,
      Resident: c.resident,
      Address: c.address,
      Contact: c.contact,
      Area: c.area || 'N/A',
      'Bill Ref': c.billReferenceNumber || 'N/A',
      'Closure Reason': c.closureReason || 'N/A'
    }));

    const fileName = `mozang_complaints_${new Date().toISOString().split('T')[0]}`;

    if (exportFormat === 'excel') {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Complaints");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } else {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.csv`);
      link.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="page-header">
        <h1 className="text-4xl font-serif">System Management</h1>
        <p className="text-muted mt-1">Backup, restore, and export portal data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Backup & Restore */}
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
          <h3 className="text-xl font-serif flex items-center gap-2 text-accent">
            <Database size={24} />
            Backup & Restore
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Download a complete backup of the system database before performing any major updates. 
            You can restore the system to a previous state by uploading a backup file.
          </p>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={onBackup}
              className="w-full py-4 bg-ink text-white rounded-xl font-bold hover:bg-accent transition-all flex items-center justify-center gap-3 shadow-lg shadow-ink/10"
            >
              <Download size={20} /> Download Full Backup
            </button>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onRestore(file);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <button className="w-full py-4 bg-white border-2 border-dashed border-border text-ink rounded-xl font-bold hover:bg-cream transition-all flex items-center justify-center gap-3">
                <Upload size={20} /> Restore from File
              </button>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm space-y-6">
          <h3 className="text-xl font-serif flex items-center gap-2 text-accent">
            <FileText size={24} />
            Data Export
          </h3>
          <p className="text-sm text-muted leading-relaxed">
            Export complaints data to Excel or CSV for offline reporting and analysis.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">From Date</label>
                <input 
                  type="date" 
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="w-full px-4 py-2 bg-cream border border-border rounded-xl text-sm outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-widest">To Date</label>
                <input 
                  type="date" 
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="w-full px-4 py-2 bg-cream border border-border rounded-xl text-sm outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest">Format</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setExportFormat('excel')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${exportFormat === 'excel' ? 'bg-accent text-white' : 'bg-cream text-muted hover:text-ink'}`}
                >
                  Excel (.xlsx)
                </button>
                <button 
                  onClick={() => setExportFormat('csv')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${exportFormat === 'csv' ? 'bg-accent text-white' : 'bg-cream text-muted hover:text-ink'}`}
                >
                  CSV (.csv)
                </button>
              </div>
            </div>

            <button 
              onClick={handleExport}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/10"
            >
              <Download size={20} /> Export Complaints
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
