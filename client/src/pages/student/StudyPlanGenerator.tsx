import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Calendar, 
  Clock, 
  Brain, 
  Coffee, 
  Target, 
  BookOpen, 
  CheckCircle2, 
  Settings, 
  Sparkles,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Timer
} from "lucide-react";
import { Helmet } from "react-helmet";
import PomodoroTimer from "@/components/PomodoroTimer";

interface Subject {
  id: string;
  name: string;
  priority: 'alta' | 'média' | 'baixa';
  hoursPerWeek: number;
  difficulty: number; // 1-5
  enabled: boolean;
}

interface StudySchedule {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

interface PomodoroSettings {
  studyDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsUntilLongBreak: number;
}

const schoolYearSubjects: Record<string, Subject[]> = {
  "6º ano": [
    { id: "lingua_portuguesa", name: "Língua Portuguesa", priority: "alta", hoursPerWeek: 5, difficulty: 3, enabled: true },
    { id: "matematica", name: "Matemática", priority: "alta", hoursPerWeek: 5, difficulty: 3, enabled: true },
    { id: "ciencias", name: "Ciências da Natureza", priority: "alta", hoursPerWeek: 3, difficulty: 2, enabled: true },
    { id: "historia", name: "História", priority: "média", hoursPerWeek: 2, difficulty: 2, enabled: true },
    { id: "geografia", name: "Geografia", priority: "média", hoursPerWeek: 2, difficulty: 2, enabled: true },
    { id: "lingua_inglesa", name: "Língua Inglesa", priority: "média", hoursPerWeek: 2, difficulty: 2, enabled: true },
    { id: "ensino_religioso", name: "Ensino Religioso", priority: "baixa", hoursPerWeek: 1, difficulty: 1, enabled: false },
  ],
  "7º ano": [
    { id: "lingua_portuguesa", name: "Língua Portuguesa", priority: "alta", hoursPerWeek: 5, difficulty: 3, enabled: true },
    { id: "matematica", name: "Matemática", priority: "alta", hoursPerWeek: 5, difficulty: 4, enabled: true },
    { id: "ciencias", name: "Ciências da Natureza", priority: "alta", hoursPerWeek: 3, difficulty: 3, enabled: true },
    { id: "historia", name: "História", priority: "média", hoursPerWeek: 2, difficulty: 2, enabled: true },
    { id: "geografia", name: "Geografia", priority: "média", hoursPerWeek: 2, difficulty: 2, enabled: true },
    { id: "lingua_inglesa", name: "Língua Inglesa", priority: "média", hoursPerWeek: 2, difficulty: 3, enabled: true },
    { id: "ensino_religioso", name: "Ensino Religioso", priority: "baixa", hoursPerWeek: 1, difficulty: 1, enabled: false },
  ],
  "8º ano": [
    { id: "lingua_portuguesa", name: "Língua Portuguesa", priority: "alta", hoursPerWeek: 5, difficulty: 4, enabled: true },
    { id: "matematica", name: "Matemática", priority: "alta", hoursPerWeek: 5, difficulty: 4, enabled: true },
    { id: "ciencias", name: "Ciências da Natureza", priority: "alta", hoursPerWeek: 3, difficulty: 4, enabled: true },
    { id: "historia", name: "História", priority: "média", hoursPerWeek: 2, difficulty: 3, enabled: true },
    { id: "geografia", name: "Geografia", priority: "média", hoursPerWeek: 2, difficulty: 3, enabled: true },
    { id: "lingua_inglesa", name: "Língua Inglesa", priority: "média", hoursPerWeek: 2, difficulty: 3, enabled: true },
    { id: "ensino_religioso", name: "Ensino Religioso", priority: "baixa", hoursPerWeek: 1, difficulty: 1, enabled: false },
  ],
  "9º ano": [
    { id: "lingua_portuguesa", name: "Língua Portuguesa", priority: "alta", hoursPerWeek: 5, difficulty: 4, enabled: true },
    { id: "matematica", name: "Matemática", priority: "alta", hoursPerWeek: 5, difficulty: 5, enabled: true },
    { id: "ciencias", name: "Ciências da Natureza", priority: "alta", hoursPerWeek: 3, difficulty: 4, enabled: true },
    { id: "historia", name: "História", priority: "média", hoursPerWeek: 2, difficulty: 3, enabled: true },
    { id: "geografia", name: "Geografia", priority: "média", hoursPerWeek: 2, difficulty: 3, enabled: true },
    { id: "lingua_inglesa", name: "Língua Inglesa", priority: "média", hoursPerWeek: 2, difficulty: 4, enabled: true },
    { id: "ensino_religioso", name: "Ensino Religioso", priority: "baixa", hoursPerWeek: 1, difficulty: 1, enabled: false },
  ],
  "1º ano": [
    { id: "lingua_portuguesa", name: "Língua Portuguesa", priority: "alta", hoursPerWeek: 5, difficulty: 4, enabled: true },
    { id: "matematica", name: "Matemática", priority: "alta", hoursPerWeek: 5, difficulty: 5, enabled: true },
    { id: "fisica", name: "Física", priority: "alta", hoursPerWeek: 3, difficulty: 5, enabled: true },
    { id: "quimica", name: "Química", priority: "alta", hoursPerWeek: 3, difficulty: 5, enabled: true },
    { id: "biologia", name: "Biologia", priority: "alta", hoursPerWeek: 3, difficulty: 4, enabled: true },
    { id: "historia", name: "História", priority: "média", hoursPerWeek: 2, difficulty: 3, enabled: true },
    { id: "geografia", name: "Geografia", priority: "média", hoursPerWeek: 2, difficulty: 3, enabled: true },
    { id: "lingua_inglesa", name: "Língua Inglesa", priority: "média", hoursPerWeek: 2, difficulty: 3, enabled: true },
    { id: "filosofia", name: "Filosofia", priority: "baixa", hoursPerWeek: 1, difficulty: 2, enabled: false },
    { id: "sociologia", name: "Sociologia", priority: "baixa", hoursPerWeek: 1, difficulty: 2, enabled: false },
  ],
  "2º ano": [
    { id: "lingua_portuguesa", name: "Língua Portuguesa", priority: "alta", hoursPerWeek: 5, difficulty: 5, enabled: true },
    { id: "matematica", name: "Matemática", priority: "alta", hoursPerWeek: 5, difficulty: 5, enabled: true },
    { id: "fisica", name: "Física", priority: "alta", hoursPerWeek: 3, difficulty: 5, enabled: true },
    { id: "quimica", name: "Química", priority: "alta", hoursPerWeek: 3, difficulty: 5, enabled: true },
    { id: "biologia", name: "Biologia", priority: "alta", hoursPerWeek: 3, difficulty: 4, enabled: true },
    { id: "historia", name: "História", priority: "média", hoursPerWeek: 2, difficulty: 4, enabled: true },
    { id: "geografia", name: "Geografia", priority: "média", hoursPerWeek: 2, difficulty: 4, enabled: true },
    { id: "lingua_inglesa", name: "Língua Inglesa", priority: "média", hoursPerWeek: 2, difficulty: 4, enabled: true },
    { id: "filosofia", name: "Filosofia", priority: "baixa", hoursPerWeek: 1, difficulty: 3, enabled: false },
    { id: "sociologia", name: "Sociologia", priority: "baixa", hoursPerWeek: 1, difficulty: 3, enabled: false },
  ],
  "3º ano": [
    { id: "lingua_portuguesa", name: "Língua Portuguesa", priority: "alta", hoursPerWeek: 6, difficulty: 5, enabled: true },
    { id: "matematica", name: "Matemática", priority: "alta", hoursPerWeek: 6, difficulty: 5, enabled: true },
    { id: "fisica", name: "Física", priority: "alta", hoursPerWeek: 4, difficulty: 5, enabled: true },
    { id: "quimica", name: "Química", priority: "alta", hoursPerWeek: 4, difficulty: 5, enabled: true },
    { id: "biologia", name: "Biologia", priority: "alta", hoursPerWeek: 4, difficulty: 5, enabled: true },
    { id: "historia", name: "História", priority: "média", hoursPerWeek: 3, difficulty: 4, enabled: true },
    { id: "geografia", name: "Geografia", priority: "média", hoursPerWeek: 3, difficulty: 4, enabled: true },
    { id: "lingua_inglesa", name: "Língua Inglesa", priority: "média", hoursPerWeek: 2, difficulty: 4, enabled: true },
    { id: "filosofia", name: "Filosofia", priority: "baixa", hoursPerWeek: 2, difficulty: 3, enabled: false },
    { id: "sociologia", name: "Sociologia", priority: "baixa", hoursPerWeek: 2, difficulty: 3, enabled: false },
    { id: "redacao", name: "Redação", priority: "alta", hoursPerWeek: 3, difficulty: 4, enabled: true },
  ],
};

const defaultSchedule: StudySchedule[] = [
  { day: "Segunda", startTime: "19:00", endTime: "22:00", enabled: true },
  { day: "Terça", startTime: "19:00", endTime: "22:00", enabled: true },
  { day: "Quarta", startTime: "19:00", endTime: "22:00", enabled: true },
  { day: "Quinta", startTime: "19:00", endTime: "22:00", enabled: true },
  { day: "Sexta", startTime: "19:00", endTime: "21:00", enabled: true },
  { day: "Sábado", startTime: "14:00", endTime: "17:00", enabled: true },
  { day: "Domingo", startTime: "14:00", endTime: "16:00", enabled: false },
];

export default function StudyPlanGenerator() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [planName, setPlanName] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedule, setSchedule] = useState<StudySchedule[]>(defaultSchedule);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    studyDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsUntilLongBreak: 4,
  });
  const [goals, setGoals] = useState("");
  const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  useEffect(() => {
    // Load subjects based on user's school year or default to 6º ano
    const schoolYear = (user as any)?.schoolYear || "6º ano";
    console.log("Loading subjects for:", schoolYear);
    
    if (schoolYearSubjects[schoolYear]) {
      setSubjects([...schoolYearSubjects[schoolYear]]);
    } else {
      // Fallback to 6º ano if school year not found
      setSubjects([...schoolYearSubjects["6º ano"]]);
    }
  }, [user]);

  const updateSubject = (id: string, field: keyof Subject, value: any) => {
    setSubjects(prev => 
      prev.map(subject => 
        subject.id === id ? { ...subject, [field]: value } : subject
      )
    );
  };

  const updateSchedule = (day: string, field: keyof StudySchedule, value: any) => {
    setSchedule(prev => 
      prev.map(daySchedule => 
        daySchedule.day === day ? { ...daySchedule, [field]: value } : daySchedule
      )
    );
  };

  const getTotalWeeklyHours = () => {
    return subjects
      .filter(s => s.enabled)
      .reduce((total, subject) => total + subject.hoursPerWeek, 0);
  };

  const getAvailableWeeklyHours = () => {
    return schedule
      .filter(s => s.enabled)
      .reduce((total, day) => {
        const start = new Date(`2000-01-01 ${day.startTime}`);
        const end = new Date(`2000-01-01 ${day.endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
  };

  const generateStudyPlan = () => {
    const enabledSubjects = subjects.filter(s => s.enabled);
    const enabledDays = schedule.filter(s => s.enabled);
    
    // Generate sessions for the week
    const sessions: any[] = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    
    // Map days to proper week indices
    const dayMapping: Record<string, number> = {
      'Segunda': 0, 'Terça': 1, 'Quarta': 2, 'Quinta': 3, 
      'Sexta': 4, 'Sábado': 5, 'Domingo': 6
    };

    enabledDays.forEach((daySchedule) => {
      const dayIndex = dayMapping[daySchedule.day];
      if (dayIndex === undefined) return;
      
      const sessionDate = new Date(startOfWeek);
      sessionDate.setDate(startOfWeek.getDate() + dayIndex);
      
      const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
      const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);
      
      const dayStart = new Date(sessionDate);
      dayStart.setHours(startHour, startMin, 0, 0);
      
      const dayEnd = new Date(sessionDate);
      dayEnd.setHours(endHour, endMin, 0, 0);
      
      const availableMinutes = (dayEnd.getTime() - dayStart.getTime()) / (1000 * 60);
      
      // Calculate how many subjects can fit within available time
      const sessionDuration = pomodoroSettings.studyDuration + pomodoroSettings.shortBreak; // One Pomodoro + break
      const maxSessions = Math.floor(availableMinutes / sessionDuration);
      const subjectsToSchedule = Math.min(enabledSubjects.length, maxSessions);
      
      let currentTime = new Date(dayStart);
      
      enabledSubjects.slice(0, subjectsToSchedule).forEach((subject, subjectIndex) => {
        const sessionStart = new Date(currentTime);
        const sessionEnd = new Date(currentTime);
        sessionEnd.setMinutes(sessionEnd.getMinutes() + pomodoroSettings.studyDuration);
        
        // Check if session fits within day bounds
        if (sessionEnd <= dayEnd) {
          sessions.push({
            id: Date.now() + sessions.length + Math.random(),
            subject: subject.name,
            startTime: sessionStart,
            endTime: sessionEnd,
            isCompleted: false,
            pomodoroCount: 1,
            dayOfWeek: daySchedule.day
          });
          
          // Move to next time slot (study + break)
          currentTime.setMinutes(currentTime.getMinutes() + sessionDuration);
        }
      });
    });
    
    const plan = {
      id: Date.now(),
      name: planName || `Plano de ${(user as any)?.schoolYear}`,
      schoolYear: (user as any)?.schoolYear,
      subjects: enabledSubjects,
      schedule: enabledDays,
      sessions: sessions,
      pomodoroSettings,
      goals,
      createdAt: new Date(),
      isActive: true,
    };

    setGeneratedPlan(plan);
    
    // Save to localStorage
    localStorage.setItem('iaulaStudyPlan', JSON.stringify(plan));
    
    setCurrentStep(4);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'média': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'baixa': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < difficulty ? "text-yellow-400" : "text-gray-300"}>
        ★
      </span>
    ));
  };

  return (
    <>
      <Helmet>
        <title>Gerador de Plano de Estudos - AIverse</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/aluno/dashboard")}
                  className="text-gray-600 hover:text-blue-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Gerador de Plano de Estudos</h1>
                  <p className="text-sm text-gray-600">
                    {(user as any)?.schoolYear} • Técnica Pomodoro Integrada
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPomodoroTimer(!showPomodoroTimer)}
                  className="gap-2"
                >
                  <Timer className="w-4 h-4" />
                  {showPomodoroTimer ? "Ocultar" : "Mostrar"} Timer
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <Card className="mb-8 border border-gray-200 shadow-lg bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          step <= currentStep 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                        </div>
                        {step < 4 && (
                          <div className={`w-full h-1 mx-4 ${
                            step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4 text-center text-sm">
                    <span className={currentStep >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
                      Matérias
                    </span>
                    <span className={currentStep >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
                      Horários
                    </span>
                    <span className={currentStep >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
                      Pomodoro
                    </span>
                    <span className={currentStep >= 4 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
                      Finalizar
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Step Content */}
              {currentStep === 1 && (
                <Card className="border border-gray-200 shadow-lg bg-white">
                  <CardHeader className="bg-white border-b border-gray-200 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-gray-900">
                      <BookOpen className="w-6 h-6 text-indigo-600" />
                      Selecione suas Matérias - {(user as any)?.schoolYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="planName" className="text-gray-900 font-medium">Nome do Plano</Label>
                      <Input
                        id="planName"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder={`Plano de Estudos - ${(user as any)?.schoolYear}`}
                        className="rounded-xl border-gray-300 focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Matérias Disponíveis
                        </h3>
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                          {subjects.filter(s => s.enabled).length} selecionadas
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4">
                        {subjects.map((subject) => (
                          <Card 
                            key={subject.id} 
                            className={`p-4 transition-all cursor-pointer bg-white ${
                              subject.enabled 
                                ? 'border-indigo-400 border-2 shadow-md ring-2 ring-indigo-100' 
                                : 'border-gray-300 hover:border-indigo-300 hover:shadow-sm'
                            }`}
                            onClick={() => updateSubject(subject.id, 'enabled', !subject.enabled)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  subject.enabled 
                                    ? 'bg-indigo-600 border-indigo-600' 
                                    : 'border-gray-300'
                                }`}>
                                  {subject.enabled && (
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge className={getPriorityColor(subject.priority)}>
                                      {subject.priority}
                                    </Badge>
                                    <span className="text-sm text-gray-600">
                                      {subject.hoursPerWeek}h/semana
                                    </span>
                                    <div className="flex items-center">
                                      {getDifficultyStars(subject.difficulty)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {subject.enabled && (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Label className="text-xs text-gray-900 font-medium">Horas/semana:</Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={subject.hoursPerWeek}
                                      onChange={(e) => updateSubject(subject.id, 'hoursPerWeek', parseInt(e.target.value))}
                                      className="w-16 h-8 text-center border-gray-300 focus:border-indigo-500"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="bg-indigo-50 border border-indigo-300 rounded-xl p-4">
                        <h4 className="font-semibold text-indigo-900 mb-2">Resumo da Carga Horária</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-700">Total Semanal:</span>
                            <span className="font-semibold text-indigo-700 ml-2">
                              {getTotalWeeklyHours()}h
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-700">Disponível:</span>
                            <span className="font-semibold text-green-700 ml-2">
                              {getAvailableWeeklyHours()}h
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setCurrentStep(2)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                      disabled={subjects.filter(s => s.enabled).length === 0}
                    >
                      Próximo: Definir Horários
                    </Button>
                  </CardContent>
                </Card>
              )}

              {currentStep === 2 && (
                <Card className="border border-gray-200 shadow-lg bg-white">
                  <CardHeader className="bg-white border-b border-gray-200 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-gray-900">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                      Configure seus Horários de Estudo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid gap-4">
                      {schedule.map((day) => (
                        <Card key={day.day} className={`p-4 bg-white ${
                          day.enabled 
                            ? 'border-indigo-400 border-2 shadow-md ring-2 ring-indigo-100' 
                            : 'border-gray-300'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={day.enabled}
                                onCheckedChange={(checked) => updateSchedule(day.day, 'enabled', checked)}
                              />
                              <span className="font-semibold text-gray-900">{day.day}</span>
                            </div>
                            
                            {day.enabled && (
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2">
                                  <Label className="text-sm text-gray-900 font-medium">Das:</Label>
                                  <Input
                                    type="time"
                                    value={day.startTime}
                                    onChange={(e) => updateSchedule(day.day, 'startTime', e.target.value)}
                                    className="w-24 h-8 border-gray-300 focus:border-indigo-500"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Label className="text-sm text-gray-900 font-medium">Às:</Label>
                                  <Input
                                    type="time"
                                    value={day.endTime}
                                    onChange={(e) => updateSchedule(day.day, 'endTime', e.target.value)}
                                    className="w-24 h-8 border-gray-300 focus:border-indigo-500"
                                  />
                                </div>
                                <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                                  {(() => {
                                    const start = new Date(`2000-01-01 ${day.startTime}`);
                                    const end = new Date(`2000-01-01 ${day.endTime}`);
                                    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                    return `${hours}h`;
                                  })()}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="bg-indigo-50 border border-indigo-300 rounded-xl p-4">
                      <h4 className="font-semibold text-indigo-900 mb-2">Análise de Tempo</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Horas disponíveis por semana:</span>
                          <span className="font-semibold text-gray-900">{getAvailableWeeklyHours()}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Horas necessárias:</span>
                          <span className="font-semibold text-gray-900">{getTotalWeeklyHours()}h</span>
                        </div>
                        <Progress 
                          value={Math.min((getTotalWeeklyHours() / getAvailableWeeklyHours()) * 100, 100)}
                          className="h-2"
                        />
                        <p className="text-xs text-gray-700">
                          {getAvailableWeeklyHours() >= getTotalWeeklyHours() 
                            ? "✅ Tempo suficiente disponível"
                            : "⚠️ Considere ajustar horários ou reduzir carga"
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                        disabled={schedule.filter(s => s.enabled).length === 0}
                      >
                        Próximo: Pomodoro
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 3 && (
                <Card className="border border-gray-200 shadow-lg bg-white">
                  <CardHeader className="bg-white border-b border-gray-200 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-gray-900">
                      <Timer className="w-6 h-6 text-indigo-600" />
                      Configurações da Técnica Pomodoro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-900 font-medium">Tempo de Estudo (minutos)</Label>
                          <Input
                            type="number"
                            min="15"
                            max="60"
                            value={pomodoroSettings.studyDuration}
                            onChange={(e) => setPomodoroSettings(prev => ({
                              ...prev,
                              studyDuration: parseInt(e.target.value)
                            }))}
                            className="rounded-xl border-gray-300 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-gray-900 font-medium">Pausa Curta (minutos)</Label>
                          <Input
                            type="number"
                            min="3"
                            max="15"
                            value={pomodoroSettings.shortBreak}
                            onChange={(e) => setPomodoroSettings(prev => ({
                              ...prev,
                              shortBreak: parseInt(e.target.value)
                            }))}
                            className="rounded-xl border-gray-300 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-900 font-medium">Pausa Longa (minutos)</Label>
                          <Input
                            type="number"
                            min="15"
                            max="45"
                            value={pomodoroSettings.longBreak}
                            onChange={(e) => setPomodoroSettings(prev => ({
                              ...prev,
                              longBreak: parseInt(e.target.value)
                            }))}
                            className="rounded-xl border-gray-300 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-gray-900 font-medium">Sessões até pausa longa</Label>
                          <Input
                            type="number"
                            min="2"
                            max="8"
                            value={pomodoroSettings.sessionsUntilLongBreak}
                            onChange={(e) => setPomodoroSettings(prev => ({
                              ...prev,
                              sessionsUntilLongBreak: parseInt(e.target.value)
                            }))}
                            className="rounded-xl border-gray-300 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-900 font-medium">Objetivos e Metas Específicas</Label>
                      <Textarea
                        value={goals}
                        onChange={(e) => setGoals(e.target.value)}
                        placeholder="Ex: Focar em álgebra em matemática, melhorar interpretação de texto em português..."
                        className="rounded-xl min-h-[100px] border-gray-300 focus:border-indigo-500"
                      />
                    </div>

                    <div className="bg-indigo-50 border border-indigo-300 rounded-xl p-4">
                      <h4 className="font-semibold text-indigo-900 mb-2">
                        <Timer className="w-4 h-4 inline mr-2" />
                        Como Funciona a Técnica Pomodoro
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• {pomodoroSettings.studyDuration} minutos de estudo focado</li>
                        <li>• {pomodoroSettings.shortBreak} minutos de pausa curta</li>
                        <li>• A cada {pomodoroSettings.sessionsUntilLongBreak} sessões: {pomodoroSettings.longBreak} minutos de pausa longa</li>
                        <li>• Timer integrado no dashboard para acompanhamento</li>
                      </ul>
                    </div>

                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1"
                      >
                        Voltar
                      </Button>
                      <Button 
                        onClick={generateStudyPlan}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Gerar Plano de Estudos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === 4 && generatedPlan && (
                <Card className="border border-gray-200 shadow-lg bg-white">
                  <CardHeader className="bg-white border-b border-gray-200 rounded-t-lg">
                    <CardTitle className="flex items-center gap-3 text-gray-900">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      Plano de Estudos Gerado com Sucesso!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{generatedPlan.name}</h3>
                      <p className="text-gray-600">
                        Seu plano personalizado para {(generatedPlan as any).schoolYear} está pronto!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4 bg-blue-50 border-blue-200">
                        <div className="text-center">
                          <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <div className="font-semibold text-blue-800">
                            {generatedPlan.subjects.length} Matérias
                          </div>
                          <div className="text-sm text-blue-600">Selecionadas</div>
                        </div>
                      </Card>
                      
                      <Card className="p-4 bg-indigo-50 border-indigo-200">
                        <div className="text-center">
                          <Calendar className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                          <div className="font-semibold text-indigo-800">
                            {getAvailableWeeklyHours()}h
                          </div>
                          <div className="text-sm text-indigo-600">Por Semana</div>
                        </div>
                      </Card>
                      
                      <Card className="p-4 bg-purple-50 border-purple-200">
                        <div className="text-center">
                          <Timer className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                          <div className="font-semibold text-purple-800">
                            {generatedPlan.pomodoroSettings.studyDuration}min
                          </div>
                          <div className="text-sm text-purple-600">Por Pomodoro</div>
                        </div>
                      </Card>
                    </div>

                    {/* Plan Details */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Resumo do Plano</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Matérias Selecionadas:</h5>
                            <div className="space-y-1">
                              {generatedPlan.subjects.map((subject: any) => (
                                <div key={subject.id} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{subject.name}</span>
                                  <span className="text-gray-600">{subject.hoursPerWeek}h/semana</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-gray-800 mb-2">Horários de Estudo:</h5>
                            <div className="space-y-1">
                              {generatedPlan.schedule.map((day: any) => (
                                <div key={day.day} className="flex justify-between text-sm">
                                  <span className="text-gray-700">{day.day}</span>
                                  <span className="text-gray-600">{day.startTime} - {day.endTime}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {generatedPlan.goals && (
                        <div>
                          <h5 className="font-medium text-gray-800 mb-2">Objetivos:</h5>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{generatedPlan.goals}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        onClick={() => setCurrentStep(3)}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Editar Plano
                      </Button>
                      <Button 
                        onClick={() => navigate("/aluno/dashboard")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Ir para Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Timer */}
              {showPomodoroTimer && (
                <div className="sticky top-24">
                  <PomodoroTimer
                    studyDuration={pomodoroSettings.studyDuration}
                    shortBreakDuration={pomodoroSettings.shortBreak}
                    longBreakDuration={pomodoroSettings.longBreak}
                    sessionsUntilLongBreak={pomodoroSettings.sessionsUntilLongBreak}
                    subject="Configuração"
                  />
                </div>
              )}

              {/* Tips */}
              <Card className="border border-gray-200 shadow-lg bg-white">
                <CardHeader className="bg-white border-b border-gray-200 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Dicas do AIverse
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>
                      <p className="text-gray-700">Priorize matérias com maior dificuldade nos horários em que você tem mais energia</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>
                      <p className="text-gray-700">Use o timer Pomodoro para manter o foco e evitar esgotamento mental</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>
                      <p className="text-gray-700">Reserve pelo menos um dia da semana para revisão geral</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full mt-1 flex-shrink-0"></div>
                      <p className="text-gray-700">Ajuste o plano semanalmente conforme seu progresso</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}