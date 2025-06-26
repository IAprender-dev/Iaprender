import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import iaprenderLogo from "@assets/IAprender_1750262377399.png";
import { 
  Brain, 
  Sparkles, 
  BookOpen, 
  Target, 
  Clock, 
  Lightbulb,
  Download,
  Share2,
  RefreshCw,
  ChevronRight,
  Network,
  Eye,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface MindMapNode {
  text: string;
  examples?: string[];
  keyWords?: string[];
}

interface MainBranch {
  id: string;
  text: string;
  color: string;
  subBranches: MindMapNode[];
}

interface Connection {
  from: string;
  to: string;
  relationship: string;
}

interface MindMapData {
  title: string;
  grade: string;
  bnccAlignment: string;
  mindMap: {
    centralConcept: {
      text: string;
      color: string;
    };
    mainBranches: MainBranch[];
    connections: Connection[];
    studyTips: string[];
    practiceQuestions: string[];
  };
  metadata: {
    complexity: string;
    estimatedStudyTime: string;
    prerequisites: string[];
  };
  generated?: {
    userGrade: string;
    topic: string;
    timestamp: string;
    bnccCompliant: boolean;
  };
}

export default function StudentMindMap() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [config, setConfig] = useState({
    topic: '',
    complexity: 'medium',
    includeExamples: true
  });

  const generateMindMap = async () => {
    if (!config.topic.trim()) {
      toast({
        title: "Tema obrigatório",
        description: "Digite um tema para gerar o mapa mental",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar mapa mental');
      }

      setMindMapData(data);
      toast({
        title: "Mapa mental gerado!",
        description: `Criado seguindo a BNCC para o ${user?.schoolYear}`,
      });
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast({
        title: "Erro ao gerar mapa mental",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const downloadMindMap = async () => {
    if (!mindMapData) return;
    
    const dataStr = JSON.stringify(mindMapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mapa-mental-${mindMapData.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado",
      description: "Mapa mental salvo com sucesso!",
    });
  };

  return (
    <>
      <Helmet>
        <title>Mapas Mentais IA - IAprender</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
        {/* Header with Back Button */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-purple-200/50 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button size="sm" className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <img src={iaprenderLogo} alt="IAprender" className="w-10 h-10 object-contain" />
                <div>
                  <span className="text-xl font-bold text-gray-900">IAprender</span>
                  <div className="text-xs text-slate-500">Mapas Mentais IA</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg border-0 rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Gerar Mapa Mental
                </CardTitle>
                <CardDescription>
                  Crie mapas mentais personalizados seguindo a BNCC para o {user?.schoolYear}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-black">Tema de Estudo</Label>
                  <Input
                    placeholder="Ex: Produtos Notáveis, Sistema Digestório..."
                    value={config.topic}
                    onChange={(e) => setConfig({...config, topic: e.target.value})}
                    className="h-12 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-200 text-black placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-500">
                    Digite qualquer tema que deseja estudar através de mapas mentais
                  </p>
                  <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 p-2 rounded-lg">
                    <AlertCircle className="w-3 h-3" />
                    Tema livre - explore qualquer assunto de seu interesse
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-black">Complexidade</Label>
                  <Select value={config.complexity} onValueChange={(value) => setConfig({...config, complexity: value})}>
                    <SelectTrigger className="h-12 bg-white border-slate-300 text-black">
                      <SelectValue className="text-black" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Básico - Conceitos fundamentais</SelectItem>
                      <SelectItem value="medium">Médio - Aplicações práticas</SelectItem>
                      <SelectItem value="hard">Avançado - Análise profunda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeExamples"
                    checked={config.includeExamples}
                    onChange={(e) => setConfig({...config, includeExamples: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <Label htmlFor="includeExamples" className="text-sm text-black">
                    Incluir exemplos práticos brasileiros
                  </Label>
                </div>

                <Button 
                  onClick={generateMindMap}
                  disabled={isGenerating || !config.topic.trim()}
                  className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Gerando Mapa Mental...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Gerar Mapa Mental
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Mind Map Display */}
          <div className="lg:col-span-2">
            {!mindMapData ? (
              <Card className="bg-white shadow-lg border-0 rounded-2xl h-full">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Network className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">
                      Seu Mapa Mental Aparecerá Aqui
                    </h3>
                    <p className="text-slate-500">
                      Configure o tema ao lado e clique em "Gerar Mapa Mental"
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Mind Map Header */}
                <Card className="bg-white shadow-lg border-0 rounded-2xl">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl font-bold text-slate-900 mb-2">
                          {mindMapData.title}
                        </CardTitle>
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={`${getComplexityColor(mindMapData.metadata.complexity)} font-medium`}>
                            {mindMapData.metadata.complexity === 'easy' ? 'Básico' : 
                             mindMapData.metadata.complexity === 'medium' ? 'Médio' : 'Avançado'}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {mindMapData.metadata.estimatedStudyTime}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {mindMapData.grade}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={downloadMindMap}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartilhar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
                      <strong>BNCC:</strong> {mindMapData.bnccAlignment}
                    </div>
                  </CardHeader>
                </Card>

                {/* Central Concept */}
                <Card className="bg-white shadow-lg border-0 rounded-2xl">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div 
                        className="inline-flex items-center justify-center w-32 h-32 rounded-full text-black text-xl font-bold shadow-2xl mx-auto mb-4 border-4 border-white"
                        style={{ backgroundColor: mindMapData.mindMap.centralConcept.color }}
                      >
                        <span className="text-black drop-shadow-lg px-2 py-1 bg-white/90 rounded-lg">
                          {mindMapData.mindMap.centralConcept.text}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Conceito Central</h3>
                    </div>
                  </CardContent>
                </Card>

                {/* Main Branches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mindMapData.mindMap.mainBranches.map((branch, index) => (
                    <Card key={branch.id} className="bg-white shadow-lg border-0 rounded-2xl">
                      <CardHeader 
                        className="rounded-t-2xl text-black"
                        style={{ backgroundColor: branch.color }}
                      >
                        <CardTitle className="text-lg font-bold text-black drop-shadow-sm">
                          {branch.text}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {branch.subBranches.map((subBranch, subIndex) => (
                            <div key={subIndex} className="border-l-4 border-slate-200 pl-4">
                              <h4 className="font-semibold text-black mb-2">{subBranch.text}</h4>
                              
                              {subBranch.keyWords && subBranch.keyWords.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs text-slate-500 mb-1">Palavras-chave:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {subBranch.keyWords.map((keyword, kIndex) => (
                                      <Badge key={kIndex} variant="secondary" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {subBranch.examples && subBranch.examples.length > 0 && (
                                <div>
                                  <p className="text-xs text-slate-500 mb-1">Exemplos:</p>
                                  <ul className="text-sm text-black space-y-1">
                                    {subBranch.examples.map((example, eIndex) => (
                                      <li key={eIndex} className="flex items-start gap-2">
                                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                                        {example}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Study Tips and Practice Questions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Study Tips */}
                  <Card className="bg-white shadow-lg border-0 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        Dicas de Estudo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-3">
                          {mindMapData.mindMap.studyTips.map((tip, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                              <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {index + 1}
                              </div>
                              <p className="text-sm text-slate-700">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Practice Questions */}
                  <Card className="bg-white shadow-lg border-0 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <Eye className="w-5 h-5 text-blue-500" />
                        Perguntas para Reflexão
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        <div className="space-y-3">
                          {mindMapData.mindMap.practiceQuestions.map((question, index) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-slate-700 font-medium">{question}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Prerequisites */}
                {mindMapData.metadata.prerequisites.length > 0 && (
                  <Card className="bg-white shadow-lg border-0 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900">
                        <BookOpen className="w-5 h-5 text-green-500" />
                        Pré-requisitos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {mindMapData.metadata.prerequisites.map((prereq, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {prereq}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}