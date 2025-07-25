import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Play, 
  CheckCircle2, 
  Calendar, 
  Timer, 
  Coffee,
  Brain,
  Target,
  MoreHorizontal
} from "lucide-react";
import PomodoroTimer from "./PomodoroTimer";
import PomodoroScheduleDisplay from "./PomodoroScheduleDisplay";

interface StudySession {
  id: number;
  subject: string;
  startTime: string;
  endTime: string;
  studyTime: number; // em minutos
  breakTime: number; // em minutos
  longBreakTime: number; // em minutos
  cycles: number; // número de ciclos pomodoro
  isCompleted: boolean;
  priority: 'alta' | 'média' | 'baixa';
}

interface TodayStudyScheduleProps {
  studyPlan?: any;
}

export default function TodayStudySchedule({ studyPlan }: TodayStudyScheduleProps) {
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    if (!studyPlan) {
      // Try to load from localStorage if no prop provided
      const savedPlan = localStorage.getItem('iaulaStudyPlan');
      if (savedPlan) {
        try {
          const plan = JSON.parse(savedPlan);
          generateTodaySessions(plan);
        } catch (error) {
          console.error('Erro ao carregar plano de estudos:', error);
        }
      }
    } else {
      generateTodaySessions(studyPlan);
    }
  }, [studyPlan]);

  const generateTodaySessions = (plan?: any) => {
    const activePlan = plan || studyPlan;
    if (!activePlan) return;

    const today = new Date();
    const dayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayMap: Record<string, string> = {
      'segunda-feira': 'Segunda',
      'terça-feira': 'Terça',
      'quarta-feira': 'Quarta',
      'quinta-feira': 'Quinta',
      'sexta-feira': 'Sexta',
      'sábado': 'Sábado',
      'domingo': 'Domingo'
    };

    const targetDay = dayMap[dayName];

    // Use pre-generated sessions from the plan if available
    if (activePlan.sessions && activePlan.sessions.length > 0) {
      const todaySessions = activePlan.sessions.filter((session: any) => {
        if (session.dayOfWeek === targetDay) {
          return true;
        }
        // Also check by date
        const sessionDate = new Date(session.startTime);
        const todayDate = new Date();
        return sessionDate.toDateString() === todayDate.toDateString();
      });

      // Convert sessions to the expected format
      const formattedSessions = todaySessions.map((session: any, index: number) => ({
        id: session.id || index + 1,
        subject: session.subject,
        studyTime: activePlan.pomodoroSettings?.studyDuration || 25,
        breakTime: activePlan.pomodoroSettings?.shortBreak || 5,
        longBreakTime: activePlan.pomodoroSettings?.longBreak || 15,
        cycles: session.pomodoroCount || 1,
        startTime: new Date(session.startTime).toTimeString().slice(0, 5),
        endTime: new Date(session.endTime).toTimeString().slice(0, 5),
        isCompleted: session.isCompleted || false,
        priority: activePlan.subjects?.find((s: any) => s.name === session.subject)?.priority || 'média'
      }));

      setTodaySessions(formattedSessions);
      return;
    }

    // Fallback: check if there's a schedule for today
    const todaySchedule = activePlan.schedule?.find((s: any) => 
      s.day === targetDay && s.enabled
    );

    if (!todaySchedule) {
      setTodaySessions([]);
      return;
    }

    setTodaySessions([]);
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    return date.toTimeString().slice(0, 5);
  };

  const completeSession = (sessionId: number) => {
    setTodaySessions(prev => 
      prev.map(session => 
        session.id === sessionId 
          ? { ...session, isCompleted: true }
          : session
      )
    );
  };

  const startSession = (session: StudySession) => {
    setCurrentSession(session);
    setShowTimer(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'média': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'baixa': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCompletedSessions = () => {
    return todaySessions.filter(s => s.isCompleted).length;
  };

  const getTotalStudyTime = () => {
    return todaySessions.reduce((total, session) => total + (session.cycles * session.studyTime), 0);
  };

  const getCompletedTime = () => {
    return todaySessions
      .filter(s => s.isCompleted)
      .reduce((total, session) => total + (session.cycles * session.studyTime), 0);
  };

  // Check if we have a study plan (from prop or localStorage)
  const hasActivePlan = studyPlan || localStorage.getItem('iaulaStudyPlan');
  
  if (!hasActivePlan) {
    return (
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="text-center py-8">
          <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <CardTitle className="text-xl text-gray-900">Nenhum plano ativo</CardTitle>
          <p className="text-gray-600">Crie um plano de estudos para ver sua agenda de hoje</p>
        </CardHeader>
      </Card>
    );
  }

  if (todaySessions.length === 0) {
    return (
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="text-center py-8">
          <Coffee className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-xl text-gray-900">Dia livre!</CardTitle>
          <p className="text-gray-600">Não há sessões de estudo programadas para hoje</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Hoje</h3>
              <p className="text-gray-600">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {getCompletedSessions()}/{todaySessions.length}
              </div>
              <p className="text-gray-500 text-sm">sessões</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-700">
              <span>Progresso do dia</span>
              <span>{getCompletedTime()}min / {getTotalStudyTime()}min</span>
            </div>
            <Progress 
              value={(getCompletedSessions() / todaySessions.length) * 100} 
              className="h-3 bg-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pomodoro Sessions */}
      <PomodoroScheduleDisplay 
        sessions={todaySessions}
        onStartSession={(sessionId) => {
          const session = todaySessions.find(s => s.id === sessionId);
          if (session) {
            startSession(session);
          }
        }}
      />

      {/* Pomodoro Timer Modal */}
      {showTimer && currentSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Sessão de Estudo</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowTimer(false)}
              >
                ✕
              </Button>
            </div>
            
            <PomodoroTimer
              studyDuration={(studyPlan || JSON.parse(localStorage.getItem('iaulaStudyPlan') || '{}'))?.pomodoroSettings?.studyDuration || 25}
              shortBreakDuration={(studyPlan || JSON.parse(localStorage.getItem('iaulaStudyPlan') || '{}'))?.pomodoroSettings?.shortBreak || 5}
              longBreakDuration={(studyPlan || JSON.parse(localStorage.getItem('iaulaStudyPlan') || '{}'))?.pomodoroSettings?.longBreak || 15}
              sessionsUntilLongBreak={(studyPlan || JSON.parse(localStorage.getItem('iaulaStudyPlan') || '{}'))?.pomodoroSettings?.sessionsUntilLongBreak || 4}
              subject={currentSession.subject}
              onSessionComplete={(type) => {
                if (type === 'study') {
                  // Considerar como progresso na sessão atual
                  console.log('Pomodoro de estudo completado');
                }
              }}
            />
            
            <div className="mt-6 flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowTimer(false)}
                className="flex-1"
              >
                Pausar Sessão
              </Button>
              <Button 
                onClick={() => {
                  completeSession(currentSession.id);
                  setShowTimer(false);
                  setCurrentSession(null);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Concluir Sessão
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}