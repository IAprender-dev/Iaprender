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

interface StudySession {
  id: number;
  subject: string;
  startTime: string;
  endTime: string;
  duration: number; // em minutos
  pomodoroSessions: number;
  isCompleted: boolean;
  priority: 'alta' | 'média' | 'baixa';
  description?: string;
}

interface TodayStudyScheduleProps {
  studyPlan?: any;
}

export default function TodayStudySchedule({ studyPlan }: TodayStudyScheduleProps) {
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
    generateTodaySessions();
  }, [studyPlan]);

  const generateTodaySessions = () => {
    if (!studyPlan) return;

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

    const todaySchedule = studyPlan.schedule?.find((s: any) => 
      s.day === dayMap[dayName] && s.enabled
    );

    if (!todaySchedule) {
      setTodaySessions([]);
      return;
    }

    // Simular sessões baseadas nas matérias do plano
    const enabledSubjects = studyPlan.subjects?.filter((s: any) => s.enabled) || [];
    const sessions: StudySession[] = [];
    
    let currentTime = todaySchedule.startTime;
    
    enabledSubjects.forEach((subject: any, index: number) => {
      if (index < 3) { // Máximo 3 sessões por dia
        const duration = 50; // 50 minutos por sessão (2 pomodoros)
        const pomodoroSessions = Math.ceil(duration / (studyPlan.pomodoroSettings?.studyDuration || 25));
        
        const session: StudySession = {
          id: index + 1,
          subject: subject.name,
          startTime: currentTime,
          endTime: addMinutes(currentTime, duration),
          duration,
          pomodoroSessions,
          isCompleted: false,
          priority: subject.priority,
          description: `Estudo focado em ${subject.name} - ${pomodoroSessions} pomodoros`
        };
        
        sessions.push(session);
        currentTime = addMinutes(session.endTime, 10); // 10 min de intervalo
      }
    });

    setTodaySessions(sessions);
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
    return todaySessions.reduce((total, session) => total + session.duration, 0);
  };

  const getCompletedTime = () => {
    return todaySessions
      .filter(s => s.isCompleted)
      .reduce((total, session) => total + session.duration, 0);
  };

  if (!studyPlan) {
    return (
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
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
      <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
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
      <Card className="border-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Hoje</h3>
              <p className="text-blue-100">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {getCompletedSessions()}/{todaySessions.length}
              </div>
              <p className="text-blue-100 text-sm">sessões</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do dia</span>
              <span>{getCompletedTime()}min / {getTotalStudyTime()}min</span>
            </div>
            <Progress 
              value={(getCompletedSessions() / todaySessions.length) * 100} 
              className="h-2 bg-blue-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Study Sessions */}
      <div className="space-y-4">
        {todaySessions.map((session) => (
          <Card 
            key={session.id} 
            className={`border transition-all ${
              session.isCompleted 
                ? 'bg-green-50 border-green-200' 
                : 'bg-white border-gray-200 hover:border-blue-300'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    session.isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {session.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Brain className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900">{session.subject}</h4>
                      <Badge className={getPriorityColor(session.priority)}>
                        {session.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Timer className="w-4 h-4" />
                        <span>{session.pomodoroSessions} pomodoros</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!session.isCompleted ? (
                    <Button 
                      onClick={() => startSession(session)}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" disabled>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Concluído
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
              studyDuration={studyPlan.pomodoroSettings?.studyDuration || 25}
              shortBreakDuration={studyPlan.pomodoroSettings?.shortBreak || 5}
              longBreakDuration={studyPlan.pomodoroSettings?.longBreak || 15}
              sessionsUntilLongBreak={studyPlan.pomodoroSettings?.sessionsUntilLongBreak || 4}
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