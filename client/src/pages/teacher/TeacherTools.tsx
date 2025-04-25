import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import TeacherHeader from "@/components/dashboard/teacher/TeacherHeader";
import TeacherSidebar from "@/components/dashboard/teacher/TeacherSidebar";
import AIAssistant from "@/components/ai/AIAssistant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploader } from "@/components/ui/file-uploader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, Sparkles, FileText, Image, Beer, Wand2, Pencil, BookOpen, MessageSquare } from "lucide-react";

// Image generator component
function ImageGenerator() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [styleOption, setStyleOption] = useState("realistic");
  const [size, setSize] = useState("square");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      toast({
        title: "Prompt necessário",
        description: "Por favor, descreva a imagem que você deseja gerar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate image generation with a timeout
    setTimeout(() => {
      // Sample educational images based on style
      const sampleImages = {
        realistic: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        cartoon: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        sketch: "https://images.unsplash.com/photo-1503676382389-4809596d5290?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
      };
      
      setGeneratedImage(sampleImages[styleOption as keyof typeof sampleImages]);
      setIsGenerating(false);
      
      toast({
        title: "Imagem gerada",
        description: "Sua imagem educacional foi gerada com sucesso.",
      });
    }, 2000);
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Gerador de Imagens Educacionais
          </CardTitle>
          <CardDescription>
            Crie ilustrações personalizadas para suas aulas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="prompt">Descrição da imagem</Label>
              <Textarea
                id="prompt"
                placeholder="Descreva a imagem educacional que você deseja criar. Ex: Uma ilustração mostrando o ciclo da água com setas e legendas."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="style">Estilo da imagem</Label>
                <Select
                  value={styleOption}
                  onValueChange={setStyleOption}
                >
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Escolha o estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">Realista</SelectItem>
                    <SelectItem value="cartoon">Desenho animado</SelectItem>
                    <SelectItem value="sketch">Esboço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="size">Proporção</Label>
                <Select
                  value={size}
                  onValueChange={setSize}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Escolha a proporção" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Quadrada (1:1)</SelectItem>
                    <SelectItem value="landscape">Paisagem (16:9)</SelectItem>
                    <SelectItem value="portrait">Retrato (9:16)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Sugestões populares:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary-50"
                  onClick={() => setPrompt("Sistema solar com todos os planetas em suas órbitas, com legendas e cores realistas")}
                >
                  Sistema Solar
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary-50"
                  onClick={() => setPrompt("Célula animal com todas as organelas identificadas e coloridas")}
                >
                  Célula Animal
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary-50"
                  onClick={() => setPrompt("Mapa do Brasil com todas as regiões identificadas em cores diferentes")}
                >
                  Mapa do Brasil
                </Badge>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary-50"
                  onClick={() => setPrompt("Ciclo da água com setas e legendas explicativas")}
                >
                  Ciclo da Água
                </Badge>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando imagem...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar Imagem
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Visualização</CardTitle>
          <CardDescription>
            Aqui você verá a imagem gerada
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          {isGenerating ? (
            <div className="w-full h-64 bg-neutral-100 rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-neutral-600">Gerando imagem...</span>
            </div>
          ) : generatedImage ? (
            <div className="w-full flex flex-col items-center">
              <img 
                src={generatedImage} 
                alt="Imagem gerada pela IA" 
                className="max-w-full max-h-64 object-contain rounded-lg border border-neutral-200"
              />
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Baixar
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button size="sm" className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  Usar no Material
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-64 bg-neutral-100 rounded-lg flex flex-col items-center justify-center p-4 text-center">
              <Image className="h-12 w-12 text-neutral-300 mb-3" />
              <p className="text-neutral-500">Sua imagem aparecerá aqui após ser gerada</p>
              <p className="text-neutral-400 text-sm mt-2">Use descrições detalhadas para melhores resultados</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-neutral-500 border-t pt-4">
          Imagens geradas são otimizadas para fins educacionais e podem ser usadas livremente em seus materiais didáticos.
        </CardFooter>
      </Card>
    </div>
  );
}

// Document analyzer component
function DocumentAnalyzer() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [documentType, setDocumentType] = useState("text");
  
  const handleFileUpload = (files: File[]) => {
    if (files.length === 0) return;
    
    toast({
      title: "Documento recebido",
      description: `Analisando ${files[0].name}...`,
    });
    
    setIsAnalyzing(true);
    
    // Simulate analysis with a timeout
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
      
      toast({
        title: "Análise concluída",
        description: "Seu documento foi analisado com sucesso.",
      });
    }, 3000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Análise de Documentos
        </CardTitle>
        <CardDescription>
          Transforme qualquer documento em material didático estruturado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="documentType">Tipo de documento</Label>
          <Select
            value={documentType}
            onValueChange={setDocumentType}
          >
            <SelectTrigger id="documentType">
              <SelectValue placeholder="Selecione o tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto (PDF, DOC, TXT)</SelectItem>
              <SelectItem value="spreadsheet">Planilha (XLS, CSV)</SelectItem>
              <SelectItem value="image">Imagem (JPG, PNG)</SelectItem>
              <SelectItem value="presentation">Apresentação (PPT, PPTX)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Envie seu documento</Label>
          <FileUploader 
            accept={documentType === "text" ? ".pdf,.doc,.docx,.txt" : 
                   documentType === "spreadsheet" ? ".xls,.xlsx,.csv" :
                   documentType === "image" ? ".jpg,.jpeg,.png" : ".ppt,.pptx"}
            maxSize={10} // MB
            onFilesChanged={handleFileUpload}
          />
        </div>
        
        {isAnalyzing && (
          <div className="bg-neutral-50 rounded-lg p-4 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-neutral-700 font-medium">Analisando documento...</p>
            <p className="text-neutral-500 text-sm mt-1">Isso pode levar alguns segundos</p>
          </div>
        )}
        
        {hasAnalyzed && !isAnalyzing && (
          <div className="bg-primary-50 rounded-lg p-4">
            <h3 className="text-primary font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Análise concluída
            </h3>
            <div className="mt-3 space-y-3">
              <div className="bg-white p-3 rounded border border-neutral-200">
                <p className="text-sm font-medium">Conteúdo extraído:</p>
                <ul className="mt-2 text-sm text-neutral-600 space-y-1">
                  <li>• 5 tópicos principais identificados</li>
                  <li>• 12 subtópicos organizados</li>
                  <li>• 3 gráficos/imagens detectados</li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  Criar Plano de Aula
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Fazer Perguntas
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Essay corrector component
function EssayCorrector() {
  const { toast } = useToast();
  const [essay, setEssay] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState<string[]>([]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (essay.length < 50) {
      toast({
        title: "Texto muito curto",
        description: "Por favor, insira um texto mais longo para análise.",
        variant: "destructive",
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    // Simulate analysis with a timeout
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasAnalyzed(true);
      // Simulate a grade between 6 and 9
      setGrade(Math.floor(Math.random() * 3) + 7);
      
      // Sample feedback based on ENEM criteria
      setFeedback([
        "Competência 1: Boa demonstração de domínio da norma padrão da língua escrita.",
        "Competência 2: Desenvolvimento parcial do tema, com alguns argumentos consistentes.",
        "Competência 3: Boa organização do texto, mas com algumas falhas na articulação das ideias.",
        "Competência 4: Mecanismos linguísticos adequados, porém com algumas repetições.",
        "Competência 5: Proposta de intervenção bem desenvolvida, respeitando os direitos humanos."
      ]);
      
      toast({
        title: "Correção concluída",
        description: "A redação foi analisada e corrigida com sucesso.",
      });
    }, 3000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-primary" />
          Corretor de Redações
        </CardTitle>
        <CardDescription>
          Corrija redações de alunos com feedback detalhado baseado nos critérios do ENEM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="essay">Texto para correção</Label>
            <Textarea
              id="essay"
              placeholder="Cole aqui o texto do aluno para correção e análise automática..."
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {essay.length} caracteres (mínimo recomendado: 1500)
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button"
              variant="outline"
              onClick={() => {
                setEssay("");
                setHasAnalyzed(false);
              }}
            >
              Limpar
            </Button>
            <Button 
              type="submit"
              disabled={isAnalyzing || essay.length < 50}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                "Corrigir Redação"
              )}
            </Button>
          </div>
        </form>
        
        {hasAnalyzed && !isAnalyzing && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-xl font-medium flex items-center gap-2">
              <span className="text-2xl font-bold">{grade}/10</span>
              <span className="text-neutral-500">Avaliação da Redação</span>
            </h3>
            
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Feedback por competência:</h4>
                <ul className="space-y-2">
                  {feedback.map((item, idx) => (
                    <li key={idx} className="bg-neutral-50 p-3 rounded-md text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Sugestões de melhoria:</h4>
                <div className="bg-primary-50 p-3 rounded-md text-sm">
                  <ul className="space-y-1">
                    <li>• Desenvolva mais os argumentos com exemplos concretos</li>
                    <li>• Evite repetições de palavras, utilize sinônimos</li>
                    <li>• Aprimore a conclusão com uma proposta mais detalhada</li>
                    <li>• Revise aspectos de coesão entre os parágrafos</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  Salvar Correção
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Upload className="h-4 w-4" />
                  Compartilhar com Aluno
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Performance analyzer component
function PerformanceAnalyzer() {
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedSubject, setSelectedSubject] = useState("all");
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Beer className="h-5 w-5 text-primary" />
          Análise de Desempenho
        </CardTitle>
        <CardDescription>
          Visualize e interprete dados de desempenho dos alunos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="class">Turma</Label>
            <Select
              value={selectedClass}
              onValueChange={setSelectedClass}
            >
              <SelectTrigger id="class">
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                <SelectItem value="8A">8º ano A</SelectItem>
                <SelectItem value="8B">8º ano B</SelectItem>
                <SelectItem value="9A">9º ano A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="period">Período</Label>
            <Select
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
            >
              <SelectTrigger id="period">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
                <SelectItem value="year">Ano letivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="subject">Matéria</Label>
            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder="Selecione a matéria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as matérias</SelectItem>
                <SelectItem value="math">Matemática</SelectItem>
                <SelectItem value="portuguese">Português</SelectItem>
                <SelectItem value="science">Ciências</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Desempenho médio por turma</h3>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">8º ano A</span>
                  <span className="text-sm font-medium">7.8/10</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">8º ano B</span>
                  <span className="text-sm font-medium">6.5/10</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div className="bg-[#FF9500] h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">9º ano A</span>
                  <span className="text-sm font-medium">8.3/10</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div className="bg-[#34C759] h-2 rounded-full" style={{ width: '83%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Distribuição de notas 8º ano A</h3>
            <div className="h-20 flex items-end justify-between gap-1">
              {Array.from({ length: 10 }).map((_, i) => {
                // Generate random heights between 10% and 100%
                const height = 10 + Math.floor(Math.random() * 90);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full ${i >= 7 ? 'bg-[#34C759]' : i >= 5 ? 'bg-[#FF9500]' : 'bg-red-500'} rounded-t`}
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs mt-1">{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Insights</h3>
            <div className="bg-primary-50 p-3 rounded-md">
              <ul className="space-y-1 text-sm">
                <li>• Os alunos estão apresentando melhor desempenho em álgebra do que em geometria</li>
                <li>• 23% dos alunos apresentam dificuldades com frações e decimais</li>
                <li>• Há uma correlação positiva entre frequência e desempenho</li>
                <li>• Sugestão: reforçar o conteúdo de equações do 2º grau</li>
              </ul>
            </div>
          </div>
          
          <Button className="w-full">
            Ver análise detalhada
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherTools() {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>Ferramentas IA | Professor | iAula</title>
      </Helmet>

      <div className="flex h-screen overflow-hidden bg-neutral-50">
        <TeacherSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <TeacherHeader />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="container mx-auto">
              {/* Page Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-neutral-900 font-heading">Ferramentas de IA</h1>
                <p className="text-neutral-600 mt-1">
                  Potencialize seu trabalho com nossas ferramentas de inteligência artificial
                </p>
              </div>
              
              <Tabs defaultValue="assistant" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-5">
                  <TabsTrigger value="assistant" className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden md:inline">Assistente</span>
                  </TabsTrigger>
                  <TabsTrigger value="images" className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span className="hidden md:inline">Imagens</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span className="hidden md:inline">Documentos</span>
                  </TabsTrigger>
                  <TabsTrigger value="essays" className="flex items-center gap-1">
                    <Pencil className="h-4 w-4" />
                    <span className="hidden md:inline">Redações</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-1">
                    <Beer className="h-4 w-4" />
                    <span className="hidden md:inline">Análises</span>
                  </TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[calc(100vh-240px)]">
                  <TabsContent value="assistant" className="mt-0">
                    <Card className="border-0 shadow-none">
                      <CardContent className="pt-6">
                        <AIAssistant role="teacher" />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="images" className="mt-0">
                    <ImageGenerator />
                  </TabsContent>
                  
                  <TabsContent value="documents" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <DocumentAnalyzer />
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Documentos Recentes</CardTitle>
                          <CardDescription>
                            Materiais analisados recentemente
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="border rounded-md p-3 hover:bg-neutral-50 cursor-pointer transition-colors">
                              <div className="flex items-center">
                                <div className="p-2 bg-primary-50 rounded mr-3">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Plano Pedagogico 2023.pdf</h4>
                                  <p className="text-xs text-neutral-500">Analisado em 15/05/2023</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border rounded-md p-3 hover:bg-neutral-50 cursor-pointer transition-colors">
                              <div className="flex items-center">
                                <div className="p-2 bg-primary-50 rounded mr-3">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Apostila Matemática 8 ano.docx</h4>
                                  <p className="text-xs text-neutral-500">Analisado em 10/05/2023</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="border rounded-md p-3 hover:bg-neutral-50 cursor-pointer transition-colors">
                              <div className="flex items-center">
                                <div className="p-2 bg-primary-50 rounded mr-3">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Notas Bimestrais.xlsx</h4>
                                  <p className="text-xs text-neutral-500">Analisado em 05/05/2023</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Button variant="outline" className="w-full mt-4">
                            Ver todos os documentos
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="essays" className="mt-0">
                    <EssayCorrector />
                  </TabsContent>
                  
                  <TabsContent value="analytics" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2">
                        <PerformanceAnalyzer />
                      </div>
                      
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Estatísticas Rápidas</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-neutral-500">Média geral</p>
                                  <p className="text-2xl font-bold">7.6</p>
                                </div>
                                <div className="p-3 bg-primary-50 rounded-full">
                                  <Beer className="h-5 w-5 text-primary" />
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-neutral-500">Alunos abaixo da média</p>
                                  <p className="text-2xl font-bold">23%</p>
                                </div>
                                <div className="p-3 bg-red-50 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                                    <path d="M22 12l-4 4-4-4"></path>
                                    <path d="M6 12l4-4 4 4"></path>
                                    <path d="M20 16V8"></path>
                                    <path d="M4 8v8"></path>
                                  </svg>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-neutral-500">Aproveitamento</p>
                                  <p className="text-2xl font-bold">82%</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Dicas de Melhoria</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="bg-primary-50 p-3 rounded-md">
                                <p className="text-sm font-medium text-primary-700">Matemática - 8º ano A</p>
                                <p className="text-sm mt-1">Promova exercícios adicionais sobre frações para melhorar o desempenho geral.</p>
                              </div>
                              
                              <div className="bg-primary-50 p-3 rounded-md">
                                <p className="text-sm font-medium text-primary-700">Português - 9º ano A</p>
                                <p className="text-sm mt-1">Os alunos estão se saindo bem em interpretação, mas precisam de reforço em gramática.</p>
                              </div>
                              
                              <Button variant="outline" className="w-full mt-2">
                                Ver todas as recomendações
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
