import { useState } from "react";
import { Calendar, Clock, BookOpen, Target, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";

// Matérias por ano escolar baseadas na BNCC
const SUBJECTS_BY_YEAR = {
  "6º ano": ["Português", "Matemática", "História", "Geografia", "Ciências", "Inglês", "Educação Física", "Arte"],
  "7º ano": ["Português", "Matemática", "História", "Geografia", "Ciências", "Inglês", "Educação Física", "Arte"],
  "8º ano": ["Português", "Matemática", "História", "Geografia", "Ciências", "Inglês", "Educação Física", "Arte"],
  "9º ano": ["Português", "Matemática", "História", "Geografia", "Ciências", "Inglês", "Educação Física", "Arte"],
  "1º ano": ["Português", "Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Inglês", "Educação Física", "Arte"],
  "2º ano": ["Português", "Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Inglês", "Educação Física", "Arte"],
  "3º ano": ["Português", "Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Filosofia", "Sociologia", "Inglês", "Educação Física", "Arte"]
};

const WEEK_DAYS = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" }
];

interface StudyPlan {
  id: number;
  name: string;
  schoolYear: string;
  availableHoursPerDay: number;
  studyStartTime: string;
  studyEndTime: string;
  studyDays: string[];
  isActive: boolean;
}

interface Exam {
  id: number;
  title: string;
  subject: string;
  examDate: string;
  description?: string;
}

interface StudyEvent {
  id: number;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  isCompleted: boolean;
}

export default function StudyPlanning() {
  const { user } = useAuth();
  
  // Estados para o plano de estudos
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  
  // Estados para provas
  const [exams, setExams] = useState<Exam[]>([]);
  const [isAddingExam, setIsAddingExam] = useState(false);
  
  // Estados para eventos da semana
  const [weeklyEvents, setWeeklyEvents] = useState<StudyEvent[]>([]);
  
  // Formulário de criação do plano
  const [planForm, setPlanForm] = useState({
    name: "",
    availableHoursPerDay: 2,
    studyStartTime: "19:00",
    studyEndTime: "21:00",
    studyDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
  });
  
  // Formulário de prova
  const [examForm, setExamForm] = useState({
    title: "",
    subject: "",
    examDate: "",
    description: ""
  });

  const createStudyPlan = () => {
    const newPlan: StudyPlan = {
      id: Date.now(),
      name: planForm.name,
      schoolYear: user?.schoolYear || "1º ano",
      availableHoursPerDay: planForm.availableHoursPerDay,
      studyStartTime: planForm.studyStartTime,
      studyEndTime: planForm.studyEndTime,
      studyDays: planForm.studyDays,
      isActive: true
    };
    
    setStudyPlan(newPlan);
    setIsCreatingPlan(false);
    generateWeeklySchedule(newPlan);
  };

  const generateWeeklySchedule = (plan: StudyPlan) => {
    const subjects = SUBJECTS_BY_YEAR[plan.schoolYear as keyof typeof SUBJECTS_BY_YEAR] || [];
    const events: StudyEvent[] = [];
    
    // Gerar cronograma para a semana atual
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Segunda-feira
    
    plan.studyDays.forEach((day, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + WEEK_DAYS.findIndex(d => d.key === day));
      
      const subject = subjects[index % subjects.length];
      
      events.push({
        id: Date.now() + index,
        subject,
        date: date.toISOString().split('T')[0],
        startTime: plan.studyStartTime,
        endTime: plan.studyEndTime,
        description: `Estudar ${subject}`,
        isCompleted: false
      });
    });
    
    setWeeklyEvents(events);
  };

  const addExam = () => {
    const newExam: Exam = {
      id: Date.now(),
      title: examForm.title,
      subject: examForm.subject,
      examDate: examForm.examDate,
      description: examForm.description
    };
    
    setExams([...exams, newExam]);
    setExamForm({ title: "", subject: "", examDate: "", description: "" });
    setIsAddingExam(false);
    
    // Reagendar estudos considerando a prova
    if (studyPlan) {
      generateWeeklySchedule(studyPlan);
    }
  };

  const toggleEventCompletion = (eventId: number) => {
    setWeeklyEvents(events => 
      events.map(event => 
        event.id === eventId 
          ? { ...event, isCompleted: !event.isCompleted }
          : event
      )
    );
  };

  const getUpcomingExams = () => {
    const today = new Date();
    return exams.filter(exam => {
      const examDate = new Date(exam.examDate);
      const diffTime = examDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  };

  const subjects = user?.schoolYear ? SUBJECTS_BY_YEAR[user.schoolYear as keyof typeof SUBJECTS_BY_YEAR] || [] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planejamento de Estudos</h1>
          <p className="text-muted-foreground">
            Organize seus estudos de acordo com seu ano escolar ({user?.schoolYear || "Não informado"})
          </p>
        </div>
      </div>

      {!studyPlan ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-6 w-6" />
              Criar Plano de Estudos
            </CardTitle>
            <CardDescription>
              Configure seu plano de estudos personalizado baseado em sua grade curricular e disponibilidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="planName">Nome do Plano</Label>
                <Input
                  id="planName"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Ex: Plano de Estudos do 2º Bimestre"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Horas por dia</Label>
                  <Select
                    value={planForm.availableHoursPerDay.toString()}
                    onValueChange={(value) => setPlanForm({ ...planForm, availableHoursPerDay: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="3">3 horas</SelectItem>
                      <SelectItem value="4">4 horas</SelectItem>
                      <SelectItem value="5">5 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Horário de início</Label>
                  <Input
                    type="time"
                    value={planForm.studyStartTime}
                    onChange={(e) => setPlanForm({ ...planForm, studyStartTime: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Horário de fim</Label>
                  <Input
                    type="time"
                    value={planForm.studyEndTime}
                    onChange={(e) => setPlanForm({ ...planForm, studyEndTime: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label>Dias de estudo</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {WEEK_DAYS.map((day) => (
                    <label key={day.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={planForm.studyDays.includes(day.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPlanForm({ ...planForm, studyDays: [...planForm.studyDays, day.key] });
                          } else {
                            setPlanForm({ ...planForm, studyDays: planForm.studyDays.filter(d => d !== day.key) });
                          }
                        }}
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <Button onClick={createStudyPlan} disabled={!planForm.name} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Criar Plano de Estudos
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendário da Semana</TabsTrigger>
            <TabsTrigger value="exams">Provas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Cronograma da Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {weeklyEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`p-4 rounded-lg border ${
                            event.isCompleted 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={event.isCompleted}
                                onChange={() => toggleEventCompletion(event.id)}
                                className="h-4 w-4"
                              />
                              <div>
                                <h4 className="font-medium">{event.subject}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString('pt-BR')} • {event.startTime} - {event.endTime}
                                </p>
                              </div>
                            </div>
                            <Badge variant={event.isCompleted ? "secondary" : "default"}>
                              {event.isCompleted ? "Concluído" : "Pendente"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5" />
                      Matérias do Ano
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((subject) => (
                        <Badge key={subject} variant="outline">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5" />
                      Progresso Semanal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Concluídos</span>
                        <span>{weeklyEvents.filter(e => e.isCompleted).length} / {weeklyEvents.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${weeklyEvents.length > 0 ? (weeklyEvents.filter(e => e.isCompleted).length / weeklyEvents.length) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5" />
                      Próximas Provas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getUpcomingExams().length > 0 ? (
                      <div className="space-y-2">
                        {getUpcomingExams().slice(0, 3).map((exam) => (
                          <div key={exam.id} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <h5 className="font-medium text-sm">{exam.title}</h5>
                            <p className="text-xs text-muted-foreground">
                              {exam.subject} • {new Date(exam.examDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma prova próxima</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exams" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Gerenciar Provas</h2>
              <Dialog open={isAddingExam} onOpenChange={setIsAddingExam}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Prova
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Nova Prova</DialogTitle>
                    <DialogDescription>
                      Adicione uma prova ao seu cronograma para reorganizar automaticamente seus estudos
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="examTitle">Título da Prova</Label>
                      <Input
                        id="examTitle"
                        value={examForm.title}
                        onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                        placeholder="Ex: Prova de Matemática - Equações"
                      />
                    </div>
                    <div>
                      <Label>Matéria</Label>
                      <Select
                        value={examForm.subject}
                        onValueChange={(value) => setExamForm({ ...examForm, subject: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a matéria" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="examDate">Data da Prova</Label>
                      <Input
                        id="examDate"
                        type="date"
                        value={examForm.examDate}
                        onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="examDescription">Descrição (opcional)</Label>
                      <Textarea
                        id="examDescription"
                        value={examForm.description}
                        onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                        placeholder="Tópicos importantes, observações..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddingExam(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addExam} disabled={!examForm.title || !examForm.subject || !examForm.examDate}>
                      Adicionar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <Card key={exam.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{exam.title}</CardTitle>
                    <CardDescription>{exam.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <strong>Data:</strong> {new Date(exam.examDate).toLocaleDateString('pt-BR')}
                      </p>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground">{exam.description}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {exams.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma prova cadastrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione suas provas para que o sistema possa reorganizar automaticamente seu plano de estudos
                  </p>
                  <Button onClick={() => setIsAddingExam(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Prova
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Plano</CardTitle>
                <CardDescription>
                  Ajuste as configurações do seu plano de estudos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Plano Atual: {studyPlan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {studyPlan.availableHoursPerDay}h por dia • {studyPlan.studyStartTime} às {studyPlan.studyEndTime}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Dias de Estudo</h4>
                    <div className="flex flex-wrap gap-2">
                      {studyPlan.studyDays.map((day) => (
                        <Badge key={day} variant="outline">
                          {WEEK_DAYS.find(d => d.key === day)?.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStudyPlan(null);
                      setWeeklyEvents([]);
                      setExams([]);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Plano
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}