import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User, 
  CheckCircle, 
  BookOpen, 
  Users, 
  Shield, 
  GraduationCap,
  Building
} from 'lucide-react';

interface FirstAccessData {
  email: string;
  tempPassword: string;
  group: string;
  userId: string;
}

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export default function FirstAccess() {
  const [location, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<FirstAccessData | null>(null);
  const [error, setError] = useState('');
  const { toast } = useToast();

  // Extrair dados da URL ou localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const storedData = localStorage.getItem('firstAccessData');
    
    if (storedData) {
      setUserData(JSON.parse(storedData));
    } else if (urlParams.get('email')) {
      const data = {
        email: urlParams.get('email') || '',
        tempPassword: urlParams.get('tempPassword') || '',
        group: urlParams.get('group') || '',
        userId: urlParams.get('userId') || ''
      };
      setUserData(data);
      localStorage.setItem('firstAccessData', JSON.stringify(data));
    } else {
      // Redirecionar para login se não houver dados
      setLocation('/auth');
    }
  }, [setLocation]);

  const getOnboardingSteps = (group: string): OnboardingStep[] => {
    const baseSteps = [
      {
        id: 1,
        title: 'Alterar Senha',
        description: 'Defina uma nova senha segura para sua conta',
        icon: <Lock className="h-5 w-5" />,
        completed: step > 1
      },
      {
        id: 2,
        title: 'Bem-vindo ao Sistema',
        description: 'Conheça as funcionalidades disponíveis',
        icon: <User className="h-5 w-5" />,
        completed: step > 2
      }
    ];

    const roleSpecificSteps = getRoleSpecificSteps(group);
    return [...baseSteps, ...roleSpecificSteps];
  };

  const getRoleSpecificSteps = (group: string): OnboardingStep[] => {
    switch (group) {
      case 'Admin':
        return [
          {
            id: 3,
            title: 'Painel Administrativo',
            description: 'Gerencie usuários, contratos e configurações do sistema',
            icon: <Shield className="h-5 w-5" />,
            completed: step > 3
          }
        ];
      case 'Gestores':
        return [
          {
            id: 3,
            title: 'Gestão Municipal',
            description: 'Administre escolas e diretores do seu município',
            icon: <Building className="h-5 w-5" />,
            completed: step > 3
          }
        ];
      case 'Diretores':
        return [
          {
            id: 3,
            title: 'Gestão Escolar',
            description: 'Gerencie professores e alunos da sua escola',
            icon: <Users className="h-5 w-5" />,
            completed: step > 3
          }
        ];
      case 'Professores':
        return [
          {
            id: 3,
            title: 'Ferramentas Educacionais',
            description: 'Acesse IA para planejamento de aulas e materiais',
            icon: <BookOpen className="h-5 w-5" />,
            completed: step > 3
          }
        ];
      case 'Alunos':
        return [
          {
            id: 3,
            title: 'Área do Estudante',
            description: 'Explore ferramentas de estudo e IA educacional',
            icon: <GraduationCap className="h-5 w-5" />,
            completed: step > 3
          }
        ];
      default:
        return [];
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Uma letra maiúscula');
    if (!/[a-z]/.test(password)) errors.push('Uma letra minúscula');
    if (!/[0-9]/.test(password)) errors.push('Um número');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Um caractere especial (!@#$%^&*)');
    return errors;
  };

  const handlePasswordChange = async () => {
    if (!userData) return;

    setError('');
    const passwordErrors = validatePassword(formData.newPassword);
    
    if (passwordErrors.length > 0) {
      setError('Senha deve conter: ' + passwordErrors.join(', '));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: userData.email,
          tempPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Senha alterada com sucesso!",
          description: "Agora você pode continuar com o tutorial.",
        });
        setStep(2);
      } else {
        setError(result.error || 'Erro ao alterar senha');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!userData) return;

    try {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: userData.userId,
          email: userData.email,
          group: userData.group
        }),
      });

      if (response.ok) {
        localStorage.removeItem('firstAccessData');
        toast({
          title: "Bem-vindo ao IAprender!",
          description: "Seu perfil está configurado. Redirecionando...",
        });

        // Redirecionar baseado no grupo
        setTimeout(() => {
          switch (userData.group) {
            case 'Admin':
              setLocation('/admin/master');
              break;
            case 'Gestores':
              setLocation('/municipal/dashboard');
              break;
            case 'Diretores':
              setLocation('/school/dashboard');
              break;
            case 'Professores':
              setLocation('/professor');
              break;
            case 'Alunos':
              setLocation('/student/dashboard');
              break;
            default:
              setLocation('/auth');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
    }
  };

  const getRoleDisplayName = (group: string): string => {
    const roleNames = {
      'Admin': 'Administrador',
      'Gestores': 'Gestor Municipal',
      'Diretores': 'Diretor de Escola',
      'Professores': 'Professor',
      'Alunos': 'Aluno'
    };
    return roleNames[group as keyof typeof roleNames] || group;
  };

  const getRoleColor = (group: string): string => {
    const colors = {
      'Admin': 'bg-red-500',
      'Gestores': 'bg-blue-500',
      'Diretores': 'bg-purple-500',
      'Professores': 'bg-green-500',
      'Alunos': 'bg-orange-500'
    };
    return colors[group as keyof typeof colors] || 'bg-gray-500';
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const steps = getOnboardingSteps(userData.group);
  const currentStepData = steps.find(s => s.id === step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Primeiro Acesso - IAprender
          </h1>
          <p className="text-gray-600">Configure sua conta para começar a usar a plataforma</p>
          
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge className={`${getRoleColor(userData.group)} text-white`}>
              {getRoleDisplayName(userData.group)}
            </Badge>
            <span className="text-sm text-gray-500">{userData.email}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progresso: {step}/{steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((step / steps.length) * 100)}%
            </span>
          </div>
          <Progress value={(step / steps.length) * 100} className="h-2" />
        </div>

        {/* Steps Overview */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {steps.map((stepItem) => (
              <div
                key={stepItem.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  stepItem.completed 
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : stepItem.id === step
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                {stepItem.completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  stepItem.icon
                )}
                <span className="text-sm font-medium">{stepItem.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStepData?.icon}
              {currentStepData?.title}
            </CardTitle>
            <CardDescription>
              {currentStepData?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Senha Temporária</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                      placeholder="Digite a senha temporária recebida"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      placeholder="Digite sua nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    A senha deve conter: mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      placeholder="Confirme sua nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handlePasswordChange} 
                  disabled={isLoading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                  className="w-full"
                >
                  {isLoading ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold">Bem-vindo ao IAprender!</h3>
                <p className="text-gray-600">
                  Sua conta foi configurada com sucesso. Como {getRoleDisplayName(userData.group)}, 
                  você terá acesso às seguintes funcionalidades:
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg text-left">
                  {userData.group === 'Admin' && (
                    <ul className="space-y-2 text-sm">
                      <li>• Gestão completa de usuários e contratos</li>
                      <li>• Monitoramento de uso da plataforma</li>
                      <li>• Configurações avançadas do sistema</li>
                      <li>• Relatórios administrativos</li>
                    </ul>
                  )}
                  {userData.group === 'Gestores' && (
                    <ul className="space-y-2 text-sm">
                      <li>• Gestão de escolas do município</li>
                      <li>• Criação e gestão de diretores</li>
                      <li>• Relatórios educacionais municipais</li>
                      <li>• Controle de contratos educacionais</li>
                    </ul>
                  )}
                  {userData.group === 'Diretores' && (
                    <ul className="space-y-2 text-sm">
                      <li>• Gestão de professores e alunos</li>
                      <li>• Relatórios de desempenho escolar</li>
                      <li>• Comunicação institucional</li>
                      <li>• Monitoramento educacional</li>
                    </ul>
                  )}
                  {userData.group === 'Professores' && (
                    <ul className="space-y-2 text-sm">
                      <li>• Planejamento de aulas com IA</li>
                      <li>• Geração de atividades educacionais</li>
                      <li>• Análise de documentos</li>
                      <li>• Materiais didáticos personalizados</li>
                    </ul>
                  )}
                  {userData.group === 'Alunos' && (
                    <ul className="space-y-2 text-sm">
                      <li>• Tutor de IA personalizado</li>
                      <li>• Gerador de planos de estudo</li>
                      <li>• Quizzes interativos</li>
                      <li>• Ferramentas de pesquisa e tradução</li>
                    </ul>
                  )}
                </div>

                <Button onClick={() => setStep(3)} className="w-full">
                  Continuar
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold">Tudo Pronto!</h3>
                <p className="text-gray-600">
                  Sua conta está configurada e você já pode começar a usar todas as funcionalidades 
                  do IAprender. Clique no botão abaixo para acessar seu painel.
                </p>

                <Button onClick={completeOnboarding} className="w-full" size="lg">
                  Acessar {getRoleDisplayName(userData.group)} Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}