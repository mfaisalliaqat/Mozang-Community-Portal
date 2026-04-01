export type Role = 'resident' | 'officer' | 'admin';

export type Status = 'pending' | 'in-progress' | 'resolved' | 'rejected';

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

export interface Complaint {
  id: string;
  title: string;
  category: string;
  description: string;
  status: Status;
  priority: Priority;
  date: string;
  resident: string;
  residentId: string;
  area: string;
  timeline: TimelineItem[];
}

export interface TimelineItem {
  time: string;
  text: string;
}

export interface Announcement {
  id: string;
  tag: string;
  title: string;
  text: string;
  date: string;
}
