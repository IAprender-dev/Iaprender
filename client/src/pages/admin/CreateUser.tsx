import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Mail, UserCheck, Building, Copy } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CreateUserForm {
  name: string;
  email: string;
  group: 'Admin' | 'Gestores' | 'Diretores' | 'Professores' | 'Alunos';
  tempPassword?: string;
  companyId?: string;
}

interface CreateUserResponse {
  success: boolean;
  userId?: string;
  tempPassword?: string;
  firstAccessUrl?: string;
  error?: string;
}

export default function CreateUser() {
  const [formData, setFormData] = useState<CreateUserForm>({
    name: '',
    email: '',
    group: 'Admin'
  });
  const [createdUser, setCreatedUser] = useState<CreateUserResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserForm): Promise<CreateUserResponse> => {
      return await apiRequest('/api/admin/users/create', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    },
    onSuccess: (response: CreateUserResponse) => {
      if (response.success) {
        setCreatedUser(response);
        toast({
          title: "Usuário criado com sucesso!",
          description: `Usuário ${formData.name} foi criado no AWS Cognito`,
          variant: "default",
        });
        // Invalidar cache da listagem de usuários
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users/list'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users/statistics'] });
      } else {
        throw new Error(response.error || 'Erro ao criar usuário');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Tente novamente em alguns minutos",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e email são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(formData);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
      variant: "default",
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      group: 'Admin'
    });
    setCreatedUser(null);
  };

  if (createdUser?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/user-management">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Gestão
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Usuário Criado com Sucesso</h1>
          </div>

          <div className="grid gap-6">
            {/* Card de Sucesso */}
            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <UserCheck className="h-5 w-5" />
                  Usuário Criado no AWS Cognito
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  O usuário foi criado com sucesso e está pronto para primeiro acesso.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-emerald-800">Nome Completo</Label>
                    <p className="text-emerald-900 font-semibold">{formData.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-emerald-800">Email</Label>
                    <p className="text-emerald-900 font-semibold">{formData.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-emerald-800">Grupo AWS</Label>
                    <p className="text-emerald-900 font-semibold">{formData.group}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-emerald-800">ID do Usuário</Label>
                    <p className="text-emerald-900 font-semibold">{createdUser.userId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Credenciais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Mail className="h-5 w-5" />
                  Credenciais de Primeiro Acesso
                </CardTitle>
                <CardDescription>
                  Envie estas informações para o usuário fazer o primeiro login.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {createdUser.tempPassword && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Senha Temporária</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={createdUser.tempPassword} 
                        readOnly 
                        className="bg-slate-50"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(createdUser.tempPassword!, 'Senha temporária')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {createdUser.firstAccessUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">URL de Primeiro Acesso</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={createdUser.firstAccessUrl} 
                        readOnly 
                        className="bg-slate-50"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(createdUser.firstAccessUrl!, 'URL de primeiro acesso')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Instruções para o Usuário:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Acesse a URL de primeiro acesso fornecida</li>
                    <li>Use o email: <strong>{formData.email}</strong></li>
                    <li>Use a senha temporária fornecida</li>
                    <li>Siga as instruções para criar uma nova senha</li>
                    <li>Complete o processo de onboarding</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex gap-3">
              <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                <User className="h-4 w-4 mr-2" />
                Criar Outro Usuário
              </Button>
              <Link href="/admin/user-management">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar à Gestão de Usuários
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/user-management">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Criar Novo Usuário</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Usuário
            </CardTitle>
            <CardDescription>
              Crie um novo usuário no AWS Cognito com acesso à plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: João Silva Santos"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="joao.silva@exemplo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group">Grupo de Acesso *</Label>
                <Select 
                  value={formData.group} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, group: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin - Acesso completo ao sistema</SelectItem>
                    <SelectItem value="Gestores">Gestores - Gerentes municipais</SelectItem>
                    <SelectItem value="Diretores">Diretores - Diretores de escola</SelectItem>
                    <SelectItem value="Professores">Professores - Educadores</SelectItem>
                    <SelectItem value="Alunos">Alunos - Estudantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempPassword">Senha Temporária (opcional)</Label>
                <Input
                  id="tempPassword"
                  type="password"
                  value={formData.tempPassword || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempPassword: e.target.value }))}
                  placeholder="Deixe vazio para gerar automaticamente"
                />
                <p className="text-sm text-gray-600">
                  Se não informada, uma senha será gerada automaticamente.
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-amber-900 mb-2">Informações Importantes:</h4>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>O usuário será criado no AWS Cognito com status ativo</li>
                  <li>Uma senha temporária será gerada se não informada</li>
                  <li>O usuário precisará alterar a senha no primeiro acesso</li>
                  <li>Um link de primeiro acesso será gerado automaticamente</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando Usuário...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Criar Usuário
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Limpar Formulário
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}