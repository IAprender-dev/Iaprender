import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { CalendarCheck2, CheckSquare, FilePlus, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import AIAssistant from "@/components/ai/AIAssistant";
import AIToolsPanel from "@/components/ai/AIToolsPanel";
import { ScheduleEvent, StudentPerformance } from "@/lib/types";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  }).format(currentDate);

  // Fetch teacher's schedule
  const { 
    data: scheduleEvents, 
    isLoading: scheduleLoading 
  } = useQuery({
    queryKey: ['/api/teacher/schedule'],
    enabled: !!user,
  });

  // Fetch student performance data
  const { 
    data: performanceData, 
    isLoading: performanceLoading 
  } = useQuery({
    queryKey: ['/api/teacher/performance'],
    enabled: !!user,
  });

  // Fetch professional development courses
  const { 
    data: devCourses, 
    isLoading: devCoursesLoading 
  } = useQuery({
    queryKey: ['/api/teacher/development-courses'],
    enabled: !!user,
  });

  const quickActionLinks = [
    {
      title: "Criar Plano de Aula",
      icon: <CalendarCheck2 className="text-primary h-5 w-5" />,
      href: "/professor/planejamento",
      color: "bg-primary-100"
    },
    {
      title: "Corrigir Atividades",
      icon: <CheckSquare className="text-primary h-5 w-5" />,
      href: "/professor/atividades",
      color: "bg-primary-100"
    },
    {
      title: "Criar Conteúdo",
      icon: <FilePlus className="text-primary h-5 w-5" />,
      href: "/professor/cursos/criar",
      color: "bg-primary-100"
    },
    {
      title: "Assistente Virtual",
      icon: <Bot className="text-primary h-5 w-5" />,
      href: "/professor/ferramentas",
      color: "bg-primary-100"
    }
  ];

  // Mock data for demonstration purposes
  const mockScheduleEvents: ScheduleEvent[] = [
    {
      id: 1,
      title: "Aula de Matemática - 8º ano A",
      description: "Introdução a Álgebra - Sala 15",
      time: "08:00",
      date: "Hoje",
      location: "Sala 15",
      status: "active"
    },
    {
      id: 2,
      title: "Reunião Pedagógica",
      description: "Avaliação bimestral - Sala dos professores",
      time: "10:30",
      date: "Hoje",
      location: "Sala dos professores",
      status: "upcoming"
    },
    {
      id: 3,
      title: "Aula de Matemática - 7º ano C",
      description: "Geometria Espacial - Sala 12",
      time: "14:15",
      date: "Hoje",
      location: "Sala 12",
      status: "upcoming"
    },
    {
      id: 4,
      title: "Aula de Matemática - 9º ano B",
      description: "Funções do 2º grau - Sala 18",
      time: "09:00",
      date: "Amanhã",
      location: "Sala 18",
      status: "upcoming"
    }
  ];

  const mockPerformanceData: StudentPerformance[] = [
    { className: "8º ano A", averageGrade: 7.8, percentage: 78 },
    { className: "7º ano C", averageGrade: 6.5, percentage: 65 },
    { className: "9º ano B", averageGrade: 8.3, percentage: 83 }
  ];

  const mockDevCourses = [
    {
      id: 1,
      title: "IA para Educadores",
      description: "Integração de IA em sala de aula",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      progress: 35
    },
    {
      id: 2,
      title: "Metodologias Ativas",
      description: "Engajamento e participação dos alunos",
      imageUrl: "https://images.unsplash.com/photo-1581093458791-9f5a1d2c2394?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80",
      progress: 65
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard do Professor | iAula</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-neutral-50">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-auto">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-neutral-900 font-heading">
                  Olá, {user?.firstName || 'Professor(a)'}!
                </h1>
                <p className="text-neutral-600">{formattedDate}</p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {quickActionLinks.map((action, index) => (
                  <Link href={action.href} key={index}>
                    <Button 
                      variant="outline" 
                      className="bg-white p-4 h-auto rounded-lg border border-neutral-200 hover:shadow-md transition-shadow flex items-center w-full"
                    >
                      <div className={`${action.color} rounded-full w-10 h-10 flex items-center justify-center mr-4`}>
                        {action.icon}
                      </div>
                      <span className="text-neutral-700 font-medium">{action.title}</span>
                    </Button>
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Schedule & Performance */}
                <div className="lg:col-span-2 space-y-8">
                  {/* AI Tools Panel com link para Central de IAs */}
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg mb-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">
                            Ferramentas de IA para seu dia a dia
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Explore e utilize diferentes tecnologias de IA para otimizar seu trabalho, criar conteúdo educacional e aprimorar sua prática pedagógica.
                          </p>
                        </div>
                        <Link href="/central-ia">
                          <Button variant="secondary" className="whitespace-nowrap">
                            <Bot className="mr-2 h-4 w-4" />
                            Acessar Central de IAs
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <AIToolsPanel />
                  </div>
                  
                  {/* Student Performance */}
                  <Card>
                    <CardHeader className="px-6 py-5 border-b border-neutral-200">
                      <CardTitle className="text-lg font-medium">Desempenho dos Alunos</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-medium text-neutral-900">Média por Turma</h3>
                          <p className="text-sm text-neutral-600">Últimas avaliações</p>
                        </div>
                        <select className="bg-white border border-neutral-300 rounded-md text-sm px-3 py-1.5">
                          <option>Todos os tópicos</option>
                          <option>Álgebra</option>
                          <option>Geometria</option>
                          <option>Estatística</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        {(performanceLoading ? mockPerformanceData : performanceData || mockPerformanceData).map((classData, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-neutral-700">{classData.className}</span>
                              <span className="text-sm font-medium text-neutral-700">{classData.averageGrade}/10</span>
                            </div>
                            <Progress 
                              value={classData.percentage} 
                              className={`h-2 ${
                                classData.percentage >= 80 ? 'bg-[#34C759]/20' : 
                                classData.percentage >= 70 ? 'bg-primary/20' : 
                                'bg-[#FF9500]/20'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 text-center">
                        <Link href="/professor/alunos/analytics">
                          <Button variant="link" className="text-primary hover:text-primary/90 text-sm font-medium p-0">
                            Ver análise detalhada
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - AI Assistant & Professional Development */}
                <div className="space-y-8">
                  {/* Central de IAs Link */}
                  <Card className="h-[550px] flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium">
                        Central de IAs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-6">
                        <Bot className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        Explore nossa Central de Inteligência Artificial
                      </h3>
                      <p className="text-neutral-600 mb-8 max-w-md">
                        Experimente diferentes IAs como ChatGPT, Claude, Perplexity e geração de imagens em uma interface unificada.
                      </p>
                      <Link href="/central-ia">
                        <Button size="lg" className="font-medium">
                          Acessar Central de IAs
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                  
                  {/* Professional Development */}
                  <Card>
                    <CardHeader className="px-6 py-5 border-b border-neutral-200 flex justify-between">
                      <CardTitle className="text-lg font-medium">Desenvolvimento Profissional</CardTitle>
                      <Link href="/professor/desenvolvimento">
                        <Button variant="link" className="text-primary hover:text-primary/90 text-sm font-medium p-0">
                          Ver mais
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="px-6 py-5">
                      <div className="space-y-4">
                        {(devCoursesLoading ? mockDevCourses : devCourses || mockDevCourses).map((course) => (
                          <div key={course.id} className="flex">
                            <div className="flex-shrink-0 mr-4">
                              <img 
                                src={course.imageUrl} 
                                alt={course.title} 
                                className="w-16 h-16 object-cover rounded"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900">{course.title}</h4>
                              <p className="text-sm text-neutral-600 mb-1">{course.description}</p>
                              <Progress value={course.progress} className="h-1.5 mb-1" />
                              <p className="text-xs text-neutral-500">{course.progress}% concluído</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5">
                        <Link href="/professor/desenvolvimento/recomendados">
                          <Button variant="outline" className="w-full">
                            Cursos recomendados para você
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
