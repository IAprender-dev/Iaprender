import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  School, 
  UserCheck, 
  GraduationCap, 
  LogOut, 
  ClipboardList,
  Settings,
  FileText
} from "lucide-react";

export default function SchoolDirectorDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Queries para dados reais da API
  const { data: schoolStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/school/stats'],
    enabled: !!user
  });

  const { data: schoolClasses, isLoading: classesLoading } = useQuery({
    queryKey: ['/api/school/classes'],
    enabled: !!user && activeTab === "classes"
  });

  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['/api/school/approvals'],
    enabled: !!user && activeTab === "approvals"
  });

  const { data: schoolInvitations, isLoading: invitationsLoading } = useQuery({
    queryKey: ['/api/school/invitations'],
    enabled: !!user && activeTab === "invitations"
  });

  const { data: schoolReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/school/reports'],
    enabled: !!user && activeTab === "reports"
  });

  // Estados de carregamento
  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados da escola...</p>
        </div>
      </div>
    );
  }

  // Renderização do dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard do Diretor</h1>
              <p className="text-gray-500">Bem-vindo, {user?.firstName} {user?.lastName}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Licenças</p>
                <p className="text-2xl font-bold text-gray-900">{(schoolStats as any)?.totalLicenses || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <School className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Turmas Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{(schoolStats as any)?.totalClasses || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Professores</p>
                <p className="text-2xl font-bold text-gray-900">{(schoolStats as any)?.totalTeachers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Estudantes</p>
                <p className="text-2xl font-bold text-gray-900">{(schoolStats as any)?.totalStudents || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", label: "Visão Geral", icon: ClipboardList },
                { id: "classes", label: "Turmas", icon: School },
                { id: "approvals", label: "Aprovações", icon: UserCheck },
                { id: "invitations", label: "Convites", icon: Users },
                { id: "reports", label: "Relatórios", icon: FileText },
                { id: "settings", label: "Configurações", icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Resumo da Escola</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Uso de Tokens IA</h3>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Usado este mês</span>
                        <span>{(schoolStats as any)?.monthlyTokenUsage || 0} / {(schoolStats as any)?.tokenLimit || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(((schoolStats as any)?.monthlyTokenUsage || 0) / ((schoolStats as any)?.tokenLimit || 1)) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Aprovações Pendentes</h3>
                    <p className="text-2xl font-bold text-orange-600 mt-2">
                      {(schoolStats as any)?.pendingApprovals || 0}
                    </p>
                    <p className="text-sm text-gray-500">Aguardando sua aprovação</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "classes" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Turmas da Escola</h2>
                {classesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(schoolClasses) && schoolClasses.map((cls: any) => (
                      <div key={cls.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{cls.className}</h3>
                            <p className="text-sm text-gray-500">
                              {cls.currentStudents}/{cls.maxStudents} alunos • 
                              {cls.usedLicenses}/{cls.allocatedLicenses} licenças
                            </p>
                            <p className="text-sm text-gray-500">Coordenador: {cls.coordinatorName}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            cls.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {cls.isActive ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "approvals" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Aprovações Pendentes</h2>
                {approvalsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(pendingApprovals) && pendingApprovals.map((approval: any) => (
                      <div key={approval.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{approval.userName}</h3>
                            <p className="text-sm text-gray-500">{approval.userEmail}</p>
                            <p className="text-sm text-gray-500">
                              Função solicitada: {approval.requestedRole}
                              {approval.className && ` • Turma: ${approval.className}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              Solicitado em: {new Date(approval.requestedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Aprovar
                            </button>
                            <button
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Rejeitar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "invitations" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Convites Enviados</h2>
                {invitationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(schoolInvitations) && schoolInvitations.map((invitation: any) => (
                      <div key={invitation.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{invitation.email}</h3>
                            <p className="text-sm text-gray-500">
                              Função: {invitation.role}
                              {invitation.className && ` • Turma: ${invitation.className}`}
                            </p>
                            <p className="text-xs text-gray-400">
                              Enviado em: {new Date(invitation.sentAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invitation.status === 'pending' ? 'Pendente' :
                             invitation.status === 'accepted' ? 'Aceito' : 'Rejeitado'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "reports" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Relatórios Gerados</h2>
                {reportsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(schoolReports) && schoolReports.map((report: any) => (
                      <div key={report.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{report.title}</h3>
                            <p className="text-sm text-gray-500">{report.description}</p>
                            <p className="text-xs text-gray-400">
                              Gerado em: {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            report.reportType === 'usage' ? 'bg-blue-100 text-blue-800' :
                            report.reportType === 'pedagogical' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {report.reportType === 'usage' ? 'Uso' :
                             report.reportType === 'pedagogical' ? 'Pedagógico' : 'Conformidade'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Configurações da Escola</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600">
                    Configurações de limites de IA, filtros de conteúdo e notificações para pais.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Em desenvolvimento...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}