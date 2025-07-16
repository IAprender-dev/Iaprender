import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Cpu, Zap, BarChart3, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResourceConfig {
  id?: number;
  resourceId: string;
  resourceName: string;
  resourceType: 'teacher' | 'student';
  selectedModel: string;
  modelName?: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

interface ResourceConfigModalProps {
  resource: {
    id: string;
    title: string;
    type: 'teacher' | 'student';
    description: string;
    category?: string;
    enabled?: boolean;
  };
  trigger?: React.ReactNode;
  onSave?: (config: ResourceConfig) => void;
}

// Modelos AWS Bedrock disponíveis
const BEDROCK_MODELS = [
  {
    id: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Modelo mais avançado para raciocínio complexo',
    maxTokens: 8000,
    category: 'premium'
  },
  {
    id: 'anthropic.claude-3-haiku-20240307-v1:0',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Modelo rápido e eficiente para tarefas simples',
    maxTokens: 4000,
    category: 'fast'
  },
  {
    id: 'amazon.titan-text-premier-v1:0',
    name: 'Amazon Titan Text Premier',
    provider: 'Amazon',
    description: 'Modelo da Amazon para texto geral',
    maxTokens: 8000,
    category: 'balanced'
  },
  {
    id: 'meta.llama3-1-8b-instruct-v1:0',
    name: 'Meta Llama 3.1 8B',
    provider: 'Meta',
    description: 'Modelo open-source da Meta',
    maxTokens: 2048,
    category: 'efficient'
  },
  {
    id: 'ai21.jamba-1-5-mini-v1:0',
    name: 'AI21 Jamba 1.5 Mini',
    provider: 'AI21 Labs',
    description: 'Modelo híbrido eficiente',
    maxTokens: 4000,
    category: 'efficient'
  }
];

export function ResourceConfigModal({ resource, trigger, onSave }: ResourceConfigModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ResourceConfig>({
    resourceId: resource.id,
    resourceName: resource.title,
    resourceType: resource.type,
    selectedModel: 'anthropic.claude-3-haiku-20240307-v1:0',
    modelName: 'Claude 3 Haiku',
    temperature: 0.7,
    maxTokens: 1000,
    enabled: resource.enabled ?? true
  });

  const { toast } = useToast();

  // Carregar configuração existente ao abrir modal
  useEffect(() => {
    if (open) {
      loadExistingConfig();
    }
  }, [open]);

  const loadExistingConfig = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/ai-resource-configs/${resource.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setConfig(prev => ({ ...prev, ...result.data }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    const model = BEDROCK_MODELS.find(m => m.id === modelId);
    setConfig(prev => ({
      ...prev,
      selectedModel: modelId,
      modelName: model?.name,
      maxTokens: Math.min(prev.maxTokens, model?.maxTokens || 1000)
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/ai-resource-configs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Configuração Salva",
          description: `${resource.title} configurado com sucesso!`
        });
        
        if (onSave) {
          onSave(config);
        }
        
        setOpen(false);
      } else {
        throw new Error(result.message || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configuração",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedModel = BEDROCK_MODELS.find(m => m.id === config.selectedModel);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            Configurar Recurso de IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Recurso */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{resource.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                  {resource.category && (
                    <Badge variant="secondary" className="mt-2">
                      {resource.category}
                    </Badge>
                  )}
                </div>
                <Badge variant={resource.type === 'teacher' ? 'default' : 'outline'}>
                  {resource.type === 'teacher' ? 'Professor' : 'Aluno'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Configurações do Modelo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <h4 className="font-medium">Modelo de IA</h4>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="model">Modelo AWS Bedrock</Label>
                <Select value={config.selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {BEDROCK_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.name}</span>
                          <span className="text-xs text-gray-500">{model.provider} • {model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModel && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>Máximo de tokens: {selectedModel.maxTokens}</span>
                      <Badge variant="outline">{selectedModel.category}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Parâmetros Avançados */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium">Parâmetros Avançados</h4>
            </div>

            <div className="grid gap-6">
              {/* Temperature */}
              <div>
                <Label>Criatividade (Temperature): {config.temperature}</Label>
                <div className="mt-2">
                  <Slider
                    value={[config.temperature]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, temperature: value }))}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Conservador</span>
                    <span>Criativo</span>
                  </div>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <Label htmlFor="maxTokens">Máximo de Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    maxTokens: Math.min(Number(e.target.value), selectedModel?.maxTokens || 8000)
                  }))}
                  min={100}
                  max={selectedModel?.maxTokens || 8000}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controla o tamanho máximo da resposta (máx: {selectedModel?.maxTokens || 8000})
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Status do Recurso</Label>
                  <p className="text-xs text-gray-500">Habilitar/desabilitar este recurso</p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => setConfig(prev => ({ ...prev, enabled }))}
                />
              </div>
            </div>
          </div>

          {/* Alerta de Custos */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Informação de Custos</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Modelos premium como Claude 3.5 Sonnet têm custos mais altos por token. 
                Ajuste os parâmetros conforme o orçamento disponível.
              </p>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}