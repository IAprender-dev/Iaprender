import {
  User, InsertUser,
  Course, InsertCourse,
  CourseModule, InsertModule,
  CourseContent, InsertContent,
  UserCourse, InsertUserCourse,
  Activity, InsertActivity,
  UserActivity, InsertUserActivity,
  Category, InsertCategory,
  LessonPlan, InsertLessonPlan,
  AIMessage, InsertAIMessage,
  Certificate, InsertCertificate,
  SavedItem, InsertSavedItem,
  StudyPlan, InsertStudyPlan,
  StudySchedule, InsertStudySchedule,
  Exam, InsertExam,
  UserTokenLimit, InsertUserTokenLimit,
  TokenUsageLog, InsertTokenUsageLog,
  TokenProviderRate, InsertTokenProviderRate
} from "@shared/schema";

// Storage interface definition
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByAuthor(authorId: number): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  
  // Course module operations
  getModulesByCourse(courseId: number): Promise<CourseModule[]>;
  createModule(module: InsertModule): Promise<CourseModule>;
  
  // Course content operations
  getContentsByModule(moduleId: number): Promise<CourseContent[]>;
  createContent(content: InsertContent): Promise<CourseContent>;
  
  // User course operations
  getUserCourses(userId: number): Promise<(UserCourse & { course: Course })[]>;
  enrollUserInCourse(userCourse: InsertUserCourse): Promise<UserCourse>;
  updateUserCourseProgress(userId: number, courseId: number, progress: number): Promise<UserCourse | undefined>;
  
  // Activity operations
  getActivitiesByCourse(courseId: number): Promise<Activity[]>;
  getUserActivities(userId: number): Promise<(UserActivity & { activity: Activity })[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  submitActivity(userActivity: InsertUserActivity): Promise<UserActivity>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Lesson plan operations
  getLessonPlansByAuthor(authorId: number): Promise<LessonPlan[]>;
  createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan>;
  
  // AI message operations
  getAIMessagesByUser(userId: number): Promise<AIMessage[]>;
  createAIMessage(message: InsertAIMessage): Promise<AIMessage>;
  
  // Certificate operations
  getUserCertificates(userId: number): Promise<(Certificate & { course: Course, user: User })[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  
  // Saved items operations
  getSavedItemsByUser(userId: number): Promise<SavedItem[]>;
  createSavedItem(savedItem: InsertSavedItem): Promise<SavedItem>;
  deleteSavedItem(id: number, userId: number): Promise<boolean>;
  
  // Study plan operations
  getStudyPlansByUser(userId: number): Promise<StudyPlan[]>;
  getActiveStudyPlan(userId: number): Promise<StudyPlan | undefined>;
  createStudyPlan(studyPlan: InsertStudyPlan): Promise<StudyPlan>;
  updateStudyPlan(id: number, studyPlan: Partial<StudyPlan>): Promise<StudyPlan | undefined>;
  deleteStudyPlan(id: number, userId: number): Promise<boolean>;
  
  // Study schedule operations
  getStudyScheduleByPlan(studyPlanId: number): Promise<StudySchedule[]>;
  getStudyScheduleByWeek(studyPlanId: number, startDate: Date, endDate: Date): Promise<StudySchedule[]>;
  createStudyScheduleItem(scheduleItem: InsertStudySchedule): Promise<StudySchedule>;
  updateStudyScheduleItem(id: number, scheduleItem: Partial<StudySchedule>): Promise<StudySchedule | undefined>;
  deleteStudyScheduleItem(id: number): Promise<boolean>;
  
  // Exam operations
  getExamsByUser(userId: number): Promise<Exam[]>;
  getUpcomingExams(userId: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number, userId: number): Promise<boolean>;
}

// In-memory storage implementation (deprecated - use DatabaseStorage)
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private courses: Map<number, Course> = new Map();
  private modules: Map<number, CourseModule> = new Map();
  private contents: Map<number, CourseContent> = new Map();
  private userCourses: Map<number, UserCourse> = new Map();
  private activities: Map<number, Activity> = new Map();
  private userActivities: Map<number, UserActivity> = new Map();
  private categories: Map<number, Category> = new Map();
  private lessonPlans: Map<number, LessonPlan> = new Map();
  private aiMessages: Map<number, AIMessage> = new Map();
  private certificates: Map<number, Certificate> = new Map();
  private savedItems: Map<number, SavedItem> = new Map();
  private studyPlans: Map<number, StudyPlan> = new Map();
  private studySchedule: Map<number, StudySchedule> = new Map();
  private exams: Map<number, Exam> = new Map();
  
  private currentIds: {
    users: number;
    courses: number;
    modules: number;
    contents: number;
    userCourses: number;
    activities: number;
    userActivities: number;
    categories: number;
    lessonPlans: number;
    aiMessages: number;
    certificates: number;
  };

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.modules = new Map();
    this.contents = new Map();
    this.userCourses = new Map();
    this.activities = new Map();
    this.userActivities = new Map();
    this.categories = new Map();
    this.lessonPlans = new Map();
    this.aiMessages = new Map();
    this.certificates = new Map();
    
    this.currentIds = {
      users: 1,
      courses: 1,
      modules: 1,
      contents: 1,
      userCourses: 1,
      activities: 1,
      userActivities: 1,
      categories: 1,
      lessonPlans: 1,
      aiMessages: 1,
      certificates: 1,
    };

    // Initialize with some categories
    this.seedCategories();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.users++;
    const now = new Date();
    
    const user: User = {
      id,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      email: insertUser.email,
      username: insertUser.username || insertUser.email.split('@')[0],
      password: insertUser.password,
      role: insertUser.role,
      status: insertUser.status || 'active',
      contractId: insertUser.contractId || null,
      createdAt: now
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCoursesByAuthor(authorId: number): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.authorId === authorId
    );
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.currentIds.courses++;
    const now = new Date();
    const course: Course = { ...insertCourse, id, createdAt: now };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(id: number, courseUpdate: Partial<Course>): Promise<Course | undefined> {
    const course = this.courses.get(id);
    if (!course) return undefined;
    
    const updatedCourse = { ...course, ...courseUpdate };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  // Course module operations
  async getModulesByCourse(courseId: number): Promise<CourseModule[]> {
    return Array.from(this.modules.values())
      .filter((module) => module.courseId === courseId)
      .sort((a, b) => a.position - b.position);
  }

  async createModule(insertModule: InsertModule): Promise<CourseModule> {
    const id = this.currentIds.modules++;
    const module: CourseModule = { ...insertModule, id };
    this.modules.set(id, module);
    return module;
  }

  // Course content operations
  async getContentsByModule(moduleId: number): Promise<CourseContent[]> {
    return Array.from(this.contents.values()).filter(
      (content) => content.moduleId === moduleId
    );
  }

  async createContent(insertContent: InsertContent): Promise<CourseContent> {
    const id = this.currentIds.contents++;
    const now = new Date();
    const content: CourseContent = { ...insertContent, id, createdAt: now };
    this.contents.set(id, content);
    return content;
  }

  // User course operations
  async getUserCourses(userId: number): Promise<(UserCourse & { course: Course })[]> {
    const userCourses = Array.from(this.userCourses.values()).filter(
      (userCourse) => userCourse.userId === userId
    );
    
    return userCourses.map(userCourse => {
      const course = this.courses.get(userCourse.courseId);
      return {
        ...userCourse,
        course: course!
      };
    }).filter(item => item.course); // Filter out any items where course is undefined
  }

  async enrollUserInCourse(insertUserCourse: InsertUserCourse): Promise<UserCourse> {
    const id = this.currentIds.userCourses++;
    const now = new Date();
    const userCourse: UserCourse = { 
      ...insertUserCourse, 
      id, 
      enrolledAt: now,
      completedAt: null 
    };
    this.userCourses.set(id, userCourse);
    return userCourse;
  }

  async updateUserCourseProgress(userId: number, courseId: number, progress: number): Promise<UserCourse | undefined> {
    const userCourse = Array.from(this.userCourses.values()).find(
      (uc) => uc.userId === userId && uc.courseId === courseId
    );
    
    if (!userCourse) return undefined;
    
    const updatedUserCourse: UserCourse = { 
      ...userCourse, 
      progress,
      status: progress === 100 ? 'completed' : 'in_progress',
      completedAt: progress === 100 ? new Date() : userCourse.completedAt
    };
    
    this.userCourses.set(userCourse.id, updatedUserCourse);
    return updatedUserCourse;
  }

  // Activity operations
  async getActivitiesByCourse(courseId: number): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(
      (activity) => activity.courseId === courseId
    );
  }

  async getUserActivities(userId: number): Promise<(UserActivity & { activity: Activity })[]> {
    const userActivities = Array.from(this.userActivities.values()).filter(
      (userActivity) => userActivity.userId === userId
    );
    
    return userActivities.map(userActivity => {
      const activity = this.activities.get(userActivity.activityId);
      return {
        ...userActivity,
        activity: activity!
      };
    }).filter(item => item.activity); // Filter out any items where activity is undefined
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentIds.activities++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, createdAt: now };
    this.activities.set(id, activity);
    return activity;
  }

  async submitActivity(insertUserActivity: InsertUserActivity): Promise<UserActivity> {
    const id = this.currentIds.userActivities++;
    const now = new Date();
    const userActivity: UserActivity = { 
      ...insertUserActivity, 
      id, 
      submittedAt: now
    };
    this.userActivities.set(id, userActivity);
    return userActivity;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentIds.categories++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  // Lesson plan operations
  async getLessonPlansByAuthor(authorId: number): Promise<LessonPlan[]> {
    return Array.from(this.lessonPlans.values()).filter(
      (lessonPlan) => lessonPlan.authorId === authorId
    );
  }

  async createLessonPlan(insertLessonPlan: InsertLessonPlan): Promise<LessonPlan> {
    const id = this.currentIds.lessonPlans++;
    const now = new Date();
    const lessonPlan: LessonPlan = { ...insertLessonPlan, id, createdAt: now };
    this.lessonPlans.set(id, lessonPlan);
    return lessonPlan;
  }

  // AI message operations
  async getAIMessagesByUser(userId: number): Promise<AIMessage[]> {
    return Array.from(this.aiMessages.values())
      .filter((message) => message.userId === userId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createAIMessage(insertAIMessage: InsertAIMessage): Promise<AIMessage> {
    const id = this.currentIds.aiMessages++;
    const now = new Date();
    const aiMessage: AIMessage = { ...insertAIMessage, id, timestamp: now };
    this.aiMessages.set(id, aiMessage);
    return aiMessage;
  }

  // Certificate operations
  async getUserCertificates(userId: number): Promise<(Certificate & { course: Course, user: User })[]> {
    const certificates = Array.from(this.certificates.values()).filter(
      (certificate) => certificate.userId === userId
    );
    
    return certificates.map(certificate => {
      const course = this.courses.get(certificate.courseId);
      const user = this.users.get(certificate.userId);
      return {
        ...certificate,
        course: course!,
        user: user!
      };
    }).filter(item => item.course && item.user); // Filter out items where course or user is undefined
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const id = this.currentIds.certificates++;
    const now = new Date();
    const certificate: Certificate = { ...insertCertificate, id, issueDate: now };
    this.certificates.set(id, certificate);
    return certificate;
  }

  // Seed initial categories
  private seedCategories() {
    const categories: InsertCategory[] = [
      { name: "Inteligência Artificial", icon: '<i class="fas fa-brain"></i>' },
      { name: "Matemática", icon: '<i class="fas fa-calculator"></i>' },
      { name: "Redação", icon: '<i class="fas fa-pen-fancy"></i>' },
      { name: "Ciências", icon: '<i class="fas fa-flask"></i>' },
      { name: "História", icon: '<i class="fas fa-landmark"></i>' },
      { name: "Idiomas", icon: '<i class="fas fa-language"></i>' }
    ];

    categories.forEach(category => {
      this.createCategory(category);
    });
  }
}


import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// Interface for token storage operations
export interface ITokenStorage {
  // Token limits operations
  getTokenLimits(userId: number): Promise<any>;
  updateTokenLimits(userId: number, limits: any): Promise<any>;
  
  // Token usage operations
  createTokenUsage(usage: any): Promise<any>;
  getTokenUsageHistory(userId: number, limit?: number): Promise<any[]>;
  getTokenUsageStats(userId: number): Promise<any>;
  
  // Token alerts operations
  getTokenAlerts(userId: number): Promise<any[]>;
  createTokenAlert(alert: any): Promise<any>;
  markAlertAsRead(alertId: number, userId: number): Promise<boolean>;
  
  // Token provider rates operations
  getProviderRates(): Promise<any[]>;
  updateProviderRate(provider: string, model: string, rates: any): Promise<any>;
}

export class DatabaseStorage implements IStorage, ITokenStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userUpdate)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getCoursesByAuthor(authorId: number): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.authorId, authorId));
  }

  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(insertCourse)
      .returning();
    return course;
  }

  async updateCourse(id: number, courseUpdate: Partial<Course>): Promise<Course | undefined> {
    const [course] = await db
      .update(courses)
      .set(courseUpdate)
      .where(eq(courses.id, id))
      .returning();
    return course || undefined;
  }

  // Course module operations
  async getModulesByCourse(courseId: number): Promise<CourseModule[]> {
    return await db.select().from(courseModules).where(eq(courseModules.courseId, courseId));
  }

  async createModule(insertModule: InsertModule): Promise<CourseModule> {
    const [module] = await db
      .insert(courseModules)
      .values(insertModule)
      .returning();
    return module;
  }

  // Course content operations
  async getContentsByModule(moduleId: number): Promise<CourseContent[]> {
    return await db.select().from(courseContents).where(eq(courseContents.moduleId, moduleId));
  }

  async createContent(insertContent: InsertContent): Promise<CourseContent> {
    const [content] = await db
      .insert(courseContents)
      .values(insertContent)
      .returning();
    return content;
  }

  // User course operations
  async getUserCourses(userId: number): Promise<(UserCourse & { course: Course })[]> {
    return await db
      .select()
      .from(userCourses)
      .leftJoin(courses, eq(userCourses.courseId, courses.id))
      .where(eq(userCourses.userId, userId))
      .then(rows => rows.map(row => ({
        ...row.user_courses,
        course: row.courses!
      })));
  }

  async enrollUserInCourse(insertUserCourse: InsertUserCourse): Promise<UserCourse> {
    const [userCourse] = await db
      .insert(userCourses)
      .values(insertUserCourse)
      .returning();
    return userCourse;
  }

  async updateUserCourseProgress(userId: number, courseId: number, progress: number): Promise<UserCourse | undefined> {
    const [userCourse] = await db
      .update(userCourses)
      .set({ progress })
      .where(and(eq(userCourses.userId, userId), eq(userCourses.courseId, courseId)))
      .returning();
    return userCourse || undefined;
  }

  // Activity operations
  async getActivitiesByCourse(courseId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.courseId, courseId));
  }

  async getUserActivities(userId: number): Promise<(UserActivity & { activity: Activity })[]> {
    return await db
      .select()
      .from(userActivities)
      .leftJoin(activities, eq(userActivities.activityId, activities.id))
      .where(eq(userActivities.userId, userId))
      .then(rows => rows.map(row => ({
        ...row.user_activities,
        activity: row.activities!
      })));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async submitActivity(insertUserActivity: InsertUserActivity): Promise<UserActivity> {
    const [userActivity] = await db
      .insert(userActivities)
      .values(insertUserActivity)
      .returning();
    return userActivity;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  // Lesson plan operations
  async getLessonPlansByAuthor(authorId: number): Promise<LessonPlan[]> {
    return await db.select().from(lessonPlans).where(eq(lessonPlans.authorId, authorId));
  }

  async createLessonPlan(insertLessonPlan: InsertLessonPlan): Promise<LessonPlan> {
    const [lessonPlan] = await db
      .insert(lessonPlans)
      .values(insertLessonPlan)
      .returning();
    return lessonPlan;
  }

  // AI message operations
  async getAIMessagesByUser(userId: number): Promise<AIMessage[]> {
    return await db.select().from(aiMessages).where(eq(aiMessages.userId, userId)).orderBy(desc(aiMessages.timestamp));
  }

  async createAIMessage(insertAIMessage: InsertAIMessage): Promise<AIMessage> {
    const [aiMessage] = await db
      .insert(aiMessages)
      .values(insertAIMessage)
      .returning();
    return aiMessage;
  }

  // Certificate operations
  async getUserCertificates(userId: number): Promise<(Certificate & { course: Course, user: User })[]> {
    return await db
      .select()
      .from(certificates)
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .leftJoin(users, eq(certificates.userId, users.id))
      .where(eq(certificates.userId, userId))
      .then(rows => rows.map(row => ({
        ...row.certificates,
        course: row.courses!,
        user: row.users!
      })));
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const [certificate] = await db
      .insert(certificates)
      .values(insertCertificate)
      .returning();
    return certificate;
  }

  // Saved items operations
  async getSavedItemsByUser(userId: number): Promise<SavedItem[]> {
    return await db.select().from(savedItems).where(eq(savedItems.userId, userId));
  }

  async createSavedItem(insertSavedItem: InsertSavedItem): Promise<SavedItem> {
    const [savedItem] = await db
      .insert(savedItems)
      .values(insertSavedItem)
      .returning();
    return savedItem;
  }

  async deleteSavedItem(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(savedItems)
      .where(and(eq(savedItems.id, id), eq(savedItems.userId, userId)));
    return result.rowCount > 0;
  }

  // Study plan operations
  async getStudyPlansByUser(userId: number): Promise<StudyPlan[]> {
    return await db.select().from(studyPlans).where(eq(studyPlans.userId, userId));
  }

  async getActiveStudyPlan(userId: number): Promise<StudyPlan | undefined> {
    const [plan] = await db
      .select()
      .from(studyPlans)
      .where(and(eq(studyPlans.userId, userId), eq(studyPlans.isActive, true)));
    return plan || undefined;
  }

  async createStudyPlan(insertStudyPlan: InsertStudyPlan): Promise<StudyPlan> {
    const [studyPlan] = await db
      .insert(studyPlans)
      .values(insertStudyPlan)
      .returning();
    return studyPlan;
  }

  async updateStudyPlan(id: number, studyPlanUpdate: Partial<StudyPlan>): Promise<StudyPlan | undefined> {
    const [studyPlan] = await db
      .update(studyPlans)
      .set(studyPlanUpdate)
      .where(eq(studyPlans.id, id))
      .returning();
    return studyPlan || undefined;
  }

  async deleteStudyPlan(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(studyPlans)
      .where(and(eq(studyPlans.id, id), eq(studyPlans.userId, userId)));
    return result.rowCount > 0;
  }

  // Study schedule operations
  async getStudyScheduleByPlan(studyPlanId: number): Promise<StudySchedule[]> {
    return await db.select().from(studySchedule).where(eq(studySchedule.studyPlanId, studyPlanId));
  }

  async getStudyScheduleByWeek(studyPlanId: number, startDate: Date, endDate: Date): Promise<StudySchedule[]> {
    return await db
      .select()
      .from(studySchedule)
      .where(
        and(
          eq(studySchedule.studyPlanId, studyPlanId),
          gte(studySchedule.scheduledDate, startDate),
          lte(studySchedule.scheduledDate, endDate)
        )
      );
  }

  async createStudyScheduleItem(insertStudySchedule: InsertStudySchedule): Promise<StudySchedule> {
    const [scheduleItem] = await db
      .insert(studySchedule)
      .values(insertStudySchedule)
      .returning();
    return scheduleItem;
  }

  async updateStudyScheduleItem(id: number, scheduleUpdate: Partial<StudySchedule>): Promise<StudySchedule | undefined> {
    const [scheduleItem] = await db
      .update(studySchedule)
      .set(scheduleUpdate)
      .where(eq(studySchedule.id, id))
      .returning();
    return scheduleItem || undefined;
  }

  async deleteStudyScheduleItem(id: number): Promise<boolean> {
    const result = await db
      .delete(studySchedule)
      .where(eq(studySchedule.id, id));
    return result.rowCount > 0;
  }

  // Exam operations
  async getExamsByUser(userId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.userId, userId));
  }

  async getUpcomingExams(userId: number): Promise<Exam[]> {
    return await db
      .select()
      .from(exams)
      .where(and(eq(exams.userId, userId), gte(exams.examDate, new Date())));
  }

  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db
      .insert(exams)
      .values(insertExam)
      .returning();
    return exam;
  }

  async updateExam(id: number, examUpdate: Partial<Exam>): Promise<Exam | undefined> {
    const [exam] = await db
      .update(exams)
      .set(examUpdate)
      .where(eq(exams.id, id))
      .returning();
    return exam || undefined;
  }

  async deleteExam(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(exams)
      .where(and(eq(exams.id, id), eq(exams.userId, userId)));
    return result.rowCount > 0;
  }

  // Token storage operations
  async getTokenLimits(userId: number): Promise<any> {
    const [limits] = await db.select().from(tokenLimits).where(eq(tokenLimits.userId, userId));
    return limits || {
      userId,
      monthlyTokenLimit: 50000,
      dailyTokenLimit: 2000,
      warningThreshold: 85,
      costThreshold: 100.00,
      resetDate: new Date()
    };
  }

  async updateTokenLimits(userId: number, limits: any): Promise<any> {
    const [updatedLimits] = await db
      .insert(tokenLimits)
      .values({ userId, ...limits })
      .onConflictDoUpdate({
        target: tokenLimits.userId,
        set: limits
      })
      .returning();
    return updatedLimits;
  }

  async createTokenUsage(usage: any): Promise<any> {
    const [tokenUsage] = await db
      .insert(tokenUsageHistory)
      .values(usage)
      .returning();
    return tokenUsage;
  }

  async getTokenUsageHistory(userId: number, limit: number = 50): Promise<any[]> {
    return await db
      .select()
      .from(tokenUsageHistory)
      .where(eq(tokenUsageHistory.userId, userId))
      .orderBy(desc(tokenUsageHistory.timestamp))
      .limit(limit);
  }

  async getTokenUsageStats(userId: number): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthlyUsage = await db
      .select()
      .from(tokenUsageHistory)
      .where(and(eq(tokenUsageHistory.userId, userId), gte(tokenUsageHistory.timestamp, startOfMonth)));

    const weeklyUsage = await db
      .select()
      .from(tokenUsageHistory)
      .where(and(eq(tokenUsageHistory.userId, userId), gte(tokenUsageHistory.timestamp, startOfWeek)));

    const dailyUsage = await db
      .select()
      .from(tokenUsageHistory)
      .where(and(eq(tokenUsageHistory.userId, userId), gte(tokenUsageHistory.timestamp, startOfDay)));

    return {
      monthlyUsage: monthlyUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0),
      weeklyUsage: weeklyUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0),
      dailyUsage: dailyUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0),
      totalUsage: monthlyUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0),
      averageDailyUsage: Math.round(monthlyUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0) / now.getDate())
    };
  }

  async getTokenAlerts(userId: number): Promise<any[]> {
    return await db
      .select()
      .from(tokenAlerts)
      .where(eq(tokenAlerts.userId, userId))
      .orderBy(desc(tokenAlerts.timestamp));
  }

  async createTokenAlert(alert: any): Promise<any> {
    const [tokenAlert] = await db
      .insert(tokenAlerts)
      .values(alert)
      .returning();
    return tokenAlert;
  }

  async markAlertAsRead(alertId: number, userId: number): Promise<boolean> {
    const result = await db
      .update(tokenAlerts)
      .set({ isRead: true })
      .where(and(eq(tokenAlerts.id, alertId), eq(tokenAlerts.userId, userId)));
    return result.rowCount > 0;
  }

  async getProviderRates(): Promise<any[]> {
    return await db.select().from(tokenProviderRates).where(eq(tokenProviderRates.isActive, true));
  }

  async updateProviderRate(provider: string, model: string, rates: any): Promise<any> {
    const [updatedRate] = await db
      .insert(tokenProviderRates)
      .values({ provider, model, ...rates })
      .onConflictDoUpdate({
        target: [tokenProviderRates.provider, tokenProviderRates.model],
        set: { ...rates, updatedAt: new Date() }
      })
      .returning();
    return updatedRate;
  }
}

export const storage = new DatabaseStorage();
