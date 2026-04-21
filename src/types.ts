export type Role = 'resident' | 'officer' | 'admin';

export type Status = 'pending' | 'in-progress' | 'resolved' | 'rejected' | 'closed-not-actionable';

export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // For this prototype
  role: Role;
  avatar: string;
  color: string;
  dept?: string;
  deptName?: string;
  address?: string;
  contact?: string;
  area?: string;
}

export interface Department {
  id: string;
  name: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  deptId: string;
}

export interface SubCategory {
  id: string;
  deptId: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
}

export interface Complaint {
  id: string;
  category: string;
  subcategory?: string;
  description: string;
  status: Status;
  priority: Priority;
  date: string;
  resident: string;
  residentId: string;
  address: string;
  contact: string;
  area?: string;
  locationDetails?: string;
  billReferenceNumber?: string;
  gpsAddress?: string;
  lat?: number;
  lng?: number;
  timeline: TimelineItem[];
}

export interface TimelineItem {
  time: string;
  text: string;
  authorId?: string;
  authorName?: string;
  readStatus?: number; // 0 for sent, 1 for read
}

export interface EmergencyType {
  id: string;
  name: string;
  icon: string;
}

export interface Emergency {
  id: string;
  userId: string;
  userName: string;
  userContact: string;
  area: string;
  type: string;
  description?: string;
  status: 'pending' | 'resolved';
  timestamp: string;
  lat?: number;
  lng?: number;
}

export interface Announcement {
  id: string;
  tag: string;
  title: string;
  text: string;
  date: string;
}

export interface Suggestion {
  id: string;
  userId: string;
  userName: string;
  userContact?: string;
  description: string;
  date: string;
  status: 'pending' | 'acknowledged';
}

export interface BloodRequest {
  id: string;
  userId: string;
  userName: string;
  bloodGroup: string;
  contactNumber: string;
  hospital: string;
  urgency: 'Normal' | 'Urgent' | 'Critical';
  notes?: string;
  status: 'active' | 'closed' | 'expired';
  timestamp: string;
}

export interface JoinRequest {
  id: string;
  name: string;
  contact: string;
  address: string;
  status: 'pending' | 'processed';
  timestamp: string;
}
