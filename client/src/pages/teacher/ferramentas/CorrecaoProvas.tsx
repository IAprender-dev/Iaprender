import { useState } from "react";
import { CheckSquare, Upload, FileText, Eye, Loader2, Trash2, AlertCircle, Check, BarChart, Star, Download, Clock } from "lucide-react";
import FerramentaLayout from "./FerramentaLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AvaliacaoCorrigida {
  id: string;
  titulo: string;
  dataCorrecao: Date;
  totalAlunos: number;
  mediaGeral: number;
  status: 'completo' | 'parcial' | 'erro';
  tempoCorrecao: string;
}

interface AlunoResultado {
  id: string;
  nome: string;
  nota: number;
  porcentagemAcertos: number;
  questoesErradas: number[];
  observacoes?: string;
}

export default function CorrecaoProvas() {
  const { toast } = useToast();
  
  // Estados de upload e correção
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [gabarito, setGabarito] = useState("");
  const [isCorreting, setIsCorreting] = useState(false);
  const [tipoAvaliacao, setTipoAvaliacao] = useState("objetiva");
  const [criterioAvaliacao, setCriterioAvaliacao] = useState("padrao");
  
  // Estados de resultados
  const [avaliacoesCorrigidas, setAvaliacoesCorrigidas] = useState<AvaliacaoCorrigida[]>([]);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<AvaliacaoCorrigida | null>(null);
  const [resultadosAlunos, setResultadosAlunos] = useState<AlunoResultado[]>([]);
  
  // Função para lidar com upload de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      if (file.type === "application/pdf" || file.type === "image/jpeg" || file.type === "image/png") {
        setSelectedFile(file);
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, envie um arquivo PDF ou uma imagem (JPG ou PNG).",
          variant: "destructive"
        });
        e.target.value = '';
      }
    }
  };
  
  // Mock de função para corrigir avaliações
  const corrigirAvaliacao = async () => {
    // Validações básicas
    if (!selectedFile) {
      toast({
        title: "Arquivo obrigatório",
        description: "Faça upload da avaliação para correção.",
        variant: "destructive"
      });
      return;
    }

    if (tipoAvaliacao === "objetiva" && !gabarito.trim()) {
      toast({
        title: "Gabarito obrigatório",
        description: "Informe o gabarito para correção da avaliação objetiva.",
        variant: "destructive"
      });
      return;
    }

    setIsCorreting(true);

    try {
      // Simulando processamento
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Mock de resultados
      const temposCorrecao = ["00:45", "01:12", "02:08", "00:37"];
      const novaAvaliacao: AvaliacaoCorrigida = {
        id: `aval-${Date.now()}`,
        titulo: `Avaliação - ${selectedFile.name.split('.')[0]}`,
        dataCorrecao: new Date(),
        totalAlunos: Math.floor(Math.random() * 20) + 10,
        mediaGeral: Number((Math.random() * 2 + 7).toFixed(1)),
        status: Math.random() > 0.2 ? 'completo' : 'parcial',
        tempoCorrecao: temposCorrecao[Math.floor(Math.random() * temposCorrecao.length)]
      };
      
      setAvaliacoesCorrigidas(prev => [novaAvaliacao, ...prev]);
      setAvaliacaoSelecionada(novaAvaliacao);
      
      // Gerar resultados de alunos fictícios
      const alunos = ['Ana Silva', 'Bruno Oliveira', 'Carla Santos', 'Daniel Pereira', 'Eduarda Lima', 
                     'Fábio Costa', 'Gabriela Fernandes', 'Henrique Martins', 'Isabela Castro', 'João Almeida'];
      
      const resultados: AlunoResultado[] = alunos.slice(0, novaAvaliacao.totalAlunos).map((nome, index) => {
        const nota = Number((Math.random() * 4 + 6).toFixed(1));
        return {
          id: `aluno-${index}`,
          nome,
          nota,
          porcentagemAcertos: Math.round(nota * 10),
          questoesErradas: Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => Math.floor(Math.random() * 10) + 1),
          observacoes: Math.random() > 0.7 ? "Aluno demonstrou dificuldade nas questões relacionadas a cálculos." : undefined
        };
      });
      
      setResultadosAlunos(resultados);
      
      // Limpar campos de upload
      setSelectedFile(null);
      setGabarito("");
      
      toast({
        title: "Correção concluída",
        description: "A avaliação foi corrigida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na correção",
        description: "Ocorreu um erro ao processar a avaliação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCorreting(false);
    }
  };

  // Função para obter a distribuição de notas (para gráficos)
  const getDistribuicaoNotas = () => {
    const faixas = { "0-2": 0, "2-4": 0, "4-6": 0, "6-8": 0, "8-10": 0 };
    
    resultadosAlunos.forEach(aluno => {
      if (aluno.nota < 2) faixas["0-2"]++;
      else if (aluno.nota < 4) faixas["2-4"]++;
      else if (aluno.nota < 6) faixas["4-6"]++;
      else if (aluno.nota < 8) faixas["6-8"]++;
      else faixas["8-10"]++;
    });
    
    return faixas;
  };
  
  // Função para calcular métricas
  const calcularMelhorDesempenho = () => {
    if (resultadosAlunos.length === 0) return "N/A";
    
    const melhorAluno = resultadosAlunos.reduce((prev, current) => 
      (prev.nota > current.nota) ? prev : current
    );
    
    return `${melhorAluno.nome} (${melhorAluno.nota})`;
  };
  
  const calcularMediaTurma = () => {
    if (resultadosAlunos.length === 0) return 0;
    
    const soma = resultadosAlunos.reduce((acc, aluno) => acc + aluno.nota, 0);
    return Number((soma / resultadosAlunos.length).toFixed(1));
  };

  return (
    <FerramentaLayout
      title="Correção de Provas"
      description="Automatize a correção de avaliações e obtenha análises de desempenho"
      icon={<CheckSquare className="h-6 w-6 text-blue-600" />}
      helpText="Faça upload das provas ou avaliações para correção automatizada. Você pode corrigir provas objetivas com gabarito ou avaliações dissertativas."
    >
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="upload" className="text-sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload e Correção
          </TabsTrigger>
          <TabsTrigger value="resultados" className="text-sm">
            <Eye className="h-4 w-4 mr-2" />
            Visualizar Resultados
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-sm">
            <FileText className="h-4 w-4 mr-2" />
            Histórico de Correções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                Upload de avaliação
              </CardTitle>
              <CardDescription>
                Faça upload da avaliação ou prova para correção automática
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tipoAvaliacao" className="mb-2 block">Tipo de avaliação</Label>
                    <RadioGroup
                      value={tipoAvaliacao}
                      onValueChange={setTipoAvaliacao}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="objetiva" id="objetiva" />
                        <Label htmlFor="objetiva" className="font-normal">Prova objetiva (múltipla escolha)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dissertativa" id="dissertativa" />
                        <Label htmlFor="dissertativa" className="font-normal">Avaliação dissertativa</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mista" id="mista" />
                        <Label htmlFor="mista" className="font-normal">Avaliação mista</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {tipoAvaliacao === "objetiva" && (
                    <div className="space-y-2">
                      <Label htmlFor="gabarito" className="mb-1 block">Gabarito</Label>
                      <Input
                        id="gabarito"
                        value={gabarito}
                        onChange={(e) => setGabarito(e.target.value)}
                        placeholder="Ex: ABCDAABC"
                        className="max-w-sm"
                      />
                      <p className="text-xs text-neutral-500">
                        Digite as respostas corretas na ordem das questões (ex: ABCDAABC)
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="criterioAvaliacao" className="mb-1 block">Critério de avaliação</Label>
                    <Select value={criterioAvaliacao} onValueChange={setCriterioAvaliacao}>
                      <SelectTrigger id="criterioAvaliacao" className="max-w-sm">
                        <SelectValue placeholder="Selecionar critério" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="padrao">Padrão (0 a 10)</SelectItem>
                        <SelectItem value="porcentagem">Porcentagem</SelectItem>
                        <SelectItem value="conceito">Conceitual (A, B, C, D)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label htmlFor="fileUpload" className="mb-2 block">Upload de arquivo</Label>
                  <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <Input
                      id="fileUpload"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <Label htmlFor="fileUpload" className="w-full h-full cursor-pointer flex flex-col items-center">
                      <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                      <span className="text-sm font-medium text-neutral-900 mb-1">
                        {selectedFile ? selectedFile.name : "Clique para selecionar um arquivo"}
                      </span>
                      <span className="text-xs text-neutral-500">
                        PDF, JPG ou PNG (máx. 10MB)
                      </span>
                    </Label>
                    {selectedFile && (
                      <div className="mt-3 flex justify-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button
                      className="w-full"
                      onClick={corrigirAvaliacao}
                      disabled={isCorreting}
                    >
                      {isCorreting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Corrigindo avaliação...
                        </>
                      ) : (
                        <>
                          <CheckSquare className="mr-2 h-4 w-4" />
                          Iniciar correção
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-neutral-500" />
                  Dicas para melhores resultados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-xs text-neutral-600 space-y-1">
                  <li>• Envie imagens com boa iluminação e foco</li>
                  <li>• Confirme o gabarito antes de iniciar a correção</li>
                  <li>• Para avaliações objetivas, use letra legível</li>
                  <li>• Digitalize as provas com 300 DPI ou superior</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Check className="h-4 w-4 mr-2 text-neutral-500" />
                  Recursos de Correção
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-xs text-neutral-600 space-y-1">
                  <li>• Reconhecimento automático de marcações</li>
                  <li>• Análise de questões dissertativas</li>
                  <li>• Estatísticas de desempenho da turma</li>
                  <li>• Exportação para planilhas e PDF</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-neutral-500" />
                  Formatos Aceitos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-xs text-neutral-600 space-y-1">
                  <li>• Arquivos PDF (até 10MB)</li>
                  <li>• Imagens JPG/PNG (até 10MB)</li>
                  <li>• Arquivo ZIP com múltiplas avaliações</li>
                  <li>• Documentos escaneados ou fotografias</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resultados">
          {avaliacaoSelecionada && resultadosAlunos.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Média da turma</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-end justify-between">
                      <div className="text-3xl font-bold text-neutral-900">
                        {calcularMediaTurma()}
                      </div>
                      <Badge className={`${calcularMediaTurma() >= 7 ? 'bg-green-500' : calcularMediaTurma() >= 5 ? 'bg-amber-500' : 'bg-red-500'}`}>
                        {calcularMediaTurma() >= 7 ? 'Ótimo' : calcularMediaTurma() >= 5 ? 'Regular' : 'Baixo'}
                      </Badge>
                    </div>
                    <Progress 
                      value={calcularMediaTurma() * 10} 
                      className="h-2 mt-2"
                      indicatorClassName={calcularMediaTurma() >= 7 ? 'bg-green-500' : calcularMediaTurma() >= 5 ? 'bg-amber-500' : 'bg-red-500'}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total de alunos</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-3xl font-bold text-neutral-900">
                      {avaliacaoSelecionada.totalAlunos}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Avaliações processadas
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Melhor desempenho</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="text-base font-medium">
                        {calcularMelhorDesempenho()}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Nota mais alta da turma
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Tempo de correção</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-3xl font-bold text-neutral-900">
                      {avaliacaoSelecionada.tempoCorrecao}
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Minutos:segundos
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resultados individuais</CardTitle>
                  <CardDescription>
                    {avaliacaoSelecionada.titulo} • {avaliacaoSelecionada.dataCorrecao.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Nota</TableHead>
                          <TableHead>% de Acertos</TableHead>
                          <TableHead>Questões Erradas</TableHead>
                          <TableHead>Observações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultadosAlunos.map((aluno) => (
                          <TableRow key={aluno.id}>
                            <TableCell className="font-medium">{aluno.nome}</TableCell>
                            <TableCell>
                              <span className={`font-medium ${aluno.nota >= 7 ? 'text-green-600' : aluno.nota >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                                {aluno.nota}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={aluno.porcentagemAcertos} className="h-2 w-20" />
                                <span className="text-sm">{aluno.porcentagemAcertos}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {aluno.questoesErradas.map((q, i) => (
                                <Badge key={i} variant="outline" className="mr-1">Q{q}</Badge>
                              ))}
                            </TableCell>
                            <TableCell className="text-sm text-neutral-600">
                              {aluno.observacoes || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <p className="text-sm text-neutral-500">
                    {resultadosAlunos.length} alunos avaliados
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Exportar resultados
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart className="h-4 w-4 mr-1" />
                      Gráfico detalhado
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12 text-center">
              <Eye className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Nenhum resultado disponível</h3>
              <p className="text-neutral-500 max-w-md mb-4">
                Faça upload de uma avaliação na aba "Upload e Correção" para visualizar os resultados.
              </p>
              <Button onClick={() => {
                const element = document.querySelector('[data-value="upload"]') as HTMLElement;
                if (element) element.click();
              }}>
                Ir para Upload
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico">
          {avaliacoesCorrigidas.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Avaliação</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Total de Alunos</TableHead>
                      <TableHead>Média</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avaliacoesCorrigidas.map((avaliacao) => (
                      <TableRow key={avaliacao.id}>
                        <TableCell className="font-medium">{avaliacao.titulo}</TableCell>
                        <TableCell>{avaliacao.dataCorrecao.toLocaleDateString()}</TableCell>
                        <TableCell>{avaliacao.totalAlunos}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${avaliacao.mediaGeral >= 7 ? 'text-green-600' : avaliacao.mediaGeral >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                            {avaliacao.mediaGeral}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              avaliacao.status === 'completo' ? 'bg-green-500' :
                              avaliacao.status === 'parcial' ? 'bg-amber-500' :
                              'bg-red-500'
                            }
                          >
                            {avaliacao.status === 'completo' ? 'Completo' :
                            avaliacao.status === 'parcial' ? 'Parcial' :
                            'Erro'}
                          </Badge>
                        </TableCell>
                        <TableCell>{avaliacao.tempoCorrecao}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setAvaliacaoSelecionada(avaliacao);
                              const element = document.querySelector('[data-value="resultados"]') as HTMLElement;
                              if (element) element.click();
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-neutral-200 p-12 text-center">
              <FileText className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Histórico vazio</h3>
              <p className="text-neutral-500 max-w-md mb-4">
                Você ainda não realizou nenhuma correção. Faça upload de uma avaliação na aba "Upload e Correção".
              </p>
              <Button onClick={() => {
                const element = document.querySelector('[data-value="upload"]') as HTMLElement;
                if (element) element.click();
              }}>
                Corrigir primeira avaliação
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </FerramentaLayout>
  );
}