import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Course, CourseModule, CourseContent } from "@/lib/types";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Play, 
  FileText, 
  MessageSquare, 
  Download,
  Award
} from "lucide-react";

export default function CourseDetails() {
  const [, params] = useRoute("/curso/:id");
  const courseId = params?.id ? parseInt(params.id) : 0;
  const [activeTab, setActiveTab] = useState("overview");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Fetch course data
  const { 
    data: course, 
    isLoading: courseLoading, 
    error: courseError 
  } = useQuery({
    queryKey: [`/api/course/${courseId}`],
    enabled: !!courseId,
  });

  // Fetch course modules
  const { 
    data: modules, 
    isLoading: modulesLoading, 
    error: modulesError 
  } = useQuery({
    queryKey: [`/api/course/${courseId}/modules`],
    enabled: !!courseId,
  });

  // Mock data for display purposes
  const mockCourse: Course = {
    id: courseId,
    title: "Matemática - Funções",
    description: "Um curso completo sobre funções de 1º e 2º grau, com exemplos práticos e aplicações no cotidiano. Ideal para estudantes do ensino médio e professores que desejam aprimorar suas técnicas de ensino.",
    category: "Matemática",
    imageUrl: "https://images.unsplash.com/photo-1580894912989-0bc892f4efd0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    rating: 4.8,
    moduleCount: 12,
    authorId: 5,
    authorName: "Prof. Ricardo Santos",
    createdAt: "2023-03-15T12:00:00Z"
  };

  const mockModules: CourseModule[] = [
    {
      id: 1,
      courseId: courseId,
      title: "Introdução às Funções",
      description: "Conceitos básicos e definições",
      position: 1
    },
    {
      id: 2,
      courseId: courseId,
      title: "Funções de 1º Grau",
      description: "Características e gráficos",
      position: 2
    },
    {
      id: 3,
      courseId: courseId,
      title: "Funções de 2º Grau",
      description: "Parábolas e aplicações",
      position: 3
    }
  ];

  const mockContents: CourseContent[] = [
    {
      id: 101,
      moduleId: 1,
      title: "O que são funções?",
      type: "video",
      contentUrl: "https://youtu.be/watch?v=dQw4w9WgXcQ",
      duration: 15
    },
    {
      id: 102,
      moduleId: 1,
      title: "Domínio e Imagem",
      type: "video",
      contentUrl: "https://youtu.be/watch?v=dQw4w9WgXcQ",
      duration: 12
    },
    {
      id: 201,
      moduleId: 2,
      title: "Coeficientes da função linear",
      type: "video",
      contentUrl: "https://youtu.be/watch?v=dQw4w9WgXcQ",
      duration: 20
    },
    {
      id: 202,
      moduleId: 2,
      title: "Construção de Gráficos",
      type: "pdf",
      contentUrl: "/files/graficos-funcao-linear.pdf"
    },
    {
      id: 301,
      moduleId: 3,
      title: "Vértice da Parábola",
      type: "video",
      contentUrl: "https://youtu.be/watch?v=dQw4w9WgXcQ",
      duration: 18
    },
    {
      id: 302,
      moduleId: 3,
      title: "Exercícios Resolvidos",
      type: "quiz",
      contentUrl: "/quiz/funcao-quadratica"
    }
  ];

  // Group content by module
  const contentByModule = mockModules.map(module => {
    return {
      ...module,
      contents: mockContents.filter(content => content.moduleId === module.id)
    };
  });

  // Calculate total course duration
  const totalDuration = mockContents
    .filter(content => content.type === "video")
    .reduce((total, content) => total + (content.duration || 0), 0);

  const currentContent = mockContents[currentVideoIndex];

  return (
    <>
      <Helmet>
        <title>{courseLoading ? "Carregando..." : (course?.title || mockCourse.title)} | iAula</title>
        <meta name="description" content={courseLoading ? "" : (course?.description || mockCourse.description)} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow py-12 bg-neutral-50">
          <div className="container mx-auto px-4">
            {courseLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <div className="h-[400px] bg-neutral-200 rounded-lg" />
              </div>
            ) : courseError ? (
              <Card className="p-8 text-center">
                <CardTitle className="text-lg text-red-500 mb-2">Erro ao carregar o curso</CardTitle>
                <CardDescription>
                  Ocorreu um erro ao tentar carregar os detalhes do curso. Por favor, tente novamente mais tarde.
                </CardDescription>
                <Button onClick={() => window.location.reload()} className="mt-4">
                  Tentar novamente
                </Button>
              </Card>
            ) : (
              <>
                {/* Course Header */}
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="md:w-2/3">
                    <h1 className="text-3xl font-bold text-neutral-900 font-heading mb-4">
                      {course?.title || mockCourse.title}
                    </h1>
                    <p className="text-neutral-600 mb-6">
                      {course?.description || mockCourse.description}
                    </p>
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center">
                        <Badge variant="outline" className="bg-primary-50 text-primary border-0">
                          {course?.category || mockCourse.category}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-neutral-500 mr-2" />
                        <span className="text-sm text-neutral-600">1,245 alunos</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                        <span className="text-sm text-neutral-600">Atualizado em {new Date(course?.createdAt || mockCourse.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 text-neutral-500 mr-2" />
                        <span className="text-sm text-neutral-600">{course?.moduleCount || mockCourse.moduleCount} módulos</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF9500" className="w-4 h-4 mr-1">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-neutral-600">{course?.rating || mockCourse.rating} (87 avaliações)</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button size="lg" className="gap-2">
                        <Play className="h-4 w-4" />
                        Continuar Curso
                      </Button>
                      <Button size="lg" variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Material de Apoio
                      </Button>
                    </div>
                  </div>
                  <div className="md:w-1/3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Seu progresso</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-neutral-700">40% concluído</span>
                            <span className="text-sm font-medium text-neutral-700">8/20 aulas</span>
                          </div>
                          <Progress value={40} className="h-2" />
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Tempo Total do Curso:</span>
                            <span className="font-medium">{totalDuration} minutos</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Professor:</span>
                            <span className="font-medium">{course?.authorName || mockCourse.authorName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Certificado:</span>
                            <span className="font-medium">Disponível</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <Button variant="outline" className="w-full gap-2">
                            <Award className="h-4 w-4" />
                            Ver Certificado
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* Course Content Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-8">
                  <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start px-4 pt-4 bg-transparent border-b border-neutral-200">
                      <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                        Visão Geral
                      </TabsTrigger>
                      <TabsTrigger value="content" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                        Conteúdo
                      </TabsTrigger>
                      <TabsTrigger value="discussions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                        Discussões
                      </TabsTrigger>
                      <TabsTrigger value="materials" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none">
                        Materiais
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2">
                          <h2 className="text-xl font-semibold mb-4">Sobre este curso</h2>
                          <div className="space-y-4 text-neutral-700">
                            <p>
                              Neste curso, você aprenderá todos os conceitos fundamentais das funções de 1º e 2º grau, com exemplos práticos e aplicações no cotidiano. A matemática se tornará mais intuitiva e você compreenderá como esse conhecimento pode ser aplicado na resolução de problemas reais.
                            </p>
                            <p>
                              Nosso material foi cuidadosamente desenvolvido para guiá-lo através dos conceitos mais desafiadores de forma clara e objetiva. As aulas são apresentadas em um formato dinâmico, com recursos visuais e interativos que facilitam a compreensão e fixação do conteúdo.
                            </p>
                            <h3 className="text-lg font-semibold mt-6 mb-2">Objetivos de Aprendizagem:</h3>
                            <ul className="list-disc pl-5 space-y-2">
                              <li>Compreender os conceitos fundamentais de funções</li>
                              <li>Analisar e construir gráficos de funções de 1º grau</li>
                              <li>Identificar as características das funções de 2º grau</li>
                              <li>Aplicar os conhecimentos na resolução de problemas práticos</li>
                              <li>Desenvolver raciocínio lógico-matemático</li>
                            </ul>
                          </div>
                          
                          <div className="mt-8">
                            <h2 className="text-xl font-semibold mb-4">Pré-requisitos</h2>
                            <ul className="list-disc pl-5 space-y-2 text-neutral-700">
                              <li>Conhecimentos básicos de álgebra</li>
                              <li>Familiaridade com operações matemáticas fundamentais</li>
                            </ul>
                          </div>
                        </div>
                        
                        <div>
                          <h2 className="text-xl font-semibold mb-4">Esse curso inclui:</h2>
                          <ul className="space-y-3">
                            <li className="flex items-start">
                              <Play className="h-5 w-5 text-primary mr-3 mt-0.5" />
                              <div>
                                <p className="font-medium">12 horas de vídeo</p>
                                <p className="text-sm text-neutral-600">Aulas detalhadas com explicações claras</p>
                              </div>
                            </li>
                            <li className="flex items-start">
                              <FileText className="h-5 w-5 text-primary mr-3 mt-0.5" />
                              <div>
                                <p className="font-medium">20 materiais de apoio</p>
                                <p className="text-sm text-neutral-600">PDFs e planilhas para estudo complementar</p>
                              </div>
                            </li>
                            <li className="flex items-start">
                              <MessageSquare className="h-5 w-5 text-primary mr-3 mt-0.5" />
                              <div>
                                <p className="font-medium">Acesso à comunidade</p>
                                <p className="text-sm text-neutral-600">Tire dúvidas e interaja com outros estudantes</p>
                              </div>
                            </li>
                            <li className="flex items-start">
                              <Award className="h-5 w-5 text-primary mr-3 mt-0.5" />
                              <div>
                                <p className="font-medium">Certificado de conclusão</p>
                                <p className="text-sm text-neutral-600">Ao completar todas as aulas do curso</p>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Content Tab */}
                    <TabsContent value="content" className="p-0">
                      <div className="md:flex">
                        {/* Content List */}
                        <div className="md:w-1/3 border-r border-neutral-200 h-[600px] overflow-y-auto">
                          {modulesLoading ? (
                            <div className="p-4 space-y-6">
                              {[1, 2, 3].map((_, i) => (
                                <div key={i} className="space-y-2">
                                  <Skeleton className="h-6 w-full" />
                                  <Skeleton className="h-4 w-3/4" />
                                  <Skeleton className="h-16 w-full" />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div>
                              {contentByModule.map((module, moduleIndex) => (
                                <div key={module.id} className="border-b border-neutral-200 last:border-b-0">
                                  <div className="p-4 bg-neutral-50">
                                    <h3 className="font-medium text-neutral-900">
                                      Módulo {module.position}: {module.title}
                                    </h3>
                                    <p className="text-sm text-neutral-600">{module.description}</p>
                                  </div>
                                  <ul>
                                    {module.contents.map((content, contentIndex) => {
                                      const globalIndex = mockContents.findIndex(c => c.id === content.id);
                                      return (
                                        <li 
                                          key={content.id}
                                          className={`px-4 py-3 border-t border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer flex items-center ${
                                            globalIndex === currentVideoIndex ? 'bg-primary-50' : ''
                                          }`}
                                          onClick={() => setCurrentVideoIndex(globalIndex)}
                                        >
                                          {content.type === 'video' && (
                                            <Play className={`h-4 w-4 mr-3 ${
                                              globalIndex === currentVideoIndex ? 'text-primary' : 'text-neutral-500'
                                            }`} />
                                          )}
                                          {content.type === 'pdf' && (
                                            <FileText className={`h-4 w-4 mr-3 ${
                                              globalIndex === currentVideoIndex ? 'text-primary' : 'text-neutral-500'
                                            }`} />
                                          )}
                                          {content.type === 'quiz' && (
                                            <MessageSquare className={`h-4 w-4 mr-3 ${
                                              globalIndex === currentVideoIndex ? 'text-primary' : 'text-neutral-500'
                                            }`} />
                                          )}
                                          <div>
                                            <p className={`font-medium ${
                                              globalIndex === currentVideoIndex ? 'text-primary' : 'text-neutral-900'
                                            }`}>
                                              {content.title}
                                            </p>
                                            {content.type === 'video' && content.duration && (
                                              <p className="text-xs text-neutral-500">
                                                {content.duration} minutos
                                              </p>
                                            )}
                                          </div>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Content Viewer */}
                        <div className="md:w-2/3 p-4">
                          {currentContent && (
                            <div>
                              {currentContent.type === 'video' && (
                                <div className="bg-black rounded-lg overflow-hidden mb-4 aspect-video flex items-center justify-center">
                                  <div className="text-white text-center p-8">
                                    <Play className="h-12 w-12 mx-auto mb-4" />
                                    <p className="text-lg font-medium">
                                      Reprodutor de vídeo (Simulação)
                                    </p>
                                    <p className="text-sm opacity-80 mt-2">
                                      Em um ambiente de produção, este seria um player de vídeo real.
                                    </p>
                                  </div>
                                </div>
                              )}
                              {currentContent.type === 'pdf' && (
                                <div className="bg-neutral-100 rounded-lg overflow-hidden mb-4 aspect-video flex items-center justify-center">
                                  <div className="text-center p-8">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-700" />
                                    <p className="text-lg font-medium text-neutral-800">
                                      Visualizador de PDF (Simulação)
                                    </p>
                                    <p className="text-sm text-neutral-600 mt-2">
                                      Em um ambiente de produção, este seria um visualizador de PDF real.
                                    </p>
                                    <Button className="mt-4">
                                      Download do PDF
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {currentContent.type === 'quiz' && (
                                <div className="bg-neutral-100 rounded-lg overflow-hidden mb-4 aspect-video flex items-center justify-center">
                                  <div className="text-center p-8">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-700" />
                                    <p className="text-lg font-medium text-neutral-800">
                                      Quiz Interativo (Simulação)
                                    </p>
                                    <p className="text-sm text-neutral-600 mt-2">
                                      Em um ambiente de produção, este seria um quiz interativo real.
                                    </p>
                                    <Button className="mt-4">
                                      Iniciar Quiz
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              <h3 className="text-xl font-semibold mb-2">
                                {currentContent.title}
                              </h3>
                              <div className="flex items-center text-sm text-neutral-600 mb-4">
                                {currentContent.type === 'video' && (
                                  <span className="flex items-center">
                                    <Play className="h-4 w-4 mr-1" />
                                    {currentContent.duration} minutos
                                  </span>
                                )}
                              </div>
                              <div className="prose max-w-none">
                                <p>
                                  Este conteúdo aborda {currentContent.title.toLowerCase()}, um tópico essencial para a compreensão completa das funções matemáticas.
                                </p>
                                <p>
                                  Nesta lição, você aprenderá os conceitos fundamentais, verá exemplos práticos e poderá testar seus conhecimentos através de exercícios interativos.
                                </p>
                              </div>
                              
                              <div className="flex justify-between mt-8">
                                <Button 
                                  variant="outline" 
                                  disabled={currentVideoIndex === 0}
                                  onClick={() => currentVideoIndex > 0 && setCurrentVideoIndex(currentVideoIndex - 1)}
                                >
                                  Anterior
                                </Button>
                                <Button 
                                  disabled={currentVideoIndex === mockContents.length - 1}
                                  onClick={() => currentVideoIndex < mockContents.length - 1 && setCurrentVideoIndex(currentVideoIndex + 1)}
                                >
                                  Próximo
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Discussions Tab */}
                    <TabsContent value="discussions" className="p-6">
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                        <h3 className="text-xl font-semibold mb-2">Participe das discussões</h3>
                        <p className="text-neutral-600 max-w-md mx-auto mb-6">
                          Interaja com outros estudantes, compartilhe dúvidas e aprenda colaborativamente.
                        </p>
                        <Button>Ver Todas as Discussões</Button>
                      </div>
                    </TabsContent>
                    
                    {/* Materials Tab */}
                    <TabsContent value="materials" className="p-6">
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                        <h3 className="text-xl font-semibold mb-2">Materiais de Apoio</h3>
                        <p className="text-neutral-600 max-w-md mx-auto mb-6">
                          Acesse exercícios, textos complementares e outros recursos para seu aprendizado.
                        </p>
                        <Button>Ver Todos os Materiais</Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}