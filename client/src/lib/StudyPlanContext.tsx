import { createContext, ReactNode, useContext, useState, useEffect } from "react";

interface StudySession {
  id: number;
  subject: string;
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  pomodoroCount: number;
  notes?: string;
  dayOfWeek: string;
}

interface StudyPlan {
  id: number;
  name: string;
  schoolYear: string;
  dailyStudyTime: number;
  studyDays: string[];
  schedules: {
    [key: string]: { start: string; end: string };
  };
  sessions: StudySession[];
  createdAt: Date;
  isActive: boolean;
}

interface StudyPlanContextType {
  currentPlan: StudyPlan | null;
  setCurrentPlan: (plan: StudyPlan | null) => void;
  getWeekSessions: () => StudySession[];
  getTodaySessions: () => StudySession[];
  completeSession: (sessionId: number) => void;
  getCompletionStats: () => {
    completed: number;
    total: number;
    percentage: number;
  };
}

const StudyPlanContext = createContext<StudyPlanContextType | null>(null);

export function StudyPlanProvider({ children }: { children: ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);

  // Carregar plano salvo do localStorage ao inicializar
  useEffect(() => {
    const savedPlan = localStorage.getItem('iaulaStudyPlan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        // Converter strings de data de volta para objetos Date
        plan.createdAt = new Date(plan.createdAt);
        plan.sessions = plan.sessions.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime)
        }));
        setCurrentPlan(plan);
      } catch (error) {
        console.error('Erro ao carregar plano de estudos:', error);
        localStorage.removeItem('iaulaStudyPlan');
      }
    }
  }, []);

  // Salvar plano no localStorage sempre que mudar
  useEffect(() => {
    if (currentPlan) {
      localStorage.setItem('iaulaStudyPlan', JSON.stringify(currentPlan));
    } else {
      localStorage.removeItem('iaulaStudyPlan');
    }
  }, [currentPlan]);

  const getWeekSessions = () => {
    if (!currentPlan) return [];
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
    
    return currentPlan.sessions.filter(session => 
      session.startTime >= startOfWeek && session.startTime <= endOfWeek
    );
  };

  const getTodaySessions = () => {
    if (!currentPlan) return [];
    
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    return currentPlan.sessions.filter(session => 
      session.startTime >= startOfDay && session.startTime <= endOfDay
    );
  };

  const completeSession = (sessionId: number) => {
    if (!currentPlan) return;
    
    const updatedPlan = {
      ...currentPlan,
      sessions: currentPlan.sessions.map(session =>
        session.id === sessionId
          ? { ...session, isCompleted: true }
          : session
      )
    };
    
    setCurrentPlan(updatedPlan);
  };

  const getCompletionStats = () => {
    const weekSessions = getWeekSessions();
    const completed = weekSessions.filter(s => s.isCompleted).length;
    const total = weekSessions.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  return (
    <StudyPlanContext.Provider
      value={{
        currentPlan,
        setCurrentPlan,
        getWeekSessions,
        getTodaySessions,
        completeSession,
        getCompletionStats
      }}
    >
      {children}
    </StudyPlanContext.Provider>
  );
}

export function useStudyPlan() {
  const context = useContext(StudyPlanContext);
  if (!context) {
    throw new Error("useStudyPlan deve ser usado dentro de StudyPlanProvider");
  }
  return context;
}

export type { StudyPlan, StudySession };