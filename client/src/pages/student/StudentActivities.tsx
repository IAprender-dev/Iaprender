import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import StudentHeader from "@/components/dashboard/student/StudentHeader";
import StudentSidebar from "@/components/dashboard/student/StudentSidebar";
import { Activity } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CheckSquare, FileText, Clock, Calendar, AlertCircle, CheckCircle, Filter } from "lucide-react";

export default function StudentActivities() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch student's activities
  const { 
    data: activities, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/student/activities'],
    enabled: !!user,
  });

  // Mock data for demonstration
  const mockActivities: Activity[] = [
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
    },
    {
      id: 4,
      title: "Apresentação - Revolução Industrial",
      description: "Prepare uma apresentação sobre as consequências da Revolução Industrial.",
      courseId: 2,
      dueDate: "2023-05-10T23:59:59Z",
      priority: "high",
      category: "História",
      status: "completed",
      icon: "presentation"
    },
    {
      id: 5,
      title: "Quiz - Gramática",
      description: "Responda ao quiz sobre regras gramaticais da língua portuguesa.",
      courseId: 4,
      dueDate: "2023-05-08T23:59:59Z",
      priority: "medium",
      category: "Português",
      status: "completed",
      icon: "check-square"
    },
    {
      id: 6,
      title: "Mapa Mental - Fotossíntese",
      description: "Crie um mapa mental explicando o processo de fotossíntese.",
      courseId: 6,
      dueDate: "2023-05-05T23:59:59Z",
      priority: "medium",
      category: "Biologia",
      status: "completed",
      icon: "map"
    },
    {
      id: 7,
      title: "Debate - Inteligência Artificial",
      description: "Prepare argumentos para o debate sobre ética na inteligência artificial.",
      courseId: 3,
      dueDate: "2023-04-30T23:59:59Z",
      priority: "high",
      category: "Tecnologia",
      status: "overdue",
      icon: "message-square"
    },
    {
      id: 8,
      title: "Resenha - Livro",
      description: "Escreva uma resenha crítica do livro indicado.",
      courseId: 4,
      dueDate: "2023-05-01T23:59:59Z",
      priority: "low",
      category: "Literatura",
      status: "overdue",
      icon: "book-open"
    }
  ];

  // Filter activities by search term, category and status
  const filteredActivities = mockActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || activity.category === filterCategory;
    const matchesStatus = activeTab === "all" || activity.status === activeTab;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories from activities
  const categories = [...new Set(mockActivities.map(activity => activity.category))];

  // Sort activities by due date and priority
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (activeTab === 'pending') {
      // For pending activities, sort by due date (closest first)
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      // If dates are equal, sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else {
      // For completed/overdue activities, sort by date (most recent first)
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
  });

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'file-text':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>;
      case 'calculator':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3563E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="10" x2="8" y2="10"></line><line x1="12" y1="10" x2="12" y2="10"></line><line x1="16" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="8" y2="14"></line><line x1="12" y1="14" x2="12" y2="14"></line><line x1="16" y1="14" x2="16" y2="14"></line><line x1="8" y1="18" x2="8" y2="18"></line><line x1="12" y1="18" x2="12" y2="18"></line><line x1="16" y1="18" x2="16" y2="18"></line></svg>;
      case 'flask':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M9 3l6 11h-3l-3-5.5L6 14H3l6-11z"></path><path d="M12 3v5.5M4 14h16a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 012-2z"></path></svg>;
      case 'presentation':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M2 3h20M2 3v14a2 2 0 002 2h16a2 2 0 002-2V3M2 3v14a2 2 0 002 2h16a2 2 0 002-2V3M12 9v6M8 9h8"></path></svg>;
      case 'check-square':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3563E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>;
      case 'map':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>;
      case 'message-square':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>;
      case 'book-open':
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"></path></svg>;
      default:
        return <CheckSquare className="h-4 w-4" />;
    }
  };

  // Format due date
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Atrasado por ${Math.abs(diffDays)} dias`;
    } else if (diffDays === 0) {
      return "Hoje";
    } else if (diffDays === 1) {
      return "Amanhã";
    } else if (diffDays < 7) {
      return `Em ${diffDays} dias`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  // Check if due date is close
  const isDueDateClose = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= 2;
  };

  // Loading skeletons
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, i) => (
      <Card key={i} className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start">
            <Skeleton className="h-10 w-10 rounded-lg mr-4" />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <div className="flex mt-2">
                <Skeleton className="h-6 w-16 mr-2" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <>
      <Helmet>
        <title>Minhas Atividades | Aluno | iAula</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-neutral-50">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <StudentHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 font-heading">Minhas Atividades</h1>
                  <p className="text-neutral-600 mt-1">
                    Gerencie tarefas, trabalhos e atividades dos seus cursos
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Button className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Ver Calendário
                  </Button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                    <Input
                      placeholder="Pesquisar atividades..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <div className="relative inline-block">
                      <select 
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-8 appearance-none"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="all">Todas as disciplinas</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs 
                defaultValue="pending" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="pending" className="relative">
                    Pendentes
                    {mockActivities.filter(a => a.status === "pending").length > 0 && (
                      <Badge className="ml-2 bg-primary text-white">{mockActivities.filter(a => a.status === "pending").length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="completed">Concluídas</TabsTrigger>
                  <TabsTrigger value="overdue" className="relative">
                    Atrasadas
                    {mockActivities.filter(a => a.status === "overdue").length > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white">{mockActivities.filter(a => a.status === "overdue").length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Activities List */}
              {isLoading ? (
                <div>
                  {renderSkeletons()}
                </div>
              ) : error ? (
                <Card className="p-8 text-center">
                  <CardTitle className="text-lg text-red-500 mb-2">Erro ao carregar as atividades</CardTitle>
                  <CardDescription>
                    Ocorreu um erro ao tentar carregar suas atividades. Por favor, tente novamente mais tarde.
                  </CardDescription>
                  <Button onClick={() => window.location.reload()} className="mt-4">
                    Tentar novamente
                  </Button>
                </Card>
              ) : sortedActivities.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardTitle className="text-lg mb-2">Nenhuma atividade encontrada</CardTitle>
                  <CardDescription>
                    {searchTerm || filterCategory !== "all" 
                      ? "Não encontramos atividades que correspondam aos seus filtros de busca."
                      : activeTab === "pending" 
                        ? "Você não tem atividades pendentes no momento."
                        : activeTab === "completed"
                          ? "Você ainda não concluiu nenhuma atividade."
                          : activeTab === "overdue"
                            ? "Você não tem atividades atrasadas."
                            : "Você não tem nenhuma atividade."}
                  </CardDescription>
                  {(searchTerm || filterCategory !== "all") && (
                    <Button 
                      onClick={() => {
                        setSearchTerm("");
                        setFilterCategory("all");
                      }} 
                      className="mt-4"
                    >
                      Limpar filtros
                    </Button>
                  )}
                </Card>
              ) : (
                <div>
                  {sortedActivities.map((activity) => (
                    <Card key={activity.id} className="mb-4">
                      <CardContent className="p-4">
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
                              <div className="flex items-center">
                                {activity.status === 'pending' && isDueDateClose(activity.dueDate) ? (
                                  <Badge variant="outline" className="bg-red-100 text-red-600 border-0">
                                    {formatDueDate(activity.dueDate)}
                                  </Badge>
                                ) : activity.status === 'overdue' ? (
                                  <Badge variant="outline" className="bg-red-100 text-red-600 border-0 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {formatDueDate(activity.dueDate)}
                                  </Badge>
                                ) : activity.status === 'completed' ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-600 border-0 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Concluída
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-0">
                                    {formatDueDate(activity.dueDate)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-neutral-600 mb-2">{activity.description}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-0">
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
                            <div className="flex mt-4">
                              {activity.status === 'pending' && (
                                <Button className="gap-2 mr-2">
                                  <FileText className="h-4 w-4" />
                                  Enviar Tarefa
                                </Button>
                              )}
                              {activity.status === 'completed' && (
                                <Button variant="outline" className="gap-2 mr-2">
                                  <FileText className="h-4 w-4" />
                                  Ver Feedback
                                </Button>
                              )}
                              <Button variant={activity.status === 'pending' ? 'outline' : 'default'} className="gap-2">
                                <Clock className="h-4 w-4" />
                                {activity.status === 'completed' ? 'Reenviar' : 'Ver Detalhes'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}