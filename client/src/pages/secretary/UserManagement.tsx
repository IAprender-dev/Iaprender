import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  GraduationCap, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Grid3X3,
  List,
  ArrowUpDown,
  Mail,
  Phone,
  MapPin,
  Calendar,
  School,
  Shield,
  BookOpen
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

// Edit User Form Component - Seguindo o mesmo padrão do formulário de criação
function EditUserForm({ user, onSave, onCancel, isLoading }: {
  user: User;
  onSave: (userData: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    status: user.status,
    schoolYear: user.schoolYear || "",
    phone: user.phone || "",
    address: user.address || "",
    dateOfBirth: user.dateOfBirth || "",
    parentName: user.parentName || "",
    parentEmail: user.parentEmail || "",
    parentPhone: user.parentPhone || "",
    isMinor: user.isMinor || false,
  });

  const handleSave = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      return;
    }
    onSave(formData);
  };

  // Dados das funções e anos acadêmicos (mesmo do formulário de criação)
  const roleOptions = [
    { id: 1, name: 'Aluno', description: 'Acesso aos conteúdos educacionais e atividades', icon: '🎓' },
    { id: 2, name: 'Professor', description: 'Criação de conteúdos e gestão de turmas', icon: '👨‍🏫' },
    { id: 3, name: 'Administrador', description: 'Acesso completo ao sistema', icon: '⚙️' },
    { id: 4, name: 'Secretaria', description: 'Gestão administrativa da escola', icon: '📋' }
  ];

  const academicYears = [
    { id: 1, code: '1º ano fundamental', name: '1º Ano do Ensino Fundamental', stage: 'fundamental' },
    { id: 2, code: '2º ano fundamental', name: '2º Ano do Ensino Fundamental', stage: 'fundamental' },
    { id: 3, code: '3º ano fundamental', name: '3º Ano do Ensino Fundamental', stage: 'fundamental' },
    { id: 4, code: '4º ano fundamental', name: '4º Ano do Ensino Fundamental', stage: 'fundamental' },
    { id: 5, code: '5º ano fundamental', name: '5º Ano do Ensino Fundamental', stage: 'fundamental' },
    { id: 6, code: '6º ano fundamental', name: '6º Ano do Ensino Fundamental', stage: 'fundamental' },
    { id: 7, code: '7º ano fundamental', name: '7º Ano do Ensino Fundamental', stage: 'fundamental' },
    { id: 8, code: '8º ano fundamental', name: '8º Ano do Ensino Fundamental', stage: 'fundamental' },
    { id: 9, code: '9º ano fundamental', name: '9º Ano do Ensino Fundamental', stage: 'fundamental' },
    { id: 10, code: '1º ano médio', name: '1º Ano do Ensino Médio', stage: 'medio' },
    { id: 11, code: '2º ano médio', name: '2º Ano do Ensino Médio', stage: 'medio' },
    { id: 12, code: '3º ano médio', name: '3º Ano do Ensino Médio', stage: 'medio' }
  ];

  const selectedRole = roleOptions.find(r => 
    (r.name === 'Aluno' && formData.role === 'student') ||
    (r.name === 'Professor' && formData.role === 'teacher') ||
    (r.name === 'Administrador' && formData.role === 'admin') ||
    (r.name === 'Secretaria' && formData.role === 'secretary')
  );
  const isStudentRole = formData.role === 'student';

  return (
    <div className="space-y-6 px-2">
      {/* Identificação do Usuário - Card único com todos os campos */}
      <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl p-6 border border-blue-200/60 shadow-lg">
        <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          Identificação do Usuário
        </h3>
        
        <div className="space-y-4">
          {/* Função */}
          <div className="space-y-2">
            <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Função</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData({...formData, role: value})}
            >
              <SelectTrigger className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <SelectValue placeholder="Selecione a função do usuário" className="text-slate-600" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl">
                {roleOptions.map((role) => (
                  <SelectItem key={role.id} value={role.name === 'Aluno' ? 'student' : role.name === 'Professor' ? 'teacher' : role.name === 'Administrador' ? 'admin' : 'secretary'} className="py-4 px-4 hover:bg-blue-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm">{role.icon}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{role.name}</p>
                        <p className="text-xs text-slate-600">{role.description}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Status do Usuário</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <SelectValue placeholder="Selecione o status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl">
                <SelectItem value="active" className="py-4 px-4 hover:bg-green-50/50 rounded-lg cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">✅</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Ativo</p>
                      <p className="text-xs text-slate-600">Usuário com acesso liberado</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="inactive" className="py-4 px-4 hover:bg-red-50/50 rounded-lg cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">❌</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Inativo</p>
                      <p className="text-xs text-slate-600">Usuário sem acesso ao sistema</p>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="pending" className="py-4 px-4 hover:bg-yellow-50/50 rounded-lg cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">⏳</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Pendente</p>
                      <p className="text-xs text-slate-600">Aguardando aprovação</p>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nome e Sobrenome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Nome</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                placeholder="Digite o primeiro nome"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Sobrenome</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                placeholder="Digite o sobrenome completo"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
              placeholder="Digite o email principal do usuário"
            />
          </div>
        </div>
      </div>

      {/* Informações Pessoais */}
      <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 rounded-xl p-6 border border-green-200/60 shadow-lg">
        <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-white" />
          </div>
          Informações Pessoais
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="rounded-2xl h-14 border-2 border-slate-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Data de Nascimento</Label>
              <Input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                className="rounded-2xl h-14 border-2 border-slate-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Endereço Completo</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="rounded-2xl border-2 border-slate-200 focus:border-green-500 focus:ring-green-500/20 focus:ring-4 transition-all duration-300 text-base p-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium resize-none"
              placeholder="Digite o endereço completo (rua, número, bairro, cidade, CEP)"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Informações Acadêmicas - só aparece se for aluno */}
      {isStudentRole && (
        <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-xl p-6 border border-purple-200/60 shadow-lg">
          <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            Informações Acadêmicas
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Ano Escolar</Label>
              <Select 
                value={formData.schoolYear} 
                onValueChange={(value) => setFormData({...formData, schoolYear: value})}
              >
                <SelectTrigger className="rounded-2xl h-14 border-2 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <SelectValue placeholder="Selecione o ano escolar do aluno" className="text-slate-600" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl">
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.code} className="py-4 px-4 hover:bg-purple-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">{year.code.split('º')[0]}º</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{year.name}</p>
                          <p className="text-xs text-slate-600">Ensino {year.stage === 'fundamental' ? 'Fundamental' : 'Médio'}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t-2 border-slate-200">
        <Button 
          type="button"
          variant="outline"
          onClick={onCancel}
          className="order-2 sm:order-1 h-14 px-8 rounded-2xl border-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-300 font-bold text-base"
        >
          Cancelar Edição
        </Button>
        <Button 
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="order-1 sm:order-2 h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-base transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? "Salvando Alterações..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  schoolYear?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  isMinor?: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Dados das funções e anos acadêmicos
  const roles = [
    { id: 1, name: 'Administrador', level: 1 },
    { id: 2, name: 'Secretaria', level: 2 },
    { id: 3, name: 'Professor', level: 3 },
    { id: 4, name: 'Aluno', level: 4 }
  ];

  const academicYears = [
    { id: 1, name: '1º Ano do Ensino Fundamental', code: '1ano' },
    { id: 2, name: '2º Ano do Ensino Fundamental', code: '2ano' },
    { id: 3, name: '3º Ano do Ensino Fundamental', code: '3ano' },
    { id: 4, name: '4º Ano do Ensino Fundamental', code: '4ano' },
    { id: 5, name: '5º Ano do Ensino Fundamental', code: '5ano' },
    { id: 6, name: '6º Ano do Ensino Fundamental', code: '6ano' },
    { id: 7, name: '7º Ano do Ensino Fundamental', code: '7ano' },
    { id: 8, name: '8º Ano do Ensino Fundamental', code: '8ano' },
    { id: 9, name: '9º Ano do Ensino Fundamental', code: '9ano' }
  ];

  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "", 
    email: "",
    role: "student",
    roleId: 4, // Padrão: Aluno
    academicYearId: null as number | null,
    schoolYear: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    filiation: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    parent2Name: "",
    parent2Email: "",
    parent2Phone: "",
    parent1Relationship: "",
    parent2Relationship: "",
    isMinor: true,
  });

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/secretary/users', searchTerm, filterRole, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`/api/secretary/users?${params}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/secretary/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/users'] });
      
      let description = "O novo usuário foi adicionado à plataforma.";
      if (data.temporaryPassword) {
        description = `Senha temporária: ${data.temporaryPassword} (deve ser alterada no primeiro login)`;
        
        if (data.emailSent && data.whatsappSent) {
          description += "\n📧 Email enviado ✅ | 📱 WhatsApp enviado ✅";
        } else if (data.emailSent) {
          description += "\n📧 Email enviado ✅ | 📱 WhatsApp não enviado";
        } else if (data.whatsappSent) {
          description += "\n📧 Email não enviado | 📱 WhatsApp enviado ✅";
        } else {
          description += "\n📧 Email não enviado | 📱 WhatsApp não enviado";
        }
      }
      
      toast({ 
        title: "✅ Usuário criado com sucesso!", 
        description: description
      });
      setIsCreateDialogOpen(false);
      resetNewUserForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Erro ao criar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number, userData: any }) => {
      const response = await fetch(`/api/secretary/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/users'] });
      toast({ 
        title: "✅ Usuário atualizado com sucesso!", 
        description: "As alterações foram salvas." 
      });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Erro ao atualizar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/secretary/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/secretary/users'] });
      toast({ 
        title: "✅ Usuário removido com sucesso!", 
        description: "O usuário foi removido da plataforma." 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "❌ Erro ao remover usuário", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const resetNewUserForm = () => {
    setNewUser({
      firstName: "",
      lastName: "", 
      email: "",
      role: "student",
      roleId: 4, // Padrão: Aluno
      academicYearId: null,
      schoolYear: "",
      phone: "",
      address: "",
      dateOfBirth: "",
      filiation: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      parent2Name: "",
      parent2Email: "",
      parent2Phone: "",
      parent1Relationship: "",
      parent2Relationship: "",
      isMinor: true,
    });
  };

  // Obter função selecionada
  const selectedRole = roles.find((r) => r.id === newUser.roleId);
  const isStudentRole = selectedRole?.name === 'Aluno';

  // Filter users based on search and filters
  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = !searchTerm || 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'inactive': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'teacher': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'student': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleCreateUser = () => {
    if (!newUser.firstName.trim() || !newUser.lastName.trim() || !newUser.email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, sobrenome e email",
        variant: "destructive",
      });
      return;
    }

    // Converter dados do formulário para o schema atual do backend
    const userData = {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: selectedRole?.name === 'Aluno' ? 'student' : 
            selectedRole?.name === 'Professor' ? 'teacher' :
            selectedRole?.name === 'Secretaria' ? 'secretary' : 'admin',
      schoolYear: academicYears.find(y => y.id === newUser.academicYearId)?.code || newUser.schoolYear,
      phone: newUser.phone,
      address: newUser.address,
      dateOfBirth: newUser.dateOfBirth,
      parentName: newUser.parentName,
      parentEmail: newUser.parentEmail,
      parentPhone: newUser.parentPhone,
      isMinor: newUser.isMinor,
    };
    
    createUserMutation.mutate(userData);
  };

  const handleUpdateUser = (userData: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, userData });
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <>
      <Helmet>
        <title>Gestão de Usuários - Secretaria - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/secretary">
                  <Button variant="outline" size="sm" className="gap-2 border-slate-300 hover:bg-slate-50">
                    <Users className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                    Gestão de Usuários
                  </h1>
                  <p className="text-slate-600 mt-1">Gerencie alunos, professores e suas informações</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2">
                  <Shield className="h-4 w-4 mr-1" />
                  {filteredUsers.length} usuários
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Controls */}
          <Card className="mb-8 border-0 bg-white/70 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search and Filters */}
                <div className="flex flex-1 gap-4 items-center">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por nome, email ou usuário..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 bg-white/80 border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                    />
                  </div>
                  
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-48 h-12 bg-white/80 border-slate-300">
                      <SelectValue placeholder="Filtrar por cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os cargos</SelectItem>
                      <SelectItem value="student">Alunos</SelectItem>
                      <SelectItem value="teacher">Professores</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48 h-12 bg-white/80 border-slate-300">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className="px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium h-12 px-6">
                        <UserPlus className="h-5 w-5 mr-2" />
                        Novo Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
                      <DialogHeader className="space-y-4 pb-6 pt-2">
                        <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
                          Novo Usuário
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 font-medium text-center text-lg">
                          Preencha os dados para cadastrar um novo membro na plataforma educacional
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 px-2">
                        {/* Identificação do Usuário - Card único com todos os campos */}
                        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-xl p-6 border border-blue-200/60 shadow-lg">
                          <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                            Identificação do Usuário
                          </h3>
                          
                          <div className="space-y-4">
                            {/* Função */}
                            <div className="space-y-2">
                              <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Função</Label>
                              <Select 
                                value={newUser.roleId?.toString()} 
                                onValueChange={(value) => setNewUser({...newUser, roleId: parseInt(value)})}
                              >
                                <SelectTrigger className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                      <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <SelectValue placeholder="Selecione a função do usuário" className="text-slate-600" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl">
                                  {roles.map((role: Role) => (
                                    <SelectItem key={role.id} value={role.id.toString()} className="py-4 px-4 hover:bg-blue-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                      <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                          role.name === 'Professor' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                                          role.name === 'Aluno' ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                                          role.name === 'Secretário' ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                                          'bg-gradient-to-br from-slate-500 to-gray-600'
                                        }`}>
                                          <span className="text-white text-sm">
                                            {role.name === 'Professor' ? '👨‍🏫' :
                                             role.name === 'Aluno' ? '🎓' :
                                             role.name === 'Secretário' ? '📝' :
                                             '👤'}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-800">{role.name}</p>
                                          <p className="text-xs text-slate-600">
                                            {role.name === 'Professor' ? 'Criar conteúdo e gerenciar turmas' :
                                             role.name === 'Aluno' ? 'Aprender e acompanhar progresso' :
                                             role.name === 'Secretário' ? 'Administrar usuários e sistema' :
                                             'Usuário do sistema'}
                                          </p>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Nome e Sobrenome */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Nome</Label>
                                <Input
                                  value={newUser.firstName}
                                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                                  className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                  placeholder="Digite o nome completo"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Sobrenome</Label>
                                <Input
                                  value={newUser.lastName}
                                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                                  className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                  placeholder="Digite o sobrenome completo"
                                />
                              </div>
                            </div>

                            {/* Data de Nascimento */}
                            <div className="space-y-2">
                              <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Data de Nascimento</Label>
                              <Input
                                type="date"
                                value={newUser.dateOfBirth}
                                onChange={(e) => setNewUser({...newUser, dateOfBirth: e.target.value})}
                                className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium"
                              />
                            </div>

                            {/* E-mail e Telefone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">E-mail</Label>
                                <Input
                                  type="email"
                                  value={newUser.email}
                                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                  className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                  placeholder="Digite o email institucional"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Telefone</Label>
                                <Input
                                  value={newUser.phone}
                                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                                  className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                  placeholder="Digite o telefone de contato"
                                />
                              </div>
                            </div>

                            {/* Endereço */}
                            <div className="space-y-2">
                              <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Endereço</Label>
                              <Textarea
                                value={newUser.address}
                                onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                                className="rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 py-3 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium resize-none"
                                placeholder="Digite o endereço completo com rua, número, bairro, cidade e CEP"
                                rows={3}
                              />
                            </div>

                            {/* Ano Escolar - Apenas para Alunos */}
                            {isStudentRole && (
                              <div className="space-y-2">
                                <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Ano Escolar</Label>
                                <Select 
                                  value={newUser.academicYearId?.toString()} 
                                  onValueChange={(value) => setNewUser({...newUser, academicYearId: parseInt(value)})}
                                >
                                  <SelectTrigger className="rounded-2xl h-14 border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-4 h-4 text-white" />
                                      </div>
                                      <SelectValue placeholder="Selecione o ano escolar" className="text-slate-600" />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl max-h-80">
                                    <div className="p-2">
                                      <div className="mb-3">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Ensino Fundamental I</p>
                                      </div>
                                      <SelectItem value="1" className="py-3 px-3 hover:bg-pink-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            🎨
                                          </div>
                                          <span className="font-medium text-slate-800">1º ano - Mundo das Cores</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="2" className="py-3 px-3 hover:bg-orange-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            🌟
                                          </div>
                                          <span className="font-medium text-slate-800">2º ano - Descoberta das Palavras</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="3" className="py-3 px-3 hover:bg-yellow-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            🏃‍♂️
                                          </div>
                                          <span className="font-medium text-slate-800">3º ano - Aventura dos Números</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="4" className="py-3 px-3 hover:bg-green-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            🌍
                                          </div>
                                          <span className="font-medium text-slate-800">4º ano - Exploradores da Natureza</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="5" className="py-3 px-3 hover:bg-teal-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-4">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            🚀
                                          </div>
                                          <span className="font-medium text-slate-800">5º ano - Cientistas do Futuro</span>
                                        </div>
                                      </SelectItem>
                                      
                                      <div className="mb-3 mt-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">Ensino Fundamental II</p>
                                      </div>
                                      <SelectItem value="6" className="py-3 px-3 hover:bg-blue-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            🎯
                                          </div>
                                          <span className="font-medium text-slate-800">6º ano - Desbravadores do Conhecimento</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="7" className="py-3 px-3 hover:bg-indigo-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            🔬
                                          </div>
                                          <span className="font-medium text-slate-800">7º ano - Investigadores da Ciência</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="8" className="py-3 px-3 hover:bg-purple-50/40 rounded-lg cursor-pointer transition-colors duration-150 mb-1">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            📚
                                          </div>
                                          <span className="font-medium text-slate-800">8º ano - Mestres da Razão</span>
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="9" className="py-3 px-3 hover:bg-rose-50/40 rounded-lg cursor-pointer transition-colors duration-150">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                            🏆
                                          </div>
                                          <span className="font-medium text-slate-800">9º ano - Campeões do Saber</span>
                                        </div>
                                      </SelectItem>
                                    </div>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Separador */}
                        {isStudentRole && (
                          <div className="flex items-center justify-center">
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent w-full"></div>
                            <div className="px-4">
                              <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent w-full"></div>
                          </div>
                        )}

                        {/* Dados dos Responsáveis - Apenas para Alunos menores de idade */}
                        {isStudentRole && (
                          <div className="bg-gradient-to-br from-amber-50/80 to-yellow-50/80 rounded-xl p-6 border border-amber-200/60 shadow-lg">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-full flex items-center justify-center">
                                <Users className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id="isMinor"
                                  checked={newUser.isMinor}
                                  onChange={(e) => setNewUser({ ...newUser, isMinor: e.target.checked })}
                                  className="h-5 w-5 rounded border-2 border-amber-400 text-amber-600 focus:ring-amber-500 focus:ring-2"
                                />
                                <Label htmlFor="isMinor" className="text-xl font-bold text-slate-700 cursor-pointer">
                                  Menor de idade (dados dos responsáveis obrigatórios)
                                </Label>
                              </div>
                            </div>

                            {newUser.isMinor && (
                              <div className="space-y-6">
                                {/* Primeiro Responsável */}
                                <div className="space-y-4">
                                  <h4 className="text-lg font-semibold text-slate-700 border-b border-amber-300/50 pb-2">
                                    1º Responsável
                                  </h4>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Nome do Responsável</Label>
                                      <Input
                                        value={newUser.parentName}
                                        onChange={(e) => setNewUser({...newUser, parentName: e.target.value})}
                                        className="rounded-2xl h-14 border-2 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                        placeholder="Digite o nome completo do responsável"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Grau de Parentesco</Label>
                                      <Select 
                                        value={newUser.parent1Relationship} 
                                        onValueChange={(value) => setNewUser({...newUser, parent1Relationship: value})}
                                      >
                                        <SelectTrigger className="rounded-2xl h-14 border-2 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                                              <Users className="w-4 h-4 text-white" />
                                            </div>
                                            <SelectValue placeholder="Selecione o grau de parentesco" className="text-slate-600" />
                                          </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl">
                                          <SelectItem value="pai" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">👨</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Pai</p>
                                                <p className="text-xs text-slate-600">Responsável paterno</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="mae" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">👩</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Mãe</p>
                                                <p className="text-xs text-slate-600">Responsável materna</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="avo" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">👴</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Avô/Avó</p>
                                                <p className="text-xs text-slate-600">Responsável avós</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="tio" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">👨‍👩‍👧</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Tio/Tia</p>
                                                <p className="text-xs text-slate-600">Responsável tios</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="responsavel" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">⚖️</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Responsável Legal</p>
                                                <p className="text-xs text-slate-600">Guardião designado</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="tutor" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">🎓</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Tutor</p>
                                                <p className="text-xs text-slate-600">Responsável educacional</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Email do Responsável</Label>
                                      <Input
                                        type="email"
                                        value={newUser.parentEmail}
                                        onChange={(e) => setNewUser({...newUser, parentEmail: e.target.value})}
                                        className="rounded-2xl h-14 border-2 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                        placeholder="Digite o email do responsável"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Telefone do Responsável</Label>
                                      <Input
                                        value={newUser.parentPhone}
                                        onChange={(e) => setNewUser({...newUser, parentPhone: e.target.value})}
                                        className="rounded-2xl h-14 border-2 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                        placeholder="Digite o telefone do responsável"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Segundo Responsável */}
                                <div className="space-y-4">
                                  <h4 className="text-lg font-semibold text-slate-700 border-b border-amber-300/50 pb-2">
                                    2º Responsável
                                  </h4>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Nome do Responsável</Label>
                                      <Input
                                        value={newUser.parent2Name}
                                        onChange={(e) => setNewUser({...newUser, parent2Name: e.target.value})}
                                        className="rounded-2xl h-14 border-2 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                        placeholder="Digite o nome completo do segundo responsável"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Grau de Parentesco</Label>
                                      <Select 
                                        value={newUser.parent2Relationship} 
                                        onValueChange={(value) => setNewUser({...newUser, parent2Relationship: value})}
                                      >
                                        <SelectTrigger className="rounded-2xl h-14 border-2 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm text-slate-900 font-medium">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                                              <Users className="w-4 h-4 text-white" />
                                            </div>
                                            <SelectValue placeholder="Selecione o grau de parentesco" className="text-slate-600" />
                                          </div>
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-2 border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl">
                                          <SelectItem value="pai" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">👨</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Pai</p>
                                                <p className="text-xs text-slate-600">Responsável paterno</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="mae" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">👩</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Mãe</p>
                                                <p className="text-xs text-slate-600">Responsável materna</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="avo" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">👴</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Avô/Avó</p>
                                                <p className="text-xs text-slate-600">Responsável avós</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="tio" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">👨‍👩‍👧</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Tio/Tia</p>
                                                <p className="text-xs text-slate-600">Responsável tios</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="responsavel" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">⚖️</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Responsável Legal</p>
                                                <p className="text-xs text-slate-600">Guardião designado</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                          <SelectItem value="tutor" className="py-4 px-4 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors duration-200">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-sm">🎓</span>
                                              </div>
                                              <div>
                                                <p className="font-semibold text-slate-800">Tutor</p>
                                                <p className="text-xs text-slate-600">Responsável educacional</p>
                                              </div>
                                            </div>
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Email do Responsável</Label>
                                      <Input
                                        type="email"
                                        value={newUser.parent2Email}
                                        onChange={(e) => setNewUser({...newUser, parent2Email: e.target.value})}
                                        className="rounded-2xl h-14 border-2 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                        placeholder="Digite o email do segundo responsável"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-slate-800 font-bold text-sm tracking-wide uppercase">Telefone do Responsável</Label>
                                      <Input
                                        value={newUser.parent2Phone}
                                        onChange={(e) => setNewUser({...newUser, parent2Phone: e.target.value})}
                                        className="rounded-2xl h-14 border-2 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 focus:ring-4 transition-all duration-300 text-base px-4 bg-white/50 backdrop-blur-sm placeholder:text-slate-700 placeholder:font-medium text-slate-900 font-medium"
                                        placeholder="Digite o telefone do segundo responsável"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                          className="border-red-500 text-red-500 hover:bg-red-50"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCreateUser}
                          disabled={createUserMutation.isPending}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                        >
                          {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-0 bg-white/70 shadow-lg animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-200 rounded"></div>
                      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((userData) => (
                <Card key={userData.id} className="border-0 bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-slate-200 group-hover:border-purple-300 transition-colors">
                          <AvatarFallback className={`text-white font-bold text-lg ${
                            userData.role === 'teacher' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'
                          }`}>
                            {userData.firstName[0]}{userData.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 text-lg mb-1">
                            {userData.firstName} {userData.lastName}
                          </h3>
                          <p className="text-sm text-slate-600 mb-2">{userData.email}</p>
                          <div className="flex gap-2">
                            <Badge className={`text-xs ${getRoleColor(userData.role)}`}>
                              {userData.role === 'teacher' ? 'Professor' : 'Aluno'}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(userData.status)}`}>
                              {userData.status === 'active' ? 'Ativo' : userData.status === 'pending' ? 'Pendente' : 'Inativo'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Checkbox
                        checked={selectedUsers.has(userData.id)}
                        onCheckedChange={() => handleSelectUser(userData.id)}
                        className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                      />
                    </div>

                    <div className="space-y-3 mb-4">
                      {userData.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4" />
                          {userData.phone}
                        </div>
                      )}
                      {userData.schoolYear && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <School className="h-4 w-4" />
                          {userData.schoolYear}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span title={`Criado em ${new Date(userData.createdAt).toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}`}>
                          Criado em {new Date(userData.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(userData)}
                        className="flex-1 border-slate-300 hover:bg-slate-50"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(userData.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                            onCheckedChange={handleSelectAll}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                        </TableHead>
                        <TableHead className="font-bold text-slate-700">Usuário</TableHead>
                        <TableHead className="font-bold text-slate-700">Cargo</TableHead>
                        <TableHead className="font-bold text-slate-700">Status</TableHead>
                        <TableHead className="font-bold text-slate-700">Contato</TableHead>
                        <TableHead className="font-bold text-slate-700">Criado em</TableHead>
                        <TableHead className="font-bold text-slate-700 w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userData) => (
                        <TableRow key={userData.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.has(userData.id)}
                              onCheckedChange={() => handleSelectUser(userData.id)}
                              className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className={`text-white font-bold ${
                                  userData.role === 'teacher' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'
                                }`}>
                                  {userData.firstName[0]}{userData.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900">{userData.firstName} {userData.lastName}</p>
                                <p className="text-sm text-slate-500">{userData.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getRoleColor(userData.role)}`}>
                              {userData.role === 'teacher' ? 'Professor' : 'Aluno'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(userData.status)}`}>
                              {userData.status === 'active' ? 'Ativo' : userData.status === 'pending' ? 'Pendente' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {userData.phone && (
                                <div className="flex items-center gap-1 text-slate-600">
                                  <Phone className="h-3 w-3" />
                                  {userData.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            <span title={`Criado em ${new Date(userData.createdAt).toLocaleDateString('pt-BR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}`}>
                              {new Date(userData.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingUser(userData)}
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(userData.id)}
                                className="h-8 w-8 p-0 hover:bg-red-100 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && filteredUsers.length === 0 && (
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-bold text-slate-600 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                    ? 'Tente ajustar os filtros para encontrar usuários.'
                    : 'Não há usuários cadastrados no sistema.'}
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Primeiro Usuário
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
              <DialogHeader className="space-y-4 pb-6 pt-2">
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
                  Editar Usuário
                </DialogTitle>
                <DialogDescription className="text-slate-600 font-medium text-center text-lg">
                  Altere as informações do usuário {editingUser.firstName} {editingUser.lastName}
                </DialogDescription>
              </DialogHeader>
              
              <EditUserForm 
                user={editingUser} 
                onSave={handleUpdateUser}
                onCancel={() => setEditingUser(null)}
                isLoading={updateUserMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}