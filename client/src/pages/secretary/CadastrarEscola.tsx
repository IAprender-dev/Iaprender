import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  ArrowLeft, School, MapPin, Building2, Phone, Mail, 
  Users, FileText, CheckCircle, AlertCircle,
  Save, RefreshCw
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import iAprenderLogo from "@assets/IAprender_1750262377399.png";

interface EscolaForm {
  nomeEscola: string;
  inep: string;
  cnpj: string;
  idSecretaria: number;
  nomeDiretor: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  zona: string;
  numeroSalas: number;
  numeroAlunos: number;
  status: string;
}

export default function CadastrarEscola() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<EscolaForm>({
    nomeEscola: '',
    inep: '',
    cnpj: '',
    idSecretaria: 1,
    nomeDiretor: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    zona: '',
    numeroSalas: 0,
    numeroAlunos: 0,
    status: 'ativa'
  });

  // Fetch secretarias for dropdown
  const { data: secretarias } = useQuery({
    queryKey: ['/api/secretarias'],
    enabled: !!user
  });

  const createEscolaMutation = useMutation({
    mutationFn: (data: EscolaForm) => apiRequest('POST', '/api/escolas', data),
    onSuccess: () => {
      toast({
        title: "Escola cadastrada com sucesso!",
        description: "A nova unidade escolar foi adicionada ao sistema.",
      });
      // Reset form
      setFormData({
        nomeEscola: '',
        inep: '',
        cnpj: '',
        idSecretaria: 1,
        nomeDiretor: '',
        endereco: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        telefone: '',
        email: '',
        zona: '',
        numeroSalas: 0,
        numeroAlunos: 0,
        status: 'ativa'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/escolas'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar escola",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEscolaMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof EscolaForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Máscaras de entrada
  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const maskCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
      .slice(0, 15);
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <>
      <Helmet>
        <title>Cadastrar Escola | Panel SME</title>
        <meta name="description" content="Cadastro de nova unidade escolar" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-6">
                <Link href="/panel.sme">
                  <Button size="sm" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={iAprenderLogo} alt="IAprender" className="h-12 w-12 rounded-xl shadow-lg" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                      IAprender - Cadastrar Nova Escola
                    </h1>
                    <p className="text-slate-600 text-sm font-medium">Adicionar unidade escolar ao sistema</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 text-sm font-semibold">
                  <School className="h-4 w-4 mr-2" />
                  Cadastro Escolar
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">Secretário(a) de Educação</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6 space-y-8">
          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center gap-3">
                <School className="h-6 w-6" />
                Dados da Unidade Escolar
                <Badge className="bg-white/20 text-white ml-auto">
                  Formulário Oficial
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Informações Básicas */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Informações Básicas</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="nomeEscola" className="text-sm font-semibold text-slate-700">
                        Nome da Escola *
                      </Label>
                      <Input
                        id="nomeEscola"
                        value={formData.nomeEscola}
                        onChange={(e) => handleInputChange('nomeEscola', e.target.value)}
                        placeholder="EMEF Professor João Silva"
                        required
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="inep" className="text-sm font-semibold text-slate-700">
                        Código INEP
                      </Label>
                      <Input
                        id="inep"
                        value={formData.inep}
                        onChange={(e) => handleInputChange('inep', e.target.value)}
                        placeholder="35052562"
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cnpj" className="text-sm font-semibold text-slate-700">
                        CNPJ
                      </Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => handleInputChange('cnpj', maskCNPJ(e.target.value))}
                        placeholder="12.345.678/0001-90"
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nomeDiretor" className="text-sm font-semibold text-slate-700">
                        Nome do Diretor(a)
                      </Label>
                      <Input
                        id="nomeDiretor"
                        value={formData.nomeDiretor}
                        onChange={(e) => handleInputChange('nomeDiretor', e.target.value)}
                        placeholder="Maria Silva Santos"
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="zona" className="text-sm font-semibold text-slate-700">
                        Zona *
                      </Label>
                      <Select value={formData.zona} onValueChange={(value) => handleInputChange('zona', value)}>
                        <SelectTrigger className="mt-2 bg-slate-50 border-slate-300 focus:bg-white focus:border-blue-500 data-[placeholder]:text-slate-800 data-[placeholder]:font-medium text-slate-900 font-medium">
                          <SelectValue placeholder="Selecione a zona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urbana">Urbana</SelectItem>
                          <SelectItem value="rural">Rural</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Endereço</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <Label htmlFor="endereco" className="text-sm font-semibold text-slate-700">
                        Endereço Completo *
                      </Label>
                      <Input
                        id="endereco"
                        value={formData.endereco}
                        onChange={(e) => handleInputChange('endereco', e.target.value)}
                        placeholder="Rua das Flores, 456"
                        required
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cep" className="text-sm font-semibold text-slate-700">
                        CEP *
                      </Label>
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => handleInputChange('cep', maskCEP(e.target.value))}
                        placeholder="12345-678"
                        required
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bairro" className="text-sm font-semibold text-slate-700">
                        Bairro *
                      </Label>
                      <Input
                        id="bairro"
                        value={formData.bairro}
                        onChange={(e) => handleInputChange('bairro', e.target.value)}
                        placeholder="Centro"
                        required
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cidade" className="text-sm font-semibold text-slate-700">
                        Cidade *
                      </Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleInputChange('cidade', e.target.value)}
                        placeholder="São Paulo"
                        required
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="estado" className="text-sm font-semibold text-slate-700">
                        Estado *
                      </Label>
                      <Select value={formData.estado} onValueChange={(value) => handleInputChange('estado', value)}>
                        <SelectTrigger className="mt-2 bg-slate-50 border-slate-300 focus:bg-white focus:border-blue-500 data-[placeholder]:text-slate-800 data-[placeholder]:font-medium text-slate-900 font-medium">
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map(estado => (
                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Contato</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="telefone" className="text-sm font-semibold text-slate-700">
                        Telefone
                      </Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange('telefone', maskPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                        E-mail
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="escola@educacao.gov.br"
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Dados Adicionais */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-900">Dados Adicionais</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="numeroSalas" className="text-sm font-semibold text-slate-700">
                        Número de Salas
                      </Label>
                      <Input
                        id="numeroSalas"
                        type="number"
                        value={formData.numeroSalas}
                        onChange={(e) => handleInputChange('numeroSalas', parseInt(e.target.value) || 0)}
                        placeholder="12"
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>

                    <div>
                      <Label htmlFor="numeroAlunos" className="text-sm font-semibold text-slate-700">
                        Número de Alunos
                      </Label>
                      <Input
                        id="numeroAlunos"
                        type="number"
                        value={formData.numeroAlunos}
                        onChange={(e) => handleInputChange('numeroAlunos', parseInt(e.target.value) || 0)}
                        placeholder="450"
                        className="mt-2 bg-slate-50 border-slate-300 placeholder:text-slate-800 placeholder:font-medium focus:bg-white focus:border-blue-500 text-slate-900 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
                  <Button
                    type="button"
                    onClick={() => setFormData({
                      nomeEscola: '', inep: '', cnpj: '', idSecretaria: 1, nomeDiretor: '',
                      endereco: '', bairro: '', cidade: '', estado: '', cep: '', telefone: '',
                      email: '', zona: '', numeroSalas: 0, numeroAlunos: 0, status: 'ativa'
                    })}
                    className="bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEscolaMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    {createEscolaMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Cadastrar Escola
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}