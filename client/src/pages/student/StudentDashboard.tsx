import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { 
  Book, 
  CheckSquare, 
  Medal, 
  Bot, 
  Bookmark, 
  Activity, 
  LayoutGrid, 
  GraduationCap,
  BookOpen,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  PlayCircle,
  Menu,
  X,
  Home,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import iaverseLogo from "@/assets/IAverse.png";

export default function StudentDashboard() {
  const { user } = useAuth();
  const currentDate = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  }).format(currentDate);

  // Fetch student's courses
  const { 
    data: courses, 
    isLoading: coursesLoading 
  } = useQuery({
    queryKey: ['/api/student/courses'],
    enabled: !!user,
  });

  // Fetch student's activities
  const { 
    data: activities, 
    isLoading: activitiesLoading 
  } = useQuery({
    queryKey: ['/api/student/activities'],
    enabled: !!user,
  });

  // Progress summary stats
  const progressStats = [
    {
      title: "Tarefas",
      value: "4 pendentes",
      icon: <CheckSquare className="text-primary h-5 w-5" />,
      href: "/aluno/atividades",
      color: "bg-primary-100"
    },
    {
      title: "Média atual",
      value: "8.5/10",
      icon: <Activity className="text-[#34C759] h-5 w-5" />,
      href: "/aluno/notas",
      color: "bg-[#34C759]/10"
    },
    {
      title: "Cursos",
      value: "3 em andamento",
      icon: <Book className="text-[#FF9500] h-5 w-5" />,
      href: "/aluno/cursos",
      color: "bg-[#FF9500]/10"
    },
    {
      title: "Conquistas",
      value: "12 alcançadas",
      icon: <Medal className="text-neutral-600 h-5 w-5" />,
      href: "/aluno/conquistas",
      color: "bg-neutral-100"
    }
  ];

  // Mock data for presentation
  const mockCourses: (Course & { progress: number, status: 'not_started' | 'in_progress' | 'completed' })[] = [
    {
      id: 1,
      title: "Matemática - Funções",
      description: "Aprenda a resolver funções de 1º e 2º grau com exemplos práticos.",
      category: "Matemática",
      imageUrl: "https://images.unsplash.com/photo-1543286386-713bdd548da4?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      rating: 4.8,
      moduleCount: 12,
      authorId: 5,
      authorName: "Prof. Ricardo Santos",
      progress: 75,
      status: "in_progress"
    },
    {
      id: 2,
      title: "História - Brasil Império",
      description: "Um panorama completo sobre o período imperial brasileiro.",
      category: "História",
      imageUrl: "https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      rating: 4.6,
      moduleCount: 8,
      authorId: 3,
      authorName: "Profa. Carla Mendes",
      progress: 40,
      status: "in_progress"
    },
    {
      id: 3,
      title: "Física - Mecânica",
      description: "Estude os princípios fundamentais da mecânica clássica.",
      category: "Física",
      imageUrl: "https://images.unsplash.com/photo-1576669801184-7b8bed7a61bc?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80",
      rating: 4.9,
      moduleCount: 10,
      authorId: 8,
      authorName: "Prof. André Lima",
      progress: 60,
      status: "in_progress"
    }
  ];

  const mockActivities: ActivityType[] = [
    {
      id: 1,
      title: "Redação - Argumentação",
      description: "Escreva um texto argumentativo sobre o tema \"Educação digital no Brasil\".",
      courseId: 4,
      dueDate: "2023-05-20T23:59:59Z",
      priority: "high",
      category: "Português",
      status: "pending",
      icon: "file-text"
    },
    {
      id: 2,
      title: "Lista de Exercícios - Funções",
      description: "Resolva os exercícios sobre funções de 1º e 2º grau.",
      courseId: 1,
      dueDate: "2023-05-22T23:59:59Z",
      priority: "medium",
      category: "Matemática",
      status: "pending",
      icon: "calculator"
    },
    {
      id: 3,
      title: "Relatório de Experimento",
      description: "Elabore um relatório sobre o experimento de densidade realizado em laboratório.",
      courseId: 6,
      dueDate: "2023-05-25T23:59:59Z",
      priority: "low",
      category: "Ciências",
      status: "pending",
      icon: "flask"
    }
  ];

  const recommendedContent = [
    {
      id: 1,
      title: "Funções do 2º Grau na Prática",
      description: "Vídeo explicativo com exemplos práticos",
      type: "video",
      duration: "12 min",
      category: "Matemática"
    },
    {
      id: 2,
      title: "Técnicas de Redação Argumentativa",
      description: "Material complementar para sua tarefa",
      type: "article",
      duration: "",
      category: "Português"
    },
    {
      id: 3,
      title: "Quiz Interativo: História do Brasil",
      description: "Teste seus conhecimentos sobre o período imperial",
      type: "quiz",
      duration: "",
      category: "História"
    }
  ];

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'file-text':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>;
      case 'calculator':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3563E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="10" x2="8" y2="10"></line><line x1="12" y1="10" x2="12" y2="10"></line><line x1="16" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="8" y2="14"></line><line x1="12" y1="14" x2="12" y2="14"></line><line x1="16" y1="14" x2="16" y2="14"></line><line x1="8" y1="18" x2="8" y2="18"></line><line x1="12" y1="18" x2="12" y2="18"></line><line x1="16" y1="18" x2="16" y2="18"></line></svg>;
      case 'flask':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9 3l6 11h-3l-3-5.5L6 14H3l6-11z"></path><path d="M12 3v5.5M4 14h16a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 012-2z"></path></svg>;
      default:
        return <CheckSquare className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard do Aluno | IAverse</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-neutral-50">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col overflow-auto">
          <StudentHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Welcome Section */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-neutral-900 font-heading">
                  Olá, {user?.firstName || 'Aluno(a)'}!
                </h1>
                <p className="text-neutral-600">{formattedDate}</p>
              </div>

              {/* Progress Summary */}
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {progressStats.map((stat, index) => (
                  <Link href={stat.href} key={index}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-neutral-500">{stat.title}</p>
                            <h3 className="mt-1 text-xl font-semibold text-neutral-900">{stat.value}</h3>
                          </div>
                          <div className={`${stat.color} p-2 rounded-lg`}>
                            {stat.icon}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Courses & Activities */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Current Courses */}
                  <Card>
                    <CardHeader className="px-6 py-5 border-b border-neutral-200 flex justify-between">
                      <CardTitle className="text-lg font-medium">Meus Cursos</CardTitle>
                      <Link href="/aluno/cursos">
                        <Button variant="link" className="text-primary hover:text-primary/90 text-sm font-medium p-0">
                          Ver todos
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="px-6 py-5">
                      <div className="space-y-6">
                        {(coursesLoading ? mockCourses : courses || mockCourses).map((course) => (
                          <div key={course.id} className="flex flex-col sm:flex-row">
                            <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-4">
                              <img 
                                src={course.imageUrl} 
                                alt={course.title} 
                                className="w-full sm:w-32 h-20 object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-medium text-neutral-900">{course.title}</h3>
                                <Badge 
                                  variant="outline" 
                                  className={`
                                    ${course.status === 'in_progress' ? 'bg-primary-50 text-primary' : 
                                    course.status === 'completed' ? 'bg-[#34C759]/10 text-[#34C759]' : 
                                    'bg-[#FF9500]/10 text-[#FF9500]'}
                                    border-0
                                  `}
                                >
                                  {course.status === 'in_progress' ? 'Em andamento' : 
                                   course.status === 'completed' ? 'Concluído' : 'Novo'}
                                </Badge>
                              </div>
                              <p className="text-sm text-neutral-600 mb-3">{course.authorName}</p>
                              <Progress value={course.progress} className="h-1.5 mb-1" />
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-neutral-500">{course.progress}% concluído</span>
                                <Link href={`/curso/${course.id}`}>
                                  <Button variant="link" className="text-xs text-primary hover:text-primary/90 font-medium p-0">
                                    Continuar
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Upcoming Tasks */}
                  <Card>
                    <CardHeader className="px-6 py-5 border-b border-neutral-200 flex justify-between">
                      <CardTitle className="text-lg font-medium">Próximas Tarefas</CardTitle>
                      <Link href="/aluno/atividades">
                        <Button variant="link" className="text-primary hover:text-primary/90 text-sm font-medium p-0">
                          Ver todas
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="px-6 py-5">
                      <div className="space-y-4">
                        {(activitiesLoading ? mockActivities : activities || mockActivities).map((activity) => (
                          <div key={activity.id} className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                            <div className="flex items-start">
                              <div className={`flex-shrink-0 ${
                                activity.priority === 'high' ? 'bg-red-100' : 
                                activity.priority === 'medium' ? 'bg-primary-100' : 
                                'bg-[#34C759]/10'
                              } p-2 rounded-lg mr-4`}>
                                {renderIcon(activity.icon)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className="font-medium text-neutral-900">{activity.title}</h3>
                                  <span className="text-xs text-neutral-500">
                                    Entrega: {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-600 mb-2">{activity.description}</p>
                                <div className="flex">
                                  <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-0 mr-2">
                                    {activity.category}
                                  </Badge>
                                  <Badge variant="outline" className={`
                                    ${activity.priority === 'high' ? 'bg-red-100 text-red-600' : 
                                    activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 
                                    'bg-green-100 text-green-600'}
                                    border-0
                                  `}>
                                    Prioridade {activity.priority === 'high' ? 'alta' : 
                                               activity.priority === 'medium' ? 'média' : 'baixa'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - AI Assistant & Recommendations */}
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
                        Receba ajuda com seus estudos, tire dúvidas e gere conteúdos utilizando diferentes modelos de IA.
                      </p>
                      <Link href="/central-ia">
                        <Button size="lg" className="font-medium">
                          Acessar Central de IAs
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                  
                  {/* Recommended Content */}
                  <Card>
                    <CardHeader className="px-6 py-5 border-b border-neutral-200">
                      <CardTitle className="text-lg font-medium">Conteúdos Recomendados</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-5">
                      <div className="space-y-4">
                        {recommendedContent.map((content) => (
                          <Link href="#content-details" key={content.id}>
                            <Button variant="ghost" className="w-full h-auto p-4 justify-start border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                              <div className="flex items-center w-full">
                                <div className="flex-shrink-0 mr-4">
                                  {content.type === 'video' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3563E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                                  ) : content.type === 'article' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-neutral-900 text-left">{content.title}</h4>
                                  <p className="text-sm text-neutral-600 text-left">{content.description}</p>
                                  <div className="mt-1 flex items-center">
                                    <span className="text-xs text-neutral-500">{content.type === 'video' ? content.duration : content.type}</span>
                                    <span className="mx-2 text-neutral-300">•</span>
                                    <span className="text-xs text-neutral-500">{content.category}</span>
                                  </div>
                                </div>
                              </div>
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Learning Progress */}
                  <Card>
                    <CardHeader className="px-6 py-5 border-b border-neutral-200">
                      <CardTitle className="text-lg font-medium">Meu Progresso</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-neutral-900">Atividades esta semana</h3>
                      </div>
                      <div className="h-28 grid grid-cols-7 gap-1">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, i) => {
                          // Generate heights for current day and previous days
                          const height = i <= 2 ? (10 + Math.floor(Math.random() * 90)) : 0;
                          return (
                            <div key={i} className="flex flex-col items-center justify-end">
                              <div 
                                className={`w-full bg-primary-100 ${i > 2 ? 'opacity-50' : ''} rounded-t`}
                                style={{ height: `${height}%` }}
                              ></div>
                              <span className="text-xs mt-1">{day}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-neutral-700">Meta semanal</span>
                          <span className="text-sm font-medium text-neutral-700">60%</span>
                        </div>
                        <Progress value={60} className="h-2 bg-neutral-200" />
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
