
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export const SUBJECTS = [
  "English Paper-1",
  "English Paper-2",
  "2L Hindi / Telugu",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "History & Civics",
  "Geography",
  "Economics",
  "Environmental Science",
  "Computer Applications",
  "Commercial Applications",
  "Home Science",
  "Physical Education"
];

export const CLASSES = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
export const SECTIONS = ['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

export interface Task {
  id: string;
  userId: string; // Added for DB
  title: string;
  subject: string;
  dueDate: string; // ISO date string
  status: TaskStatus;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

export type PropertyType = 'text' | 'select' | 'multi_select' | 'url' | 'status';

export interface EventProperty {
  id: string;
  name: string;
  type: PropertyType;
  value: any; // String, array of strings, or option object
}

export interface CalendarEvent {
  id: string;
  title: string;
  // Core Time Properties
  time: string; // HH:MM format (Start Time)
  endTime?: string; // HH:MM format
  date?: string; // YYYY-MM-DD
  day?: string; // Mon, Tue, etc. (Legacy/Fallback)
  durationMinutes: number;
  
  // Metadata
  type: 'class' | 'study' | 'exam' | 'other';
  userId?: string; // 'all' or specific uid
  assignedBy?: 'user' | 'admin';
  startAt?: string; // ISO string for absolute time
  
  // Notion-Style & Recurrence Updates
  description?: string; // Rich text content
  coverImage?: string; 
  icon?: string;
  
  // Recurrence (Master Event Fields)
  isRecurring?: boolean;
  rrule?: string; // iCal format: FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU
  
  // Dynamic Properties
  properties?: EventProperty[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface Note {
  id: string;
  userId?: string; // Added for DB
  title: string;
  content: string;
  lastModified: string;
  subject: string;
  tags: string[];
  attachmentName?: string;
  attachmentType?: 'pdf' | 'image' | 'doc' | 'other';
  attachmentUrl?: string;
  classGrade?: string;
  section?: string;
  isOfficial?: boolean;
  createdAt?: any; // Firestore Timestamp
}

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar: string; // Color class or image url
  status: 'online' | 'offline' | 'busy' | 'away';
  friends?: string[]; // Array of user IDs
  school?: string;
  major?: string; // Subject stream
  class?: string;
  section?: string;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar?: string;
  toId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: any;
}

export interface DeveloperProfile {
  id: string;
  uid: string;
  name: string;
  role: string;
  specialization: string;
  apiKey?: string;
  accessLevel: number;
  lastLogin?: any;
}

export interface School {
  id: string;
  name: string;
  region: string;
  domain?: string;
  addedAt: any;
}

// --- SYLLABUS TYPES ---
export type TopicStatus = 'Todo' | 'In Progress' | 'Done' | 'Almost';

export interface SyllabusTopic {
  id: string;
  title: string;
  isCompleted: boolean; // Kept for legacy compatibility
  status: TopicStatus;
  doneInSchool: boolean;
  dueDate?: string; // ISO string
  notes?: string;
  timeSpent?: number;
}

export interface SyllabusSubject {
  id: string;
  userId: string;
  name: string;
  color?: string; // Hex code or tailwind class reference
  topics: SyllabusTopic[];
  progress: number; // Calculated percentage 0-100
}
