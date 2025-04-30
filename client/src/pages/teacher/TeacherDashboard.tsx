import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { 
  CalendarCheck2, 
  CheckSquare, 
  FilePlus, 
  Bot, 
  Sparkles, 
  Search, 
  ImageIcon, 
  BookOpen, 
  PenTool, 
  BarChart,
  Users,
  FileText,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import AIToolsPanel from "@/components/ai/AIToolsPanel";
import { ScheduleEvent, StudentPerformance } from "@/lib/types";

// Definir tipos para os cursos de desenvolvimento
interface DevCourse {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  progress: number;
}

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
      icon: <CalendarCheck2 className="text-blue-600 h-5 w-5" />,
      href: "/professor/planejamento",
      color: "bg-blue-50"
    },
    {
      title: "Corrigir Atividades",
      icon: <CheckSquare className="text-blue-600 h-5 w-5" />,
      href: "/professor/atividades",
      color: "bg-blue-50"
    },
    {
      title: "Criar Conteúdo",
      icon: <FilePlus className="text-blue-600 h-5 w-5" />,
      href: "/professor/cursos/criar",
      color: "bg-blue-50"
    },
    {
      title: "Assistente Virtual",
      icon: <Bot className="text-blue-600 h-5 w-5" />,
      href: "/professor/ferramentas",
      color: "bg-blue-50"
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

  const mockDevCourses: DevCourse[] = [
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

      <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-auto">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 font-heading">
                  Olá, {user?.firstName || 'Professor(a)'}!
                </h1>
                <p className="text-neutral-600">{formattedDate}</p>
              </div>

              {/* Hero AI Section */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl overflow-hidden shadow-lg">
                  <div className="p-8 md:p-10 flex flex-col md:flex-row items-center">
                    <div className="md:w-3/5 mb-6 md:mb-0 md:pr-8">
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        Transforme o aprendizado com IA personalizada
                      </h2>
                      <p className="text-blue-100 mb-6 text-lg leading-relaxed">
                        Acesse nossa Central de IAs e descubra como as ferramentas de inteligência artificial podem revolucionar sua prática pedagógica e otimizar seu tempo.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link href="/central-ia">
                          <Button className="bg-white text-blue-600 hover:bg-blue-50 font-medium text-base">
                            Acessar Central de IAs
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href="/professor/cursos/ai-na-educacao">
                          <Button variant="outline" className="bg-transparent text-white hover:bg-blue-700 border-white">
                            Ver cursos sobre IA
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="md:w-2/5 flex justify-center">
                      <div className="w-48 h-48 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 rounded-full bg-blue-700/30 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-blue-600/50 flex items-center justify-center">
                              <Sparkles className="w-12 h-12 text-white" />
                            </div>
                          </div>
                        </div>
                        {/* Círculos orbitando */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-300/80 flex items-center justify-center">
                          <Search className="w-4 h-4 text-blue-900" />
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-300/80 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-blue-900" />
                        </div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-300/80 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-blue-900" />
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-300/80 flex items-center justify-center">
                          <PenTool className="w-4 h-4 text-blue-900" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-6 text-neutral-900">Ferramentas rápidas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Link href="/professor/planejamento" className="block">
                    <div className="group h-full bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 flex flex-col">
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="mb-5 bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center">
                          <CalendarCheck2 className="text-blue-500 h-6 w-6" />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">Plano de Aula</h3>
                        <p className="text-sm text-gray-500 mb-4">Criar ou gerenciar planos de aula</p>
                        <div className="mt-auto pt-4 flex items-center text-blue-500 text-sm font-medium group-hover:text-blue-600 transition-colors">
                          Acessar 
                          <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/professor/atividades" className="block">
                    <div className="group h-full bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 flex flex-col">
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="mb-5 bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center">
                          <CheckSquare className="text-blue-500 h-6 w-6" />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">Atividades</h3>
                        <p className="text-sm text-gray-500 mb-4">Corrigir e avaliar atividades</p>
                        <div className="mt-auto pt-4 flex items-center text-blue-500 text-sm font-medium group-hover:text-blue-600 transition-colors">
                          Acessar 
                          <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/professor/cursos/criar" className="block">
                    <div className="group h-full bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 flex flex-col">
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="mb-5 bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center">
                          <FilePlus className="text-blue-500 h-6 w-6" />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">Conteúdo</h3>
                        <p className="text-sm text-gray-500 mb-4">Criar materiais didáticos</p>
                        <div className="mt-auto pt-4 flex items-center text-blue-500 text-sm font-medium group-hover:text-blue-600 transition-colors">
                          Acessar 
                          <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/professor/alunos" className="block">
                    <div className="group h-full bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 flex flex-col">
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="mb-5 bg-blue-50 w-14 h-14 rounded-full flex items-center justify-center">
                          <Users className="text-blue-500 h-6 w-6" />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">Alunos</h3>
                        <p className="text-sm text-gray-500 mb-4">Gerenciar turmas e alunos</p>
                        <div className="mt-auto pt-4 flex items-center text-blue-500 text-sm font-medium group-hover:text-blue-600 transition-colors">
                          Acessar 
                          <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
