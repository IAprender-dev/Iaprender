export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  profileImage?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  rating: number;
  moduleCount: number;
  authorId: number;
  authorName: string;
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
}

export interface CourseModule {
  id: number;
  courseId: number;
  title: string;
  description: string;
  position: number;
}

export interface CourseContent {
  id: number;
  moduleId: number;
  title: string;
  type: 'video' | 'pdf' | 'quiz';
  contentUrl: string;
  duration?: number;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  courseId: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status: 'pending' | 'completed' | 'overdue';
  icon: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
}

export interface LessonPlan {
  id: number;
  title: string;
  subject: string;
  grade: string;
  objectives: string;
  content: string;
  activities: string;
  resources: string;
  assessment: string;
  createdAt: string;
  authorId: number;
}

export interface StudentPerformance {
  className: string;
  averageGrade: number;
  percentage: number;
}

export interface ScheduleEvent {
  id: number;
  title: string;
  description: string;
  time: string;
  date: string;
  location: string;
  status: 'upcoming' | 'active' | 'completed';
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface Certificate {
  id: number;
  userId: number;
  courseId: number;
  issueDate: string;
  courseTitle: string;
  userName: string;
}
