import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Target, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle,
  Lightbulb,
  Brain,
  Timer,
  ArrowLeft,
  TrendingUp,
  Award,
  Coffee,
  Zap,
  Star,
  Users,
  BookMarked
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

// Grade curricular por ano baseada na BNCC
const BNCC_CURRICULUM = {
  "6º ano": {
    subjects: [
      { name: "Língua Portuguesa", weeklyHours: 5, priority: "high" },
      { name: "Matemática", weeklyHours: 5, priority: "high" },
      { name: "História", weeklyHours: 3, priority: "medium" },
      { name: "Geografia", weeklyHours: 3, priority: "medium" },
      { name: "Ciências", weeklyHours: 4, priority: "medium" },
      { name: "Inglês", weeklyHours: 2, priority: "medium" },
      { name: "Educação Física", weeklyHours: 2, priority: "low" },
      { name: "Arte", weeklyHours: 2, priority: "low" }
    ]
  },
  "7º ano": {
    subjects: [
      { name: "Língua Portuguesa", weeklyHours: 5, priority: "high" },
      { name: "Matemática", weeklyHours: 5, priority: "high" },
      { name: "História", weeklyHours: 3, priority: "medium" },
      { name: "Geografia", weeklyHours: 3, priority: "medium" },
      { name: "Ciências", weeklyHours: 4, priority: "medium" },
      { name: "Inglês", weeklyHours: 2, priority: "medium" },
      { name: "Educação Física", weeklyHours: 2, priority: "low" },
      { name: "Arte", weeklyHours: 2, priority: "low" }
    ]
  },
  "8º ano": {
    subjects: [
      { name: "Língua Portuguesa", weeklyHours: 5, priority: "high" },
      { name: "Matemática", weeklyHours: 5, priority: "high" },
      { name: "História", weeklyHours: 3, priority: "medium" },
      { name: "Geografia", weeklyHours: 3, priority: "medium" },
      { name: "Ciências", weeklyHours: 4, priority: "medium" },
      { name: "Inglês", weeklyHours: 2, priority: "medium" },
      { name: "Educação Física", weeklyHours: 2, priority: "low" },
      { name: "Arte", weeklyHours: 2, priority: "low" }
    ]
  },
  "9º ano": {
    subjects: [
      { name: "Língua Portuguesa", weeklyHours: 5, priority: "high" },
      { name: "Matemática", weeklyHours: 5, priority: "high" },
      { name: "História", weeklyHours: 3, priority: "medium" },
      { name: "Geografia", weeklyHours: 3, priority: "medium" },
      { name: "Ciências", weeklyHours: 4, priority: "medium" },
      { name: "Inglês", weeklyHours: 2, priority: "medium" },
      { name: "Educação Física", weeklyHours: 2, priority: "low" },
      { name: "Arte", weeklyHours: 2, priority: "low" }
    ]
  },
  "1º ano": {
    subjects: [
      { name: "Língua Portuguesa", weeklyHours: 4, priority: "high" },
      { name: "Matemática", weeklyHours: 4, priority: "high" },
      { name: "Física", weeklyHours: 3, priority: "high" },
      { name: "Química", weeklyHours: 3, priority: "high" },
      { name: "Biologia", weeklyHours: 3, priority: "high" },
      { name: "História", weeklyHours: 2, priority: "medium" },
      { name: "Geografia", weeklyHours: 2, priority: "medium" },
      { name: "Filosofia", weeklyHours: 2, priority: "medium" },
      { name: "Sociologia", weeklyHours: 2, priority: "medium" },
      { name: "Inglês", weeklyHours: 2, priority: "medium" },
      { name: "Educação Física", weeklyHours: 2, priority: "low" },
      { name: "Arte", weeklyHours: 1, priority: "low" }
    ]
  },
  "2º ano": {
    subjects: [
      { name: "Língua Portuguesa", weeklyHours: 4, priority: "high" },
      { name: "Matemática", weeklyHours: 4, priority: "high" },
      { name: "Física", weeklyHours: 3, priority: "high" },
      { name: "Química", weeklyHours: 3, priority: "high" },
      { name: "Biologia", weeklyHours: 3, priority: "high" },
      { name: "História", weeklyHours: 2, priority: "medium" },
      { name: "Geografia", weeklyHours: 2, priority: "medium" },
      { name: "Filosofia", weeklyHours: 2, priority: "medium" },
      { name: "Sociologia", weeklyHours: 2, priority: "medium" },
      { name: "Inglês", weeklyHours: 2, priority: "medium" },
      { name: "Educação Física", weeklyHours: 2, priority: "low" },
      { name: "Arte", weeklyHours: 1, priority: "low" }
    ]
  },
  "3º ano": {
    subjects: [
      { name: "Língua Portuguesa", weeklyHours: 4, priority: "high" },
      { name: "Matemática", weeklyHours: 4, priority: "high" },
      { name: "Física", weeklyHours: 3, priority: "high" },
      { name: "Química", weeklyHours: 3, priority: "high" },
      { name: "Biologia", weeklyHours: 3, priority: "high" },
      { name: "História", weeklyHours: 2, priority: "medium" },
      { name: "Geografia", weeklyHours: 2, priority: "medium" },
      { name: "Filosofia", weeklyHours: 2, priority: "medium" },
      { name: "Sociologia", weeklyHours: 2, priority: "medium" },
      { name: "Inglês", weeklyHours: 2, priority: "medium" },
      { name: "Educação Física", weeklyHours: 2, priority: "low" },
      { name: "Arte", weeklyHours: 1, priority: "low" }
    ]
  }
};

const WEEK_DAYS = [
  { key: "monday", label: "Segunda-feira", index: 1 },
  { key: "tuesday", label: "Terça-feira", index: 2 },
  { key: "wednesday", label: "Quarta-feira", index: 3 },
  { key: "thursday", label: "Quinta-feira", index: 4 },
  { key: "friday", label: "Sexta-feira", index: 5 },
  { key: "saturday", label: "Sábado", index: 6 },
  { key: "sunday", label: "Domingo", index: 0 }
];

interface StudySession {
  id: number;
  subject: string;
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  pomodoroCount: number;
  dayOfWeek: string;
}

interface StudyPlan {
  id: number;
  name: string;
  schoolYear: string;
  dailyStudyTime: number;
  studyDays: string[];
  schedules: { [key: string]: { start: string } };
  sessions: StudySession[];
  createdAt: Date;
  isActive: boolean;
}

export default function StudyPlanning() {
  const { user } = useAuth();
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [planForm, setPlanForm] = useState({
    dailyStudyTime: 2,
    studyDays: [] as string[],
    schedules: {
      monday: { start: "19:00" },
      tuesday: { start: "19:00" },
      wednesday: { start: "19:00" },
      thursday: { start: "19:00" },
      friday: { start: "19:00" },
      saturday: { start: "14:00" },
      sunday: { start: "14:00" }
    } as Record<string, { start: string }>
  });

  const schoolYear = (user as any)?.schoolYear || "1º ano";
  const curriculum = BNCC_CURRICULUM[schoolYear as keyof typeof BNCC_CURRICULUM];

  // Scroll to top animation on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Carregar plano salvo
  useEffect(() => {
    const savedPlan = localStorage.getItem('iaulaStudyPlan');
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan);
        plan.createdAt = new Date(plan.createdAt);
        plan.sessions = plan.sessions.map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime)
        }));
        setStudyPlan(plan);
      } catch (error) {
        console.error('Erro ao carregar plano:', error);
        localStorage.removeItem('iaulaStudyPlan');
      }
    }
  }, []);

  const createNewPlan = () => {
    if (planForm.studyDays.length === 0) {
      alert("Selecione pelo menos um dia da semana para estudar.");
      return;
    }

    const sessions: StudySession[] = [];
    const startDate = new Date();
    
    const highPrioritySubjects = curriculum.subjects.filter(s => s.priority === "high");
    const mediumPrioritySubjects = curriculum.subjects.filter(s => s.priority === "medium");
    const lowPrioritySubjects = curriculum.subjects.filter(s => s.priority === "low");
    
    // Gerar 8 semanas (bimestre)
    for (let week = 0; week < 8; week++) {
      planForm.studyDays.forEach((dayKey, dayIndex) => {
        const dayInfo = WEEK_DAYS.find(d => d.key === dayKey);
        if (!dayInfo) return;
        
        const sessionDate = new Date(startDate);
        sessionDate.setDate(startDate.getDate() + (week * 7) + (dayInfo.index - startDate.getDay()));
        
        if (sessionDate < new Date()) {
          sessionDate.setDate(sessionDate.getDate() + 7);
        }
        
        const schedule = planForm.schedules[dayKey];
        const [startHour, startMinute] = schedule.start.split(':').map(Number);
        
        sessionDate.setHours(startHour, startMinute, 0, 0);
        
        // Calcular fim baseado na técnica Pomodoro
        const totalStudyMinutes = planForm.dailyStudyTime * 60;
        const pomodoroCount = Math.ceil(totalStudyMinutes / 25);
        const shortBreaks = Math.max(0, pomodoroCount - 1) * 5;
        const longBreaks = Math.floor(pomodoroCount / 4) * 15;
        const totalDuration = totalStudyMinutes + shortBreaks + longBreaks;
        
        const endTime = new Date(sessionDate.getTime() + totalDuration * 60 * 1000);
        
        // Selecionar matéria por prioridade
        let selectedSubject;
        const sessionIndex = week * planForm.studyDays.length + dayIndex;
        
        if (sessionIndex % 3 === 0 && highPrioritySubjects.length > 0) {
          selectedSubject = highPrioritySubjects[sessionIndex % highPrioritySubjects.length];
        } else if (sessionIndex % 3 === 1 && mediumPrioritySubjects.length > 0) {
          selectedSubject = mediumPrioritySubjects[sessionIndex % mediumPrioritySubjects.length];
        } else if (lowPrioritySubjects.length > 0) {
          selectedSubject = lowPrioritySubjects[sessionIndex % lowPrioritySubjects.length];
        } else {
          selectedSubject = curriculum.subjects[sessionIndex % curriculum.subjects.length];
        }
        
        const session: StudySession = {
          id: Date.now() + sessions.length + Math.random(),
          subject: selectedSubject.name,
          startTime: new Date(sessionDate),
          endTime: new Date(endTime),
          isCompleted: false,
          pomodoroCount: Math.max(1, pomodoroCount),
          dayOfWeek: dayKey
        };
        
        sessions.push(session);
      });
    }
    
    const newPlan: StudyPlan = {
      id: Date.now(),
      name: `Plano de Estudos - ${schoolYear}`,
      schoolYear,
      dailyStudyTime: planForm.dailyStudyTime,
      studyDays: planForm.studyDays,
      schedules: planForm.schedules,
      sessions,
      createdAt: new Date(),
      isActive: true
    };
    
    // Salvar no localStorage
    localStorage.setItem('iaulaStudyPlan', JSON.stringify(newPlan));
    setStudyPlan(newPlan);
    setShowPlanDialog(false);
  };

  const toggleStudyDay = (dayKey: string) => {
    setPlanForm(prev => ({
      ...prev,
      studyDays: prev.studyDays.includes(dayKey)
        ? prev.studyDays.filter(d => d !== dayKey)
        : [...prev.studyDays, dayKey]
    }));
  };

  const updateSchedule = (dayKey: string, value: string) => {
    setPlanForm(prev => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [dayKey]: {
          start: value
        }
      }
    }));
  };

  // Calcular horário de fim baseado na técnica Pomodoro
  const calculateEndTime = (startTime: string, dailyHours: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const start = new Date();
    start.setHours(hours, minutes, 0, 0);
    
    // Cada hora de estudo = 2 pomodoros (25min + 5min pausa) + pausa longa de 15min a cada 4 pomodoros
    const totalMinutes = dailyHours * 60; // Tempo líquido de estudo
    const pomodoroSessions = Math.ceil((dailyHours * 60) / 25); // Número de pomodoros
    const shortBreaks = Math.max(0, pomodoroSessions - 1) * 5; // Pausas curtas (5min entre pomodoros)
    const longBreaks = Math.floor(pomodoroSessions / 4) * 15; // Pausas longas (15min a cada 4 pomodoros)
    
    const totalDuration = totalMinutes + shortBreaks + longBreaks;
    
    const end = new Date(start.getTime() + totalDuration * 60 * 1000);
    return end.toTimeString().slice(0, 5);
  };

  const getWeekSessions = () => {
    if (!studyPlan) return [];
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return studyPlan.sessions.filter(session => 
      session.startTime >= startOfWeek && session.startTime <= endOfWeek
    );
  };

  const weekSessions = getWeekSessions();
  const completedSessions = weekSessions.filter(s => s.isCompleted).length;
  const progressPercentage = weekSessions.length > 0 ? (completedSessions / weekSessions.length) * 100 : 0;

  return (
    <>
      <Helmet>
        <title>Planejamento de Estudos - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="outline" size="sm" className="gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  Planejamento de Estudos
                </h1>
                <p className="text-slate-600">
                  Plano bimestral baseado na BNCC para {schoolYear}
                </p>
              </div>
            </div>
            
            <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-slate-800 text-white hover:bg-slate-700 shadow-sm">
                  <Calendar className="h-4 w-4" />
                  Criar Novo Plano
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Plano de Estudos</DialogTitle>
                  <p className="text-sm text-slate-600">
                    Configure seu plano bimestral baseado na BNCC para {schoolYear}
                  </p>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold">Quanto tempo você vai estudar por dia?</Label>
                    <Select 
                      value={planForm.dailyStudyTime.toString()} 
                      onValueChange={(value) => setPlanForm({...planForm, dailyStudyTime: parseInt(value)})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hora por dia</SelectItem>
                        <SelectItem value="2">2 horas por dia</SelectItem>
                        <SelectItem value="3">3 horas por dia</SelectItem>
                        <SelectItem value="4">4 horas por dia</SelectItem>
                        <SelectItem value="5">5 horas por dia</SelectItem>
                        <SelectItem value="6">6 horas por dia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-semibold">Em quais dias da semana você vai estudar?</Label>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {WEEK_DAYS.map((day) => (
                        <label key={day.key} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={planForm.studyDays.includes(day.key)}
                            onChange={() => toggleStudyDay(day.key)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="font-medium">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {planForm.studyDays.length > 0 && (
                    <div>
                      <Label className="text-base font-semibold">Defina os horários para cada dia</Label>
                      <div className="space-y-4 mt-3">
                        {planForm.studyDays.map((dayKey) => {
                          const dayInfo = WEEK_DAYS.find(d => d.key === dayKey);
                          const schedule = planForm.schedules[dayKey];
                          const endTime = calculateEndTime(schedule.start, planForm.dailyStudyTime);
                          
                          return (
                            <Card key={dayKey} className="p-4 bg-slate-50 border-slate-200">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-slate-800">{dayInfo?.label}</h4>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm text-slate-600">Início:</Label>
                                    <Input
                                      type="time"
                                      value={schedule.start}
                                      onChange={(e) => updateSchedule(dayKey, e.target.value)}
                                      className="w-24 bg-white border-slate-300"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm text-slate-600">Fim:</Label>
                                    <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded border">
                                      {endTime}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {planForm.dailyStudyTime}h Pomodoro
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Matérias baseadas na BNCC para {schoolYear}</h4>
                      <div className="flex flex-wrap gap-2">
                        {curriculum?.subjects.map((subject) => (
                          <Badge key={subject.name} variant="default" className="text-xs">
                            {subject.name} ({subject.weeklyHours}h/sem)
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-blue-700 mt-2">
                        Seu plano será gerado priorizando as matérias principais e distribuindo o conteúdo ao longo do bimestre.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={createNewPlan}
                      disabled={planForm.studyDays.length === 0}
                      className="flex-1 bg-slate-800 text-white hover:bg-slate-700 shadow-sm"
                    >
                      Criar Plano Bimestral
                    </Button>
                    <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Cronograma da Semana */}
          {studyPlan ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="bg-white shadow-sm rounded-xl border border-slate-200">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Calendar className="h-5 w-5 text-slate-600" />
                      Cronograma da Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {weekSessions.length > 0 ? (
                      <div className="space-y-3">
                        {weekSessions.map(session => (
                          <Card key={session.id} className={`border ${session.isCompleted ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <h4 className="font-semibold text-slate-800">{session.subject}</h4>
                                    <p className="text-sm text-slate-600">
                                      {session.startTime.toLocaleDateString('pt-BR')} • 
                                      {session.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                                      {session.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Timer className="h-3 w-3 text-slate-500" />
                                      <span className="text-xs text-slate-500">{session.pomodoroCount} Pomodoros</span>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant={session.isCompleted ? "default" : "outline"} className={session.isCompleted ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-700 border-slate-200"}>
                                  {session.isCompleted ? "Concluído" : "Pendente"}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-600 py-8">Nenhuma sessão programada para esta semana</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-white shadow-sm rounded-xl border border-slate-200">
                  <CardHeader className="border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <TrendingUp className="h-5 w-5 text-slate-600" />
                      Progresso Semanal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-slate-800">{Math.round(progressPercentage)}%</div>
                        <p className="text-sm text-slate-600">Sessões Concluídas</p>
                      </div>
                      <Progress value={progressPercentage} className="h-2 bg-slate-100" />
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>{completedSessions} concluídas</span>
                        <span>{weekSessions.length} total</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 max-w-2xl mx-auto">
                <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  Nenhum plano de estudos ativo
                </h3>
                <p className="text-slate-600 mb-6">
                  Crie seu primeiro plano de estudos personalizado baseado na BNCC para {schoolYear}
                </p>
                <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-slate-800 text-white hover:bg-slate-700 shadow-sm">
                      <Plus className="h-4 w-4" />
                      Criar Meu Primeiro Plano
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}