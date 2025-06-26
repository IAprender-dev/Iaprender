import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useStudyPlan } from "@/lib/StudyPlanContext";
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
import { Textarea } from "@/components/ui/textarea";
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

interface Exam {
  id: number;
  subject: string;
  date: Date;
  title: string;
  status: 'upcoming' | 'completed';
}

interface PomodoroTimer {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isBreak: boolean;
  currentCycle: number;
  totalCycles: number;
}

export default function StudyPlanning() {
  const { user } = useAuth();
  const { currentPlan, setCurrentPlan, getWeekSessions, completeSession: completeStudySession, getCompletionStats } = useStudyPlan();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [exams, setExams] = useState<Exam[]>([]);
  const [pomodoroTimer, setPomodoroTimer] = useState<PomodoroTimer>({
    minutes: 25,
    seconds: 0,
    isRunning: false,
    isBreak: false,
    currentCycle: 1,
    totalCycles: 4
  });
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [showPomodoroDialog, setShowPomodoroDialog] = useState(false);
  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [examForm, setExamForm] = useState({ subject: "", date: "", title: "" });
  const [planForm, setPlanForm] = useState({
    dailyStudyTime: 2, // horas por dia
    studyDays: [] as string[],
    schedules: {
      monday: { start: "19:00", end: "21:00" },
      tuesday: { start: "19:00", end: "21:00" },
      wednesday: { start: "19:00", end: "21:00" },
      thursday: { start: "19:00", end: "21:00" },
      friday: { start: "19:00", end: "21:00" },
      saturday: { start: "14:00", end: "16:00" },
      sunday: { start: "14:00", end: "16:00" }
    }
  });

  // Obter ano escolar do usuário
  const schoolYear = (user as any)?.schoolYear || "1º ano";
  const curriculum = BNCC_CURRICULUM[schoolYear as keyof typeof BNCC_CURRICULUM];

  // Dias da semana para mapeamento
  const WEEK_DAYS = [
    { key: "monday", label: "Segunda-feira", index: 1 },
    { key: "tuesday", label: "Terça-feira", index: 2 },
    { key: "wednesday", label: "Quarta-feira", index: 3 },
    { key: "thursday", label: "Quinta-feira", index: 4 },
    { key: "friday", label: "Sexta-feira", index: 5 },
    { key: "saturday", label: "Sábado", index: 6 },
    { key: "sunday", label: "Domingo", index: 0 }
  ];

  // Gerar cronograma bimestral baseado na BNCC e preferências do usuário
  const generateBimesterSchedule = () => {
    if (!curriculum || planForm.studyDays.length === 0) return;

    const sessions: StudySession[] = [];
    const startDate = new Date();
    
    // Calcular distribuição de matérias por prioridade
    const highPrioritySubjects = curriculum.subjects.filter(s => s.priority === "high");
    const mediumPrioritySubjects = curriculum.subjects.filter(s => s.priority === "medium");
    const lowPrioritySubjects = curriculum.subjects.filter(s => s.priority === "low");
    
    // Gerar 8 semanas (2 meses = 1 bimestre)
    for (let week = 0; week < 8; week++) {
      planForm.studyDays.forEach((dayKey, dayIndex) => {
        const dayInfo = WEEK_DAYS.find(d => d.key === dayKey);
        if (!dayInfo) return;
        
        const sessionDate = new Date(startDate);
        sessionDate.setDate(startDate.getDate() + (week * 7) + (dayInfo.index - startDate.getDay()));
        
        // Ajustar para não criar sessões no passado
        if (sessionDate < new Date()) {
          sessionDate.setDate(sessionDate.getDate() + 7);
        }
        
        const schedule = planForm.schedules[dayKey as keyof typeof planForm.schedules];
        const [startHour, startMinute] = schedule.start.split(':').map(Number);
        const [endHour, endMinute] = schedule.end.split(':').map(Number);
        
        sessionDate.setHours(startHour, startMinute, 0, 0);
        const endTime = new Date(sessionDate);
        endTime.setHours(endHour, endMinute, 0, 0);
        
        // Calcular duração em minutos
        const durationMinutes = (endTime.getTime() - sessionDate.getTime()) / (1000 * 60);
        const pomodoroCount = Math.floor(durationMinutes / 25);
        
        // Selecionar matéria baseada na prioridade e rotatividade
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
          notes: "",
          dayOfWeek: dayKey
        };
        
        sessions.push(session);
      });
    }
    
    // Criar e salvar o plano completo
    const newPlan = {
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
    
    setCurrentPlan(newPlan);
    setShowPlanDialog(false);
  };

  const createNewPlan = () => {
    if (planForm.studyDays.length === 0) {
      alert("Selecione pelo menos um dia da semana para estudar.");
      return;
    }
    generateBimesterSchedule();
  };

  const toggleStudyDay = (dayKey: string) => {
    setPlanForm(prev => ({
      ...prev,
      studyDays: prev.studyDays.includes(dayKey)
        ? prev.studyDays.filter(d => d !== dayKey)
        : [...prev.studyDays, dayKey]
    }));
  };

  const updateSchedule = (dayKey: string, field: 'start' | 'end', value: string) => {
    setPlanForm(prev => ({
      ...prev,
      schedules: {
        ...prev.schedules,
        [dayKey]: {
          ...prev.schedules[dayKey as keyof typeof prev.schedules],
          [field]: value
        }
      }
    }));
  };

  // Timer Pomodoro
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (pomodoroTimer.isRunning) {
      interval = setInterval(() => {
        setPomodoroTimer(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          } else {
            // Timer acabou
            const isLastCycle = prev.currentCycle >= prev.totalCycles;
            const newIsBreak = !prev.isBreak;
            const breakDuration = prev.currentCycle % 4 === 0 ? 15 : 5; // Pausa longa a cada 4 ciclos
            
            return {
              ...prev,
              minutes: newIsBreak ? breakDuration : 25,
              seconds: 0,
              isRunning: false,
              isBreak: newIsBreak,
              currentCycle: newIsBreak ? prev.currentCycle : prev.currentCycle + 1
            };
          }
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [pomodoroTimer.isRunning]);

  const startPomodoro = (subject: string) => {
    setSelectedSubject(subject);
    setPomodoroTimer(prev => ({ ...prev, isRunning: true }));
    setShowPomodoroDialog(true);
  };

  const pausePomodoro = () => {
    setPomodoroTimer(prev => ({ ...prev, isRunning: false }));
  };

  const resetPomodoro = () => {
    setPomodoroTimer({
      minutes: 25,
      seconds: 0,
      isRunning: false,
      isBreak: false,
      currentCycle: 1,
      totalCycles: 4
    });
  };

  const completeSession = (sessionId: number) => {
    completeStudySession(sessionId);
  };

  const addExam = () => {
    const newExam: Exam = {
      id: Date.now(),
      subject: examForm.subject,
      date: new Date(examForm.date),
      title: examForm.title,
      status: 'upcoming'
    };
    
    setExams(prev => [...prev, newExam]);
    setExamForm({ subject: "", date: "", title: "" });
    setShowExamDialog(false);
  };

  const getWeekSessions = () => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return studySessions.filter(session => 
      session.startTime >= startOfWeek && session.startTime <= endOfWeek
    );
  };

  const getUpcomingExams = () => {
    const today = new Date();
    return exams.filter(exam => exam.date >= today && exam.status === 'upcoming')
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 3);
  };

  const weekSessions = getWeekSessions();
  const completedSessions = weekSessions.filter(s => s.isCompleted).length;
  const progressPercentage = weekSessions.length > 0 ? (completedSessions / weekSessions.length) * 100 : 0;

  return (
    <>
      <Helmet>
        <title>Planejamento de Estudos - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Planejamento de Estudos
                </h1>
                <p className="text-slate-700">
                  Plano bimestral baseado na BNCC para {schoolYear}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
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
                    {/* Tempo de estudo diário */}
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

                    {/* Dias da semana */}
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

                    {/* Horários para cada dia selecionado */}
                    {planForm.studyDays.length > 0 && (
                      <div>
                        <Label className="text-base font-semibold">Defina os horários para cada dia</Label>
                        <div className="space-y-4 mt-3">
                          {planForm.studyDays.map((dayKey) => {
                            const dayInfo = WEEK_DAYS.find(d => d.key === dayKey);
                            const schedule = planForm.schedules[dayKey as keyof typeof planForm.schedules];
                            
                            return (
                              <Card key={dayKey} className="p-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-slate-800">{dayInfo?.label}</h4>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm">Início:</Label>
                                      <Input
                                        type="time"
                                        value={schedule.start}
                                        onChange={(e) => updateSchedule(dayKey, 'start', e.target.value)}
                                        className="w-24"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Label className="text-sm">Fim:</Label>
                                      <Input
                                        type="time"
                                        value={schedule.end}
                                        onChange={(e) => updateSchedule(dayKey, 'end', e.target.value)}
                                        className="w-24"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Informações sobre a BNCC */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Matérias baseadas na BNCC para {schoolYear}</h4>
                        <div className="flex flex-wrap gap-2">
                          {curriculum?.subjects.map((subject) => (
                            <Badge 
                              key={subject.name} 
                              variant="default"
                              className="text-xs"
                            >
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
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      >
                        Criar Plano Bimestral
                      </Button>
                      <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showExamDialog} onOpenChange={setShowExamDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Prova
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Prova</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="examSubject">Matéria</Label>
                      <Select value={examForm.subject} onValueChange={(value) => setExamForm({...examForm, subject: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a matéria" />
                        </SelectTrigger>
                        <SelectContent>
                          {curriculum?.subjects.map(subject => (
                            <SelectItem key={subject.name} value={subject.name}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="examTitle">Título da Prova</Label>
                      <Input
                        id="examTitle"
                        value={examForm.title}
                        onChange={(e) => setExamForm({...examForm, title: e.target.value})}
                        placeholder="Ex: Prova Bimestral"
                      />
                    </div>
                    <div>
                      <Label htmlFor="examDate">Data da Prova</Label>
                      <Input
                        id="examDate"
                        type="date"
                        value={examForm.date}
                        onChange={(e) => setExamForm({...examForm, date: e.target.value})}
                      />
                    </div>
                    <Button onClick={addExam} className="w-full">
                      Adicionar Prova
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs defaultValue="schedule" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="schedule">Cronograma</TabsTrigger>
              <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
              <TabsTrigger value="tips">Dicas de Estudo</TabsTrigger>
              <TabsTrigger value="progress">Progresso</TabsTrigger>
            </TabsList>

            {/* Cronograma */}
            <TabsContent value="schedule">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-800">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Cronograma da Semana
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {weekSessions.length > 0 ? (
                        <div className="space-y-3">
                          {weekSessions.map(session => (
                            <Card key={session.id} className={`border ${session.isCompleted ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => completeSession(session.id)}
                                      disabled={session.isCompleted}
                                    >
                                      <CheckCircle className={`h-5 w-5 ${session.isCompleted ? 'text-green-600' : 'text-slate-400'}`} />
                                    </Button>
                                    <div>
                                      <h4 className="font-semibold text-slate-800">{session.subject}</h4>
                                      <p className="text-sm text-slate-600">
                                        {session.startTime.toLocaleDateString('pt-BR')} • 
                                        {session.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - 
                                        {session.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Timer className="h-3 w-3 text-orange-500" />
                                        <span className="text-xs text-slate-500">{session.pomodoroCount} Pomodoros</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => startPomodoro(session.subject)}
                                      disabled={session.isCompleted}
                                      className="gap-2"
                                    >
                                      <Play className="h-4 w-4" />
                                      Iniciar
                                    </Button>
                                    <Badge variant={session.isCompleted ? "success" : "default"}>
                                      {session.isCompleted ? "Concluído" : "Pendente"}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="max-w-md mx-auto">
                            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">
                              Nenhum plano de estudos ativo
                            </h3>
                            <p className="text-slate-600 mb-6">
                              Crie seu primeiro plano de estudos personalizado baseado na BNCC para {schoolYear}. 
                              Configure seus horários e dias de estudo para começar sua jornada de aprendizado.
                            </p>
                            <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                              <DialogTrigger asChild>
                                <Button className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                                  <Plus className="h-4 w-4" />
                                  Criar Meu Primeiro Plano
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  {/* Progresso Semanal */}
                  <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-800">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Progresso Semanal
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-slate-800">{Math.round(progressPercentage)}%</div>
                          <p className="text-sm text-slate-600">Sessões Concluídas</p>
                        </div>
                        <Progress value={progressPercentage} className="h-3" />
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>{completedSessions} concluídas</span>
                          <span>{weekSessions.length} total</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Próximas Provas */}
                  <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-800">
                        <Award className="h-5 w-5 text-blue-600" />
                        Próximas Provas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {getUpcomingExams().length > 0 ? (
                        <div className="space-y-3">
                          {getUpcomingExams().map(exam => (
                            <div key={exam.id} className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                              <h4 className="font-semibold text-slate-800">{exam.title}</h4>
                              <p className="text-sm text-slate-600">{exam.subject}</p>
                              <p className="text-xs text-orange-600 mt-1">
                                {exam.date.toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-600 text-center">Nenhuma prova programada</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Matérias BNCC */}
                  <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-800">
                        <BookMarked className="h-5 w-5 text-blue-600" />
                        Grade Curricular BNCC
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {curriculum?.subjects.map(subject => (
                          <div key={subject.name} className="flex items-center justify-between">
                            <span className="text-sm text-slate-700">{subject.name}</span>
                            <Badge 
                              variant="default"
                              className="text-xs"
                            >
                              {subject.weeklyHours}h/sem
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Pomodoro Timer */}
            <TabsContent value="pomodoro">
              <div className="max-w-2xl mx-auto">
                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                  <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-slate-800">
                      <Timer className="h-6 w-6 text-orange-500" />
                      Timer Pomodoro
                    </CardTitle>
                    <p className="text-slate-600">
                      {selectedSubject ? `Estudando: ${selectedSubject}` : "Selecione uma matéria para começar"}
                    </p>
                  </CardHeader>
                  <CardContent className="text-center space-y-6">
                    <div className="text-8xl font-bold text-slate-800 font-mono">
                      {String(pomodoroTimer.minutes).padStart(2, '0')}:
                      {String(pomodoroTimer.seconds).padStart(2, '0')}
                    </div>
                    
                    <div className="flex items-center justify-center gap-2">
                      <Badge variant={pomodoroTimer.isBreak ? "warning" : "default"}>
                        {pomodoroTimer.isBreak ? "Pausa" : "Foco"}
                      </Badge>
                      <span className="text-sm text-slate-600">
                        Ciclo {pomodoroTimer.currentCycle} de {pomodoroTimer.totalCycles}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <Button
                        onClick={() => pomodoroTimer.isRunning ? pausePomodoro() : setPomodoroTimer(prev => ({ ...prev, isRunning: true }))}
                        size="lg"
                        className="gap-2"
                      >
                        {pomodoroTimer.isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        {pomodoroTimer.isRunning ? "Pausar" : "Iniciar"}
                      </Button>
                      <Button onClick={resetPomodoro} variant="outline" size="lg" className="gap-2">
                        <RotateCcw className="h-5 w-5" />
                        Resetar
                      </Button>
                    </div>

                    <Progress value={(pomodoroTimer.currentCycle / pomodoroTimer.totalCycles) * 100} className="h-2" />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Dicas de Estudo */}
            <TabsContent value="tips">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Brain className="h-5 w-5 text-purple-600" />
                      Técnica Pomodoro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-600">1</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">25 minutos de foco</h4>
                          <p className="text-sm text-slate-600">Estude com total concentração, sem distrações</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-green-600">2</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">5 minutos de pausa</h4>
                          <p className="text-sm text-slate-600">Descanse, alongue-se ou hidrate-se</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-orange-600">3</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">Pausa longa</h4>
                          <p className="text-sm text-slate-600">A cada 4 ciclos, faça uma pausa de 15-30 minutos</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Dicas de Concentração
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Coffee className="h-5 w-5 text-brown-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-slate-800">Ambiente organizado</h4>
                        <p className="text-sm text-slate-600">Mantenha sua mesa limpa e livre de distrações</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-slate-800">Método ativo</h4>
                        <p className="text-sm text-slate-600">Faça resumos, mapas mentais e questões</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Star className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-slate-800">Revisão espaçada</h4>
                        <p className="text-sm text-slate-600">Revise o conteúdo em intervalos crescentes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-slate-800">Estudo em grupo</h4>
                        <p className="text-sm text-slate-600">Explique conceitos para colegas para fixar o aprendizado</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Target className="h-5 w-5 text-green-600" />
                      Organização dos Estudos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">Antes de estudar:</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Defina objetivos claros para a sessão</li>
                        <li>• Prepare todos os materiais necessários</li>
                        <li>• Elimine distrações (celular, redes sociais)</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">Durante o estudo:</h4>
                      <ul className="text-sm text-slate-600 space-y-1">
                        <li>• Foque em uma matéria por vez</li>
                        <li>• Anote dúvidas para pesquisar depois</li>
                        <li>• Faça pausas regulares</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                      Técnicas de Memorização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">Mapas Mentais</h4>
                      <p className="text-sm text-slate-600">
                        Organize informações visualmente com cores e conexões
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">Flashcards</h4>
                      <p className="text-sm text-slate-600">
                        Perguntas e respostas para revisão rápida
                      </p>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <h4 className="font-semibold text-slate-800 mb-2">Associações</h4>
                      <p className="text-sm text-slate-600">
                        Conecte novos conceitos com conhecimentos anteriores
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Progresso Detalhado */}
            <TabsContent value="progress">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Estatísticas Gerais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{studySessions.filter(s => s.isCompleted).length}</div>
                        <p className="text-sm text-slate-600">Sessões Concluídas</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {studySessions.filter(s => s.isCompleted).reduce((acc, s) => acc + s.pomodoroCount, 0)}
                        </div>
                        <p className="text-sm text-slate-600">Pomodoros Realizados</p>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round((studySessions.filter(s => s.isCompleted).reduce((acc, s) => acc + s.pomodoroCount, 0) * 25) / 60)}h
                      </div>
                      <p className="text-sm text-slate-600">Horas de Estudo</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Conquistas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Primeiro Pomodoro</h4>
                        <p className="text-xs text-slate-600">Complete sua primeira sessão de 25 minutos</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg opacity-50">
                      <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                        <Target className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Semana Completa</h4>
                        <p className="text-xs text-slate-600">Complete todas as sessões de uma semana</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg opacity-50">
                      <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">Bimestre Concluído</h4>
                        <p className="text-xs text-slate-600">Finalize todo o plano bimestral</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}