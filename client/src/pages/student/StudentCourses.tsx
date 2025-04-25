import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import StudentHeader from "@/components/dashboard/student/StudentHeader";
import StudentSidebar from "@/components/dashboard/student/StudentSidebar";
import { Course } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Search, Filter, BookOpen, Clock, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function StudentCourses() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("in_progress");

  // Fetch student's courses
  const { 
    data: courses, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/student/courses'],
    enabled: !!user,
  });

  // Mock data for presentation
  const mockCourses: (Course & { progress: number, status: 'not_started' | 'in_progress' | 'completed' })[] = [
    {
      id: 1,
      title: "Matemática - Funções",
      description: "Aprenda a resolver funções de 1º e 2º grau com exemplos práticos.",
      category: "Matemática",
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      rating: 4.8,
      moduleCount: 12,
      authorId: 5,
      authorName: "Prof. Ricardo Santos",
      progress: 75,
      status: "in_progress",
      createdAt: "2023-01-15T00:00:00Z"
    },
    {
      id: 2,
      title: "História - Brasil Império",
      description: "Um panorama completo sobre o período imperial brasileiro.",
      category: "História",
      imageUrl: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      rating: 4.6,
      moduleCount: 8,
      authorId: 3,
      authorName: "Profa. Carla Mendes",
      progress: 40,
      status: "in_progress",
      createdAt: "2023-02-10T00:00:00Z"
    },
    {
      id: 3,
      title: "Física - Mecânica",
      description: "Estude os princípios fundamentais da mecânica clássica.",
      category: "Física",
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      rating: 4.9,
      moduleCount: 10,
      authorId: 8,
      authorName: "Prof. André Lima",
      progress: 60,
      status: "in_progress",
      createdAt: "2023-03-05T00:00:00Z"
    },
    {
      id: 4,
      title: "Biologia - Sistema Respiratório",
      description: "Compreenda como funciona o sistema respiratório humano.",
      category: "Biologia",
      imageUrl: "https://images.unsplash.com/photo-1530026186672-2cd00ffc50fe?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      rating: 4.7,
      moduleCount: 6,
      authorId: 2,
      authorName: "Profa. Juliana Costa",
      progress: 100,
      status: "completed",
      createdAt: "2023-01-20T00:00:00Z"
    },
    {
      id: 5,
      title: "Geografia - Clima e Vegetação",
      description: "Estude os diferentes tipos de clima e vegetações do globo.",
      category: "Geografia",
      imageUrl: "https://images.unsplash.com/photo-1569974498991-d3c12a504f95?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      rating: 4.5,
      moduleCount: 7,
      authorId: 4,
      authorName: "Prof. Marcos Silva",
      progress: 0,
      status: "not_started",
      createdAt: "2023-04-12T00:00:00Z"
    }
  ];

  // Filter courses by search term, category and status
  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || course.category === filterCategory;
    const matchesStatus = activeTab === "all" || course.status === activeTab;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories from courses
  const categories = [...new Set(mockCourses.map(course => course.category))];

  // Course Card Component
  function CourseCard({ course }: { course: Course & { progress: number, status: 'not_started' | 'in_progress' | 'completed' } }) {
    return (
      <Card className="overflow-hidden flex flex-col h-full">
        <div className="relative pb-[56.25%]">
          <img 
            src={course.imageUrl} 
            alt={course.title} 
            className="absolute h-full w-full object-cover"
          />
          <div className="absolute top-2 right-2">
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
               course.status === 'completed' ? 'Concluído' : 'Não iniciado'}
            </Badge>
          </div>
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Badge variant="outline" className="bg-primary-50 text-primary border-0 mb-2">
              {course.category}
            </Badge>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF9500" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-neutral-600 ml-1">{course.rating.toFixed(1)}</span>
            </div>
          </div>
          <CardTitle className="text-lg">{course.title}</CardTitle>
          <CardDescription className="line-clamp-2">
            {course.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 pt-0 flex-1">
          <div className="flex justify-between text-sm mb-2">
            <span>{course.moduleCount} módulos</span>
            <span className="text-neutral-500">por {course.authorName}</span>
          </div>
          {course.status !== 'not_started' && (
            <>
              <Progress value={course.progress} className="h-1.5 mb-1" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">{course.progress}% concluído</span>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="pt-2">
          <Button asChild className="w-full gap-2">
            <Link href={`/curso/${course.id}`}>
              {course.status === 'not_started' ? (
                <>
                  <BookOpen className="h-4 w-4" />
                  Iniciar Curso
                </>
              ) : course.status === 'completed' ? (
                <>
                  <Award className="h-4 w-4" />
                  Ver Certificado
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Continuar
                </>
              )}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Loading skeletons
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <div className="relative pb-[56.25%] bg-neutral-200">
          <Skeleton className="absolute inset-0" />
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-1" />
        </CardHeader>
        <CardContent className="pb-2 pt-0">
          <div className="flex justify-between mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-1.5 w-full mb-1" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
        <CardFooter className="pt-2">
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    ));
  };

  return (
    <>
      <Helmet>
        <title>Meus Cursos | Aluno | iAula</title>
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
                  <h1 className="text-2xl font-bold text-neutral-900 font-heading">Meus Cursos</h1>
                  <p className="text-neutral-600 mt-1">
                    Gerencie e acompanhe seu progresso nos cursos
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <Link href="/cursos">
                    <Button className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      Explorar Mais Cursos
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                    <Input
                      placeholder="Pesquisar cursos..."
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
                        <option value="all">Todas as categorias</option>
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
                defaultValue="in_progress" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
                  <TabsTrigger value="completed">Concluídos</TabsTrigger>
                  <TabsTrigger value="not_started">Não Iniciados</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Course Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {renderSkeletons()}
                </div>
              ) : error ? (
                <Card className="p-8 text-center">
                  <CardTitle className="text-lg text-red-500 mb-2">Erro ao carregar os cursos</CardTitle>
                  <CardDescription>
                    Ocorreu um erro ao tentar carregar seus cursos. Por favor, tente novamente mais tarde.
                  </CardDescription>
                  <Button onClick={() => window.location.reload()} className="mt-4">
                    Tentar novamente
                  </Button>
                </Card>
              ) : filteredCourses.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardTitle className="text-lg mb-2">Nenhum curso encontrado</CardTitle>
                  <CardDescription>
                    {searchTerm || filterCategory !== "all" 
                      ? "Não encontramos cursos que correspondam aos seus filtros de busca."
                      : activeTab === "in_progress" 
                        ? "Você não tem cursos em andamento no momento."
                        : activeTab === "completed"
                          ? "Você ainda não concluiu nenhum curso."
                          : activeTab === "not_started"
                            ? "Você não tem cursos não iniciados."
                            : "Você ainda não está matriculado em nenhum curso."}
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
                  {activeTab !== "all" && !searchTerm && filterCategory === "all" && (
                    <Button 
                      onClick={() => setActiveTab("all")} 
                      className="mt-4"
                    >
                      Ver todos os cursos
                    </Button>
                  )}
                  {filteredCourses.length === 0 && !searchTerm && filterCategory === "all" && activeTab === "all" && (
                    <Link href="/cursos">
                      <Button className="mt-4">
                        Explorar Cursos
                      </Button>
                    </Link>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
              
              {/* Certificate Section */}
              {activeTab === "completed" && filteredCourses.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-xl font-semibold mb-6">Meus Certificados</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                      <Card key={`cert-${course.id}`} className="bg-gradient-to-r from-primary-50 to-blue-50 overflow-hidden">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            Certificado de Conclusão
                          </CardTitle>
                          <CardDescription>
                            {course.title}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-neutral-700">
                            <p>Concluído em: {new Date().toLocaleDateString('pt-BR')}</p>
                            <p>Carga horária: {course.moduleCount * 2} horas</p>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full">
                            Ver Certificado
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}