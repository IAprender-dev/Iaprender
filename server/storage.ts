// All table imports removed - will be reimplemented with new hierarchical structure

// Tipos para as novas tabelas
interface GradeCalculation {
  id: number;
  teacherId: number;
  title: string;
  subject?: string;
  schoolYear?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertGradeCalculation {
  teacherId: number;
  title: string;
  subject?: string;
  schoolYear?: string;
}

interface StudentGrade {
  id: number;
  calculationId: number;
  studentName: string;
  grade1?: number;
  grade2?: number;
  grade3?: number;
  average?: number;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertStudentGrade {
  calculationId: number;
  studentName: string;
  grade1?: number;
  grade2?: number;
  grade3?: number;
  average?: number;
  status?: string;
}

interface TeacherNotification {
  id: number;
  sequentialNumber: string;
  teacherId: number;
  notificationType: string;
  priority: string;
  studentName: string;
  subject: string;
  message: string;
  notificationDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertTeacherNotification {
  teacherId: number;
  notificationType: string;
  priority: string;
  studentName: string;
  subject: string;
  message: string;
  notificationDate: Date;
}
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  getCourse(id: number): Promise<Course | undefined>;
  getCoursesByAuthor(authorId: number): Promise<Course[]>;
  getAllCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  
  getModulesByCourse(courseId: number): Promise<CourseModule[]>;
  createModule(module: InsertModule): Promise<CourseModule>;
  
  getContentsByModule(moduleId: number): Promise<CourseContent[]>;
  createContent(content: InsertContent): Promise<CourseContent>;
  
  getUserCourses(userId: number): Promise<(UserCourse & { course: Course })[]>;
  enrollUserInCourse(userCourse: InsertUserCourse): Promise<UserCourse>;
  updateUserCourseProgress(userId: number, courseId: number, progress: number): Promise<UserCourse | undefined>;
  
  getActivitiesByCourse(courseId: number): Promise<Activity[]>;
  getUserActivities(userId: number): Promise<(UserActivity & { activity: Activity })[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  submitActivity(userActivity: InsertUserActivity): Promise<UserActivity>;
  
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  getLessonPlansByAuthor(authorId: number): Promise<LessonPlan[]>;
  createLessonPlan(lessonPlan: InsertLessonPlan): Promise<LessonPlan>;
  
  getAIMessagesByUser(userId: number): Promise<AIMessage[]>;
  createAIMessage(message: InsertAIMessage): Promise<AIMessage>;
  
  getUserCertificates(userId: number): Promise<(Certificate & { course: Course, user: User })[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  
  getSavedItemsByUser(userId: number): Promise<SavedItem[]>;
  createSavedItem(savedItem: InsertSavedItem): Promise<SavedItem>;
  deleteSavedItem(id: number, userId: number): Promise<boolean>;
  
  getStudyPlansByUser(userId: number): Promise<StudyPlan[]>;
  getActiveStudyPlan(userId: number): Promise<StudyPlan | undefined>;
  createStudyPlan(studyPlan: InsertStudyPlan): Promise<StudyPlan>;
  updateStudyPlan(id: number, studyPlan: Partial<StudyPlan>): Promise<StudyPlan | undefined>;
  deleteStudyPlan(id: number, userId: number): Promise<boolean>;
  
  getStudyScheduleByPlan(studyPlanId: number): Promise<StudySchedule[]>;
  getStudyScheduleByWeek(studyPlanId: number, startDate: Date, endDate: Date): Promise<StudySchedule[]>;
  createStudyScheduleItem(scheduleItem: InsertStudySchedule): Promise<StudySchedule>;
  updateStudyScheduleItem(id: number, scheduleItem: Partial<StudySchedule>): Promise<StudySchedule | undefined>;
  deleteStudyScheduleItem(id: number): Promise<boolean>;
  
  getExamsByUser(userId: number): Promise<Exam[]>;
  getUpcomingExams(userId: number): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number, userId: number): Promise<boolean>;
  
  // Grade Calculations
  getGradeCalculationsByTeacher(teacherId: number): Promise<GradeCalculation[]>;
  createGradeCalculation(calculation: InsertGradeCalculation): Promise<GradeCalculation>;
  getStudentGradesByCalculation(calculationId: number): Promise<StudentGrade[]>;
  saveStudentGrades(grades: InsertStudentGrade[]): Promise<StudentGrade[]>;
  
  // Teacher Notifications
  getTeacherNotifications(teacherId: number): Promise<TeacherNotification[]>;
  createTeacherNotification(notification: InsertTeacherNotification): Promise<TeacherNotification>;
  getNotificationHistory(teacherId: number, limit?: number): Promise<TeacherNotification[]>;
  
  // Secretary Functions
  getDashboardStats(): Promise<any>;
  getAllNotificationsForSecretary(): Promise<any[]>;
  getUsersForSecretary(filters?: any): Promise<User[]>;
  createUserBySecretary(userData: any): Promise<User>;
  updateUserBySecretary(id: number, userData: any): Promise<User | undefined>;
  deleteUserBySecretary(id: number): Promise<boolean>;
  approveUser(id: number, approvedBy: number): Promise<User | undefined>;
  getSatisfactionData(): Promise<any>;
}

export interface ITokenStorage {
  getTokenLimits(userId: number): Promise<any>;
  updateTokenLimits(userId: number, limits: any): Promise<any>;
  createTokenUsage(usage: any): Promise<any>;
  getTokenUsageHistory(userId: number, limit?: number): Promise<any[]>;
  getTokenUsageStats(userId: number): Promise<any>;
  getTokenAlerts(userId: number): Promise<any[]>;
  createTokenAlert(alert: any): Promise<any>;
  markAlertAsRead(alertId: number, userId: number): Promise<boolean>;
  getProviderRates(): Promise<any[]>;
  updateProviderRate(provider: string, model: string, rates: any): Promise<any>;
}

export class DatabaseStorage implements IStorage, ITokenStorage {
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
    try {
      console.log('Storage: Criando usuário com dados:', insertUser);
      
      const [user] = await db
        .insert(users)
        .values({
          ...insertUser,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      console.log('Storage: Usuário criado com sucesso:', user);
      return user;
    } catch (error) {
      console.error('Storage: Erro ao criar usuário:', error);
      throw error;
    }
  }

  async updateUser(id: number, userUpdate: Partial<User>): Promise<User | undefined> {
    try {
      console.log('Storage: Atualizando usuário com dados editados:', { id, userUpdate });
      
      // Primeiro, buscar dados atuais do usuário
      const currentUser = await this.getUser(id);
      if (!currentUser) {
        throw new Error(`Usuário com ID ${id} não encontrado`);
      }
      
      // Preparar dados para atualização - manter campos não editados
      const updateData = {
        firstName: userUpdate.firstName !== undefined ? userUpdate.firstName : currentUser.firstName,
        lastName: userUpdate.lastName !== undefined ? userUpdate.lastName : currentUser.lastName,
        email: userUpdate.email !== undefined ? userUpdate.email : currentUser.email,
        phone: userUpdate.phone !== undefined ? userUpdate.phone : currentUser.phone,
        address: userUpdate.address !== undefined ? userUpdate.address : currentUser.address,
        schoolYear: userUpdate.schoolYear !== undefined ? userUpdate.schoolYear : currentUser.schoolYear,
        dateOfBirth: userUpdate.dateOfBirth !== undefined ? userUpdate.dateOfBirth : currentUser.dateOfBirth,
        updatedAt: new Date()
      };
      
      console.log('Storage: Dados finais para atualização:', updateData);
      
      // Usar Drizzle ORM com trigger automático
      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning();
        
      console.log('Storage: Usuário atualizado via trigger:', user);
      
      if (!user) {
        console.warn('Storage: Nenhum usuário retornado após update');
        return undefined;
      }
      
      return user;
      
    } catch (error) {
      console.error('Storage: Erro ao atualizar usuário:', error);
      throw error;
    }
  }

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

  async getUserCourses(userId: number): Promise<(UserCourse & { course: Course })[]> {
    return await db
      .select()
      .from(userCourses)
      .leftJoin(courses, eq(userCourses.courseId, courses.id))
      .where(eq(userCourses.userId, userId)) as any;
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

  async getActivitiesByCourse(courseId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.courseId, courseId));
  }

  async getUserActivities(userId: number): Promise<(UserActivity & { activity: Activity })[]> {
    return await db
      .select()
      .from(userActivities)
      .leftJoin(activities, eq(userActivities.activityId, activities.id))
      .where(eq(userActivities.userId, userId)) as any;
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

  async getAIMessagesByUser(userId: number): Promise<AIMessage[]> {
    return await db.select().from(aiMessages).where(eq(aiMessages.userId, userId));
  }

  async createAIMessage(insertAIMessage: InsertAIMessage): Promise<AIMessage> {
    const [aiMessage] = await db
      .insert(aiMessages)
      .values(insertAIMessage)
      .returning();
    return aiMessage;
  }

  async getUserCertificates(userId: number): Promise<(Certificate & { course: Course, user: User })[]> {
    return await db
      .select()
      .from(certificates)
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .leftJoin(users, eq(certificates.userId, users.id))
      .where(eq(certificates.userId, userId)) as any;
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const [certificate] = await db
      .insert(certificates)
      .values(insertCertificate)
      .returning();
    return certificate;
  }

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
    return (result.rowCount || 0) > 0;
  }

  async getStudyPlansByUser(userId: number): Promise<StudyPlan[]> {
    return await db.select().from(studyPlans).where(eq(studyPlans.userId, userId));
  }

  async getActiveStudyPlan(userId: number): Promise<StudyPlan | undefined> {
    const [plan] = await db
      .select()
      .from(studyPlans)
      .where(and(eq(studyPlans.userId, userId), eq(studyPlans.status, 'active')));
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
    return (result.rowCount || 0) > 0;
  }

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
          gte(studySchedule.date, startDate),
          lte(studySchedule.date, endDate)
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
    return (result.rowCount || 0) > 0;
  }

  async getExamsByUser(userId: number): Promise<Exam[]> {
    return await db.select().from(exams).where(eq(exams.userId, userId));
  }

  async getUpcomingExams(userId: number): Promise<Exam[]> {
    const now = new Date();
    return await db
      .select()
      .from(exams)
      .where(and(eq(exams.userId, userId), gte(exams.examDate, now)));
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
    return (result.rowCount || 0) > 0;
  }

  // Token storage operations (simplified implementations)
  async getTokenLimits(userId: number): Promise<any> {
    return {
      monthlyLimit: 10000,
      dailyLimit: 500,
      warningThreshold: 80
    };
  }

  async updateTokenLimits(userId: number, limits: any): Promise<any> {
    return limits;
  }

  async createTokenUsage(usage: any): Promise<any> {
    return { id: Date.now(), ...usage };
  }

  async getTokenUsageHistory(userId: number, limit: number = 50): Promise<any[]> {
    return [];
  }

  async getTokenUsageStats(userId: number): Promise<any> {
    return {
      totalUsage: 0,
      dailyUsage: 0,
      weeklyUsage: 0,
      monthlyUsage: 0,
      averageDailyUsage: 0
    };
  }

  async getTokenAlerts(userId: number): Promise<any[]> {
    return [];
  }

  async createTokenAlert(alert: any): Promise<any> {
    return { id: Date.now(), ...alert };
  }

  async markAlertAsRead(alertId: number, userId: number): Promise<boolean> {
    return true;
  }

  async getProviderRates(): Promise<any[]> {
    return [];
  }

  async updateProviderRate(provider: string, model: string, rates: any): Promise<any> {
    return rates;
  }
}

export const storage = new DatabaseStorage();