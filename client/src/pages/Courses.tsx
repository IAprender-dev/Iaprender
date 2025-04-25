import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { Course, Category } from "@/lib/types";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CourseCard from "@/components/course/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, LayoutGrid, List, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Courses() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<string>("popularity");

  // Fetch courses
  const { 
    data: courses, 
    isLoading: coursesLoading,
    error: coursesError
  } = useQuery({
    queryKey: ['/api/courses'],
  });

  // Fetch categories
  const { 
    data: categories, 
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Filter and sort courses
  const filteredCourses = courses?.filter((course: Course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Sort courses
  const sortedCourses = [...filteredCourses].sort((a: Course, b: Course) => {
    switch (sortOption) {
      case "popularity":
        return b.rating - a.rating;
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "a-z":
        return a.title.localeCompare(b.title);
      case "z-a":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // No navigation needed, we're filtering in place
  };

  // Loading skeletons
  const renderSkeletons = () => {
    return Array(8).fill(0).map((_, i) => (
      <Card key={i} className="overflow-hidden">
        <div className="relative pb-[56.25%] bg-neutral-200">
          <Skeleton className="absolute inset-0" />
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <>
      <Helmet>
        <title>Cursos | iAula</title>
        <meta name="description" content="Explore nossos cursos educacionais para professores e alunos." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow py-12 bg-neutral-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 font-heading">Cursos</h1>
                <p className="text-neutral-600 mt-2">
                  Explore nossos cursos educacionais e aprimore seus conhecimentos
                </p>
              </div>
              
              <form onSubmit={handleSearch} className="mt-4 md:mt-0 relative">
                <Input
                  type="text"
                  placeholder="Pesquisar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 w-full md:w-64"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-0 top-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-8">
              <div className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Select 
                      value={selectedCategory} 
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {!categoriesLoading && !categoriesError && categories?.map((category: Category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={sortOption} 
                      onValueChange={setSortOption}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popularity">Mais populares</SelectItem>
                        <SelectItem value="newest">Mais recentes</SelectItem>
                        <SelectItem value="a-z">A-Z</SelectItem>
                        <SelectItem value="z-a">Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      title="Visualização em grade"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="icon"
                      onClick={() => setViewMode("list")}
                      title="Visualização em lista"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {filteredCourses.length > 0 && (
                  <div className="mt-4 text-sm text-neutral-600">
                    Mostrando {filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Courses Grid/List */}
            {coursesLoading ? (
              <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-6`}>
                {renderSkeletons()}
              </div>
            ) : coursesError ? (
              <Card className="p-8 text-center">
                <CardTitle className="text-lg text-red-500 mb-2">Erro ao carregar os cursos</CardTitle>
                <CardDescription>
                  Ocorreu um erro ao tentar carregar os cursos. Por favor, tente novamente mais tarde.
                </CardDescription>
                <Button onClick={() => window.location.reload()} className="mt-4">
                  Tentar novamente
                </Button>
              </Card>
            ) : filteredCourses.length === 0 ? (
              <Card className="p-8 text-center">
                <CardTitle className="text-lg mb-2">Nenhum curso encontrado</CardTitle>
                <CardDescription>
                  Não encontramos cursos que correspondam aos critérios de pesquisa.
                </CardDescription>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }} 
                  className="mt-4"
                >
                  Limpar filtros
                </Button>
              </Card>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col space-y-6"
              }>
                {sortedCourses.map((course: Course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    variant={viewMode === "list" ? "featured" : "standard"}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}
