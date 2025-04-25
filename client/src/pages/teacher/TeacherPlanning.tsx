import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, CalendarRange, CalendarDays, Search, Filter, Download, Plus, FileText, File } from "lucide-react";
import { LessonPlan } from "@/lib/types";

// Form schema for lesson plan
const lessonPlanSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  subject: z.string().min(1, "Selecione uma disciplina"),
  grade: z.string().min(1, "Selecione uma série"),
  objectives: z.string().min(10, "Descreva os objetivos da aula"),
  content: z.string().min(10, "Descreva o conteúdo da aula"),
  activities: z.string().min(10, "Descreva as atividades planejadas"),
  resources: z.string().min(5, "Liste os recursos necessários"),
  assessment: z.string().min(5, "Descreva como será feita a avaliação")
});

type LessonPlanFormValues = z.infer<typeof lessonPlanSchema>;

export default function TeacherPlanning() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");

  // Fetch teacher's lesson plans
  const { 
    data: lessonPlans, 
    isLoading: loadingPlans,
    error: plansError
  } = useQuery({
    queryKey: ['/api/teacher/lesson-plans'],
    enabled: !!user,
  });

  // Form setup
  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: {
      title: "",
      subject: "",
      grade: "",
      objectives: "",
      content: "",
      activities: "",
      resources: "",
      assessment: ""
    }
  });

  // Create lesson plan mutation
  const createLessonPlan = useMutation({
    mutationFn: async (data: LessonPlanFormValues) => {
      const response = await apiRequest('POST', '/api/lesson-plans', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plano de aula criado",
        description: "Seu plano de aula foi criado com sucesso.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/lesson-plans'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar plano",
        description: "Ocorreu um erro ao criar o plano de aula. Por favor, tente novamente.",
        variant: "destructive",
      });
      console.error("Error creating lesson plan:", error);
    }
  });

  const onSubmit = (data: LessonPlanFormValues) => {
    createLessonPlan.mutate(data);
  };

  // Generate AI plan
  const generateAIPlan = async (subject: string, grade: string) => {
    if (!subject || !grade) {
      toast({
        title: "Informações insuficientes",
        description: "Por favor, selecione uma disciplina e uma série para gerar o plano.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Gerando plano de aula",
      description: "Nossa IA está criando um plano personalizado para você.",
    });

    // Simulate AI generation (in a real app, this would call your AI endpoint)
    setTimeout(() => {
      // Example of what AI might generate
      form.setValue("objectives", "1. Desenvolver a compreensão de conceitos fundamentais da álgebra\n2. Praticar a resolução de equações de primeiro grau\n3. Relacionar o conteúdo com situações do cotidiano");
      form.setValue("content", "• Introdução a equações de primeiro grau\n• Propriedades das igualdades\n• Resolução passo a passo\n• Problemas contextualizados");
      form.setValue("activities", "1. Apresentação interativa sobre equações (15 min)\n2. Resolução de exemplos em conjunto (20 min)\n3. Atividade em grupos: resolver problemas práticos (30 min)\n4. Discussão e correção coletiva (15 min)");
      form.setValue("resources", "• Lousa digital ou quadro\n• Fichas de exercícios impressas\n• Calculadoras\n• Apresentação digital");
      form.setValue("assessment", "• Participação nas discussões\n• Resolução das atividades em grupo\n• Quiz rápido ao final da aula\n• Tarefa de casa para fixação");

      toast({
        title: "Plano gerado com sucesso",
        description: "O plano de aula foi gerado pela IA. Você pode editar conforme necessário.",
      });
    }, 2000);
  };

  // Filter lesson plans
  const filteredPlans = lessonPlans?.filter((plan: LessonPlan) => {
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          plan.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSubject === "all" || plan.subject === filterSubject;
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Subjects for dropdown
  const subjects = [
    "Matemática",
    "Português",
    "Ciências",
    "História",
    "Geografia",
    "Física",
    "Química",
    "Biologia",
    "Inglês",
    "Artes",
    "Educação Física"
  ];

  // Grades for dropdown
  const grades = [
    "1º ano - Ensino Fundamental",
    "2º ano - Ensino Fundamental",
    "3º ano - Ensino Fundamental",
    "4º ano - Ensino Fundamental",
    "5º ano - Ensino Fundamental",
    "6º ano - Ensino Fundamental",
    "7º ano - Ensino Fundamental",
    "8º ano - Ensino Fundamental",
    "9º ano - Ensino Fundamental",
    "1º ano - Ensino Médio",
    "2º ano - Ensino Médio",
    "3º ano - Ensino Médio"
  ];

  return (
    <>
      <Helmet>
        <title>Planejamento de Aulas | Professor | iAula</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-neutral-50">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-neutral-900 font-heading">Planejamento de Aulas</h1>
                <p className="text-neutral-600 mt-1">
                  Crie, organize e gerencie seus planos de aula com assistência de IA
                </p>
              </div>

              <Tabs defaultValue="view" className="w-full">
                <TabsList className="mb-6 grid grid-cols-2">
                  <TabsTrigger value="view" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Meus Planos
                  </TabsTrigger>
                  <TabsTrigger value="create" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Novo Plano
                  </TabsTrigger>
                </TabsList>

                {/* View Lesson Plans Tab */}
                <TabsContent value="view">
                  <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                        <Input
                          placeholder="Pesquisar planos de aula..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={filterSubject} onValueChange={setFilterSubject}>
                          <SelectTrigger className="w-[180px]">
                            <Filter className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Filtrar por matéria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas as matérias</SelectItem>
                            {subjects.map((subject) => (
                              <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" className="gap-1">
                          <CalendarRange className="h-4 w-4" />
                          Calendário
                        </Button>
                        <Button variant="outline" className="gap-1">
                          <Download className="h-4 w-4" />
                          Exportar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {loadingPlans ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-2 text-neutral-600">Carregando planos de aula...</span>
                    </div>
                  ) : plansError ? (
                    <Card className="p-8 text-center">
                      <CardTitle className="text-lg text-red-500 mb-2">Erro ao carregar os planos</CardTitle>
                      <CardDescription>
                        Ocorreu um erro ao tentar carregar seus planos de aula. Por favor, tente novamente mais tarde.
                      </CardDescription>
                      <Button onClick={() => window.location.reload()} className="mt-4">
                        Tentar novamente
                      </Button>
                    </Card>
                  ) : filteredPlans.length === 0 ? (
                    <Card className="p-8 text-center">
                      {searchTerm || filterSubject !== "all" ? (
                        <>
                          <CardTitle className="text-lg mb-2">Nenhum plano encontrado</CardTitle>
                          <CardDescription>
                            Não encontramos planos de aula que correspondam aos seus critérios de busca.
                          </CardDescription>
                          <Button 
                            onClick={() => {
                              setSearchTerm("");
                              setFilterSubject("all");
                            }} 
                            className="mt-4"
                          >
                            Limpar filtros
                          </Button>
                        </>
                      ) : (
                        <>
                          <CardTitle className="text-lg mb-2">Você ainda não tem planos de aula</CardTitle>
                          <CardDescription>
                            Comece criando seu primeiro plano de aula para organizar suas atividades didáticas.
                          </CardDescription>
                          <Button 
                            onClick={() => document.querySelector('[data-value="create"]')?.click()}
                            className="mt-4 gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Criar Novo Plano
                          </Button>
                        </>
                      )}
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPlans.map((plan: LessonPlan) => (
                        <Card key={plan.id} className="overflow-hidden flex flex-col h-full">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-2">
                                <Badge variant="outline" className="bg-primary-50 text-primary border-0">
                                  {plan.subject}
                                </Badge>
                                <Badge variant="outline" className="bg-neutral-100 text-neutral-700 border-0">
                                  {plan.grade.split(' - ')[0]}
                                </Badge>
                              </div>
                              <div className="text-xs text-neutral-500">
                                {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            <CardTitle className="text-lg mt-2">{plan.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="pb-4 pt-0">
                            <div className="text-sm text-neutral-600">
                              <strong>Objetivos:</strong> {plan.objectives.split('\n')[0]}...
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2 mt-auto">
                            <Button variant="outline" size="sm" className="gap-1">
                              <File className="h-4 w-4" />
                              Ver Plano
                            </Button>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="px-2">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="px-2">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Create Lesson Plan Tab */}
                <TabsContent value="create">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Novo Plano de Aula</CardTitle>
                          <CardDescription>
                            Preencha os campos abaixo para criar um plano de aula detalhado
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="title">Título do Plano</Label>
                                <Input
                                  id="title"
                                  placeholder="Ex: Introdução à Álgebra"
                                  {...form.register("title")}
                                />
                                {form.formState.errors.title && (
                                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="subject">Disciplina</Label>
                                  <Select
                                    onValueChange={(value) => form.setValue("subject", value)}
                                    value={form.watch("subject")}
                                  >
                                    <SelectTrigger id="subject">
                                      <SelectValue placeholder="Selecione a disciplina" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {subjects.map((subject) => (
                                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {form.formState.errors.subject && (
                                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.subject.message}</p>
                                  )}
                                </div>

                                <div>
                                  <Label htmlFor="grade">Série</Label>
                                  <Select
                                    onValueChange={(value) => form.setValue("grade", value)}
                                    value={form.watch("grade")}
                                  >
                                    <SelectTrigger id="grade">
                                      <SelectValue placeholder="Selecione a série" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {grades.map((grade) => (
                                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {form.formState.errors.grade && (
                                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.grade.message}</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <Label htmlFor="objectives">Objetivos</Label>
                                <Textarea
                                  id="objectives"
                                  placeholder="Liste os objetivos de aprendizagem"
                                  rows={3}
                                  {...form.register("objectives")}
                                />
                                {form.formState.errors.objectives && (
                                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.objectives.message}</p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor="content">Conteúdo</Label>
                                <Textarea
                                  id="content"
                                  placeholder="Descreva o conteúdo a ser trabalhado"
                                  rows={3}
                                  {...form.register("content")}
                                />
                                {form.formState.errors.content && (
                                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.content.message}</p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor="activities">Atividades</Label>
                                <Textarea
                                  id="activities"
                                  placeholder="Descreva as atividades planejadas"
                                  rows={3}
                                  {...form.register("activities")}
                                />
                                {form.formState.errors.activities && (
                                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.activities.message}</p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor="resources">Recursos</Label>
                                <Textarea
                                  id="resources"
                                  placeholder="Liste os recursos necessários"
                                  rows={2}
                                  {...form.register("resources")}
                                />
                                {form.formState.errors.resources && (
                                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.resources.message}</p>
                                )}
                              </div>

                              <div>
                                <Label htmlFor="assessment">Avaliação</Label>
                                <Textarea
                                  id="assessment"
                                  placeholder="Descreva como será feita a avaliação"
                                  rows={2}
                                  {...form.register("assessment")}
                                />
                                {form.formState.errors.assessment && (
                                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.assessment.message}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => form.reset()}
                              >
                                Limpar
                              </Button>
                              <Button 
                                type="submit"
                                disabled={createLessonPlan.isPending}
                              >
                                {createLessonPlan.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  "Salvar Plano"
                                )}
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <Card>
                        <CardHeader>
                          <CardTitle>Assistente de IA</CardTitle>
                          <CardDescription>
                            Gere um plano de aula completo com assistência da IA
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-neutral-600">
                            Nossa inteligência artificial pode ajudar você a criar um plano de aula personalizado. Basta selecionar a disciplina e a série, e a IA fará o resto.
                          </p>

                          <div className="space-y-4 pt-2">
                            <div>
                              <Label htmlFor="aiSubject">Disciplina</Label>
                              <Select
                                onValueChange={(value) => form.setValue("subject", value)}
                                value={form.watch("subject")}
                              >
                                <SelectTrigger id="aiSubject">
                                  <SelectValue placeholder="Selecione a disciplina" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subjects.map((subject) => (
                                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="aiGrade">Série</Label>
                              <Select
                                onValueChange={(value) => form.setValue("grade", value)}
                                value={form.watch("grade")}
                              >
                                <SelectTrigger id="aiGrade">
                                  <SelectValue placeholder="Selecione a série" />
                                </SelectTrigger>
                                <SelectContent>
                                  {grades.map((grade) => (
                                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="aiTitle">Tema específico (opcional)</Label>
                              <Input
                                id="aiTitle"
                                placeholder="Ex: Equações de 1º grau"
                                value={form.watch("title")}
                                onChange={(e) => form.setValue("title", e.target.value)}
                              />
                            </div>
                          </div>

                          <Button 
                            className="w-full mt-4"
                            onClick={() => generateAIPlan(form.watch("subject"), form.watch("grade"))}
                          >
                            Gerar Plano com IA
                          </Button>

                          <div className="pt-4">
                            <h4 className="font-medium text-sm">Sugestões populares:</h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  form.setValue("subject", "Matemática");
                                  form.setValue("grade", "8º ano - Ensino Fundamental");
                                  form.setValue("title", "Equações de 1º grau");
                                }}
                              >
                                Matemática - Equações
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  form.setValue("subject", "Português");
                                  form.setValue("grade", "9º ano - Ensino Fundamental");
                                  form.setValue("title", "Análise de textos argumentativos");
                                }}
                              >
                                Português - Argumentação
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  form.setValue("subject", "Ciências");
                                  form.setValue("grade", "7º ano - Ensino Fundamental");
                                  form.setValue("title", "Sistema Solar");
                                }}
                              >
                                Ciências - Sistema Solar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle>Calendário de Planejamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-4">
                            <CalendarDays className="h-12 w-12 mx-auto text-primary opacity-50" />
                            <p className="mt-2 text-sm text-neutral-600">
                              Organize seus planos de aula no calendário e visualize sua programação completa.
                            </p>
                            <Button className="mt-4" variant="outline">
                              Abrir Calendário
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
