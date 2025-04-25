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
  Certificate, InsertCertificate
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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private modules: Map<number, CourseModule>;
  private contents: Map<number, CourseContent>;
  private userCourses: Map<number, UserCourse>;
  private activities: Map<number, Activity>;
  private userActivities: Map<number, UserActivity>;
  private categories: Map<number, Category>;
  private lessonPlans: Map<number, LessonPlan>;
  private aiMessages: Map<number, AIMessage>;
  private certificates: Map<number, Certificate>;
  
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
    const user: User = { ...insertUser, id, createdAt: now };
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

export const storage = new MemStorage();
