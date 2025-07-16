import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Brain, 
  Save, 
  RotateCcw, 
  Bot, 
  Image as ImageIcon,
  Search,
  MessageSquare,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

// Importar logos das IAs
import chatgptLogo from "@assets/chatgpt-logo.jpg";
import claudeLogo from "@assets/claude-logo.png";
import perplexityLogo from "@assets/perplexity-logo.webp";

interface AIPreference {
  defaultAI: string;
  autoStartSession: boolean;
  saveConversations: boolean;
  responseLanguage: string;
  complexityLevel: string;
  customPrompts: boolean;
}

export default function AIPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<AIPreference>({
    defaultAI: 'chatgpt',
    autoStartSession: false,
    saveConversations: true,
    responseLanguage: 'pt-BR',
    complexityLevel: 'intermediario',
    customPrompts: false
  });

  // Configurações das IAs disponíveis
  const aiModels = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      description: 'Ideal para conversas gerais, criação de textos e resolução de problemas',
      icon: <img src={chatgptLogo} alt="ChatGPT" className="h-8 w-8 object-contain rounded" />,
      color: 'bg-green-100 border-green-300',
      strengths: ['Conversação natural', 'Criatividade', 'Explicações didáticas']
    },
    {
      id: 'claude',
      name: 'Claude',
      description: 'Excelente para análise de textos, raciocínio lógico e tarefas complexas',
      icon: <Bot className="h-8 w-8 text-purple-600" />,
      color: 'bg-purple-100 border-purple-300',
      strengths: ['Análise profunda', 'Raciocínio lógico', 'Textos longos']
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      description: 'Especializado em pesquisa em tempo real com fontes confiáveis',
      icon: <img src={perplexityLogo} alt="Perplexity" className="h-8 w-8 object-contain rounded" />,
      color: 'bg-blue-100 border-blue-300',
      strengths: ['Pesquisa atual', 'Fontes verificadas', 'Dados atualizados']
    }
  ];

  // Carregar preferências do usuário
  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("GET", "/api/user/ai-preferences");
      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar preferências:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await apiRequest("POST", "/api/user/ai-preferences", {
        preferences
      });

      if (response.ok) {
        toast({
          title: "Preferências salvas!",
          description: "Suas configurações de IA foram atualizadas com sucesso.",
        });
      } else {
        throw new Error("Falha ao salvar preferências");
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas preferências. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences({
      defaultAI: 'chatgpt',
      autoStartSession: false,
      saveConversations: true,
      responseLanguage: 'pt-BR',
      complexityLevel: 'intermediario',
      customPrompts: false
    });
    toast({
      title: "Configurações resetadas",
      description: "Suas preferências foram restauradas para os valores padrão.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-lg text-slate-600">Carregando preferências...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={user?.role === 'professor' ? '/professor' : '/student'}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Preferências de IA</h1>
                <p className="text-sm text-slate-600">Configure como você prefere interagir com as inteligências artificiais</p>
              </div>
            </div>
            <Settings className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* Seleção de IA Padrão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                Inteligência Artificial Padrão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={preferences.defaultAI}
                onValueChange={(value) => setPreferences({...preferences, defaultAI: value})}
                className="space-y-4"
              >
                {aiModels.map((ai) => (
                  <div key={ai.id} className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    preferences.defaultAI === ai.id ? ai.color + ' ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'
                  }`}>
                    <div className="flex items-start space-x-4">
                      <RadioGroupItem value={ai.id} id={ai.id} className="mt-1" />
                      <div className="flex-shrink-0">
                        {ai.icon}
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={ai.id} className="cursor-pointer">
                          <div className="font-semibold text-lg">{ai.name}</div>
                          <div className="text-sm text-slate-600 mb-2">{ai.description}</div>
                          <div className="flex flex-wrap gap-1">
                            {ai.strengths.map((strength) => (
                              <span key={strength} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {strength}
                              </span>
                            ))}
                          </div>
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Configurações de Comportamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Comportamento da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Idioma das Respostas */}
              <div className="space-y-2">
                <Label htmlFor="language">Idioma das Respostas</Label>
                <Select 
                  value={preferences.responseLanguage} 
                  onValueChange={(value) => setPreferences({...preferences, responseLanguage: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nível de Complexidade */}
              <div className="space-y-2">
                <Label htmlFor="complexity">Nível de Complexidade das Respostas</Label>
                <Select 
                  value={preferences.complexityLevel} 
                  onValueChange={(value) => setPreferences({...preferences, complexityLevel: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico - Explicações simples e diretas</SelectItem>
                    <SelectItem value="intermediario">Intermediário - Explicações detalhadas</SelectItem>
                    <SelectItem value="avancado">Avançado - Respostas técnicas e aprofundadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Opções adicionais */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Iniciar sessão automaticamente</Label>
                    <p className="text-sm text-slate-500">Conectar automaticamente com sua IA preferida ao acessar o dashboard</p>
                  </div>
                  <Switch
                    checked={preferences.autoStartSession}
                    onCheckedChange={(checked) => setPreferences({...preferences, autoStartSession: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Salvar conversas</Label>
                    <p className="text-sm text-slate-500">Manter histórico das suas conversas para consulta posterior</p>
                  </div>
                  <Switch
                    checked={preferences.saveConversations}
                    onCheckedChange={(checked) => setPreferences({...preferences, saveConversations: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Prompts personalizados</Label>
                    <p className="text-sm text-slate-500">Habilitar prompts customizados baseados no seu perfil educacional</p>
                  </div>
                  <Switch
                    checked={preferences.customPrompts}
                    onCheckedChange={(checked) => setPreferences({...preferences, customPrompts: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={resetToDefaults}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrões
            </Button>
            
            <Button 
              onClick={savePreferences}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando...' : 'Salvar Preferências'}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}