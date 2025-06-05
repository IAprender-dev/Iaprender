import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import { Course } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit, Trash, PlusCircle, Search, BarChart, FileText, Download } from "lucide-react";

export default function TeacherCourses() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch teacher's courses
  const { 
    data: courses, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/teacher/courses'],
    enabled: !!user,
  });

  // Filter courses by search term
  const filteredCourses = courses?.filter((course: Course) => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Course card component
  function CourseCard({ course }: { course: Course }) {
    return (
      <Card className="overflow-hidden flex flex-col h-full">
        <div className="relative pb-[40%]">
          <img 
            src={course.imageUrl} 
            alt={course.title} 
            className="absolute inset-0 w-full h-full object-cover" 
          />
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Badge variant="default" className="mb-2">
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
        <CardContent className="pb-4 pt-0">
          <div className="flex justify-between text-sm">
            <span>{course.moduleCount} módulos</span>
            <span className="text-neutral-500">por {course.authorName}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2 mt-auto">
          <Button variant="outline" size="sm" className="gap-1">
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="px-2">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="px-2">
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Loading skeletons
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, i) => (
      <Card key={i} className="overflow-hidden flex flex-col h-full">
        <div className="relative pb-[40%] bg-neutral-200">
          <Skeleton className="absolute inset-0" />
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Skeleton className="h-5 w-20 mb-2" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3 mt-1" />
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2 mt-auto">
          <Skeleton className="h-9 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <>
      <Helmet>
        <title>Meus Cursos | Professor | iAula</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-neutral-50">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Page Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 font-heading">Meus Cursos</h1>
                  <p className="text-neutral-600 mt-1">
                    Gerencie seus cursos e materiais didáticos
                  </p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
                  <Button asChild className="gap-2">
                    <Link href="/professor/cursos/criar">
                      <PlusCircle className="h-4 w-4" />
                      Criar Novo Curso
                    </Link>
                  </Button>
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
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                      <BarChart className="h-4 w-4" />
                      Relatórios
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <FileText className="h-4 w-4" />
                      Materiais
                    </Button>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="all" className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="published">Publicados</TabsTrigger>
                  <TabsTrigger value="drafts">Rascunhos</TabsTrigger>
                  <TabsTrigger value="archived">Arquivados</TabsTrigger>
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
                  {searchTerm ? (
                    <>
                      <CardTitle className="text-lg mb-2">Nenhum curso encontrado</CardTitle>
                      <CardDescription>
                        Não encontramos cursos que correspondam à sua pesquisa por "{searchTerm}".
                      </CardDescription>
                      <Button 
                        onClick={() => setSearchTerm("")} 
                        className="mt-4"
                      >
                        Limpar pesquisa
                      </Button>
                    </>
                  ) : (
                    <>
                      <CardTitle className="text-lg mb-2">Você ainda não tem cursos</CardTitle>
                      <CardDescription>
                        Comece criando seu primeiro curso para compartilhar seu conhecimento.
                      </CardDescription>
                      <Button 
                        asChild
                        className="mt-4 gap-2"
                      >
                        <Link href="/professor/cursos/criar">
                          <PlusCircle className="h-4 w-4" />
                          Criar Novo Curso
                        </Link>
                      </Button>
                    </>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course: Course) => (
                    <CourseCard key={course.id} course={course} />
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
