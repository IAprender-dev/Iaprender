import { Switch, Route, useRoute, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { StudyPlanProvider } from "@/lib/StudyPlanContext";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

// Pages
import AIverseLanding from "@/pages/AIverseLanding";
import Auth from "@/pages/Auth";
import CognitoAuth from "@/pages/CognitoAuth";
import FirstAccess from "@/pages/FirstAccess";
import Courses from "@/pages/Courses";
import CourseDetails from "@/pages/CourseDetails";
import CentralIA from "@/pages/CentralIA";
import ChatGPTPage from "@/pages/ai/ChatGPTPage";
import ClaudePage from "@/pages/ai/ClaudePage";
import PerplexityPage from "@/pages/ai/PerplexityPage";
import ImageGenPage from "@/pages/ai/ImageGenPage";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherProfile from "@/pages/teacher/TeacherProfile";
import TeacherCourses from "@/pages/teacher/TeacherCourses";
import TeacherPlanning from "@/pages/teacher/TeacherPlanning";
import TeacherNotificationCenter from "@/pages/teacher/NotificationCenter";
import AdminMasterDashboard from "@/pages/admin/AdminMasterDashboard";
import AdvancedAdminDashboard from "@/pages/admin/AdvancedAdminDashboard";
import AIManagementDashboard from "@/pages/admin/AIManagementDashboard";
import AWSCostManagement from "@/pages/admin/AWSCostManagement";
import LiteLLMManagement from "@/pages/admin/LiteLLMManagement";
import ContractManagement from "@/pages/admin/ContractManagement";
import CompanyContractManagement from "@/pages/admin/CompanyContractManagement";

import UserManagement from "@/pages/admin/UserManagement";
import ExecutiveDashboard from "@/pages/admin/ExecutiveDashboard";
import AdvancedToolsDashboard from "@/pages/admin/AdvancedToolsDashboard";
import SecurityComplianceDashboard from "@/pages/admin/SecurityComplianceDashboard";


import CognitoUserManagement from "@/pages/admin/CognitoUserManagement";
import MunicipalManagerDashboard from "@/pages/municipal/MunicipalManagerDashboard";
import GestorDashboard from "@/pages/municipal/GestorDashboard";
import MunicipalDashboardNew from "@/pages/municipal/MunicipalDashboardNew";
import MunicipalDataManagement from "@/pages/municipal/MunicipalDataManagement";
import SchoolManagement from "@/pages/municipal/SchoolManagement";
import SchoolManagementNew from "@/pages/municipal/SchoolManagementNew";
import PerformanceDashboard from "@/pages/performance/PerformanceDashboard";
import MunicipalContractManagement from "@/pages/municipal/ContractManagement";
import SchoolDirectorDashboard from "@/pages/school/SchoolDirectorDashboard";

import NoticiasPodcasts from "@/pages/teacher/NoticiasPodcasts";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentCourses from "@/pages/student/StudentCourses";
import StudentNotificationCenter from "@/pages/student/NotificationCenter";


import StudentProfile from "@/pages/student/StudentProfile";
import StudyPlanning from "@/pages/student/StudyPlanningSimple";
import StudyPlanGenerator from "@/pages/student/StudyPlanGenerator";
import WikipediaExplorer from "@/pages/student/WikipediaExplorer";
import Translator from "@/pages/student/Translator";
import AITutorChat from "@/pages/student/AITutorChat";
import VoiceTutorTeacher from "@/pages/student/VoiceTutorTeacher";
import StudentQuiz from "@/pages/student/StudentQuiz";
import StudentMindMap from "@/pages/student/StudentMindMap";
import NotFound from "@/pages/not-found";

// AWS Cognito Dashboards
import AdminMaster from "@/pages/AdminMaster";
import GestorDashboardNew from "@/pages/GestorDashboard";
import SchoolDashboard from "@/pages/SchoolDashboard";
import TeacherDashboardNew from "@/pages/TeacherDashboard";
import StudentDashboardNew from "@/pages/StudentDashboard";

// Ferramentas IA
import ImagemEducacional from "@/pages/teacher/ferramentas/ImagemEducacional";
import GeradorAtividades from "@/pages/teacher/ferramentas/GeradorAtividades";
import MateriaisDidaticos from "@/pages/teacher/ferramentas/MateriaisDidaticos";
import ResumosBNCC from "@/pages/teacher/ferramentas/ResumosBNCC";

import PlanejamentoAula from "@/pages/teacher/ferramentas/PlanejamentoAula";
import ModelosPlanejamento from "@/pages/teacher/ferramentas/ModelosPlanejamento";
import AnaliseDocumentos from "@/pages/teacher/AnaliseDocumentos";
import LogoShowcase from "@/pages/LogoShowcase";
import EssaysDashboard from "@/pages/teacher/EssaysDashboard";
import CalculatorDashboard from "@/pages/teacher/CalculatorDashboard";

import AnalyticsDashboard from "@/pages/teacher/AnalyticsDashboard";
import TokenDashboard from "@/pages/TokenDashboard";
import OptimizationsPage from "@/pages/OptimizationsPage";

// Protected route component
const ProtectedRoute = ({ component: Component, roles = [], ...rest }: { 
  component: React.ComponentType, 
  roles?: string[],
  path: string 
}) => {
  const { user, isLoading } = useAuth();
  const [isMatch] = useRoute(rest.path);

  if (isLoading) {
    return isMatch ? <div className="flex items-center justify-center min-h-screen">Carregando...</div> : null;
  }

  if (!user) {
    return isMatch ? <Auth /> : null;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return isMatch ? <NotFound /> : null;
  }

  return <Component />;
};

function Router() {
  
  return (
    <Switch>
      {/* Public routes - Always serve landing page first */}
      <Route path="/" component={AIverseLanding} />
      <Route path="/auth" component={Auth} />
      <Route path="/cognito-auth" component={CognitoAuth} />
      <Route path="/first-access" component={FirstAccess} />
      <Route path="/cursos" component={Courses} />
      <Route path="/curso/:id" component={CourseDetails} />
      
      {/* Central de IA routes */}
      <Route path="/central-ia" component={CentralIA} />
      <Route path="/central-ia/chatgpt" component={ChatGPTPage} />
      <Route path="/central-ia/claude" component={ClaudePage} />
      <Route path="/central-ia/perplexity" component={PerplexityPage} />
      <Route path="/central-ia/image-gen" component={ImageGenPage} />
      
      {/* Teacher routes */}
      <Route path="/professor" component={TeacherDashboard} />
      <Route path="/teacher/profile" component={TeacherProfile} />
      <Route path="/professor/cursos" component={TeacherCourses} />


      <Route path="/professor/redacoes" component={EssaysDashboard} />
      <Route path="/professor/calculadora" component={CalculatorDashboard} />
      <Route path="/professor/notificacoes" component={TeacherNotificationCenter} />
      <Route path="/professor/analises" component={AnalyticsDashboard} />
      <Route path="/professor/noticias-podcasts" component={NoticiasPodcasts} />
      
      {/* Teacher AI Tools routes */}
      <Route path="/professor/ferramentas/imagem-educacional" component={ImagemEducacional} />
      <Route path="/professor/ferramentas/gerador-atividades" component={GeradorAtividades} />
      <Route path="/professor/ferramentas/materiais-didaticos" component={MateriaisDidaticos} />
      <Route path="/professor/ferramentas/resumos-bncc" component={ResumosBNCC} />

      <Route path="/professor/ferramentas/planejamento-aula" component={PlanejamentoAula} />
      <Route path="/professor/ferramentas/modelos-planejamento" component={ModelosPlanejamento} />
      <Route path="/professor/ferramentas/analisar-documentos" component={AnaliseDocumentos} />
      
      {/* Logo Showcase */}
      <Route path="/logo-showcase" component={LogoShowcase} />
      
      {/* Token Dashboard */}
      <Route path="/tokens" component={TokenDashboard} />
      
      {/* Optimizations Dashboard */}
      <Route path="/otimizacoes" component={OptimizationsPage} />
      
      {/* AWS Cognito Dashboards */}
      <Route path="/admin/master" component={AdminMaster} />
      <Route path="/gestor/dashboard" component={GestorDashboardNew} />
      <Route path="/school/dashboard" component={SchoolDashboard} />
      <Route path="/teacher/dashboard" component={TeacherDashboardNew} />
      <Route path="/student/dashboard" component={StudentDashboardNew} />

      {/* Admin Master Dashboard */}
      <Route path="/admin/master-old" component={AdminMasterDashboard} />
      <Route path="/admin/advanced" component={AdvancedAdminDashboard} />
      <Route path="/admin/executive" component={ExecutiveDashboard} />
      <Route path="/admin/tools" component={AdvancedToolsDashboard} />
      <Route path="/admin/security" component={SecurityComplianceDashboard} />

      <Route path="/admin/ai-management" component={AIManagementDashboard} />
      <Route path="/admin/ai/cost-management" component={AWSCostManagement} />
      <Route path="/admin/ai/litellm-management" component={LiteLLMManagement} />
      <Route path="/admin/contracts" component={ContractManagement} />
      <Route path="/admin/companies-contracts" component={CompanyContractManagement} />

      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/user-management" component={UserManagement} />

      <Route path="/admin/cognito-users" component={CognitoUserManagement} />
      
      {/* Municipal Manager Dashboard */}
      <Route path="/municipal/dashboard" component={MunicipalDashboardNew} />
      <Route path="/gestor/dashboard" component={GestorDashboard} />
      <Route path="/municipal/data-management" component={MunicipalDataManagement} />
      <Route path="/municipal/schools/new" component={SchoolManagementNew} />
      <Route path="/municipal/contracts" component={MunicipalContractManagement} />
      <Route path="/performance" component={PerformanceDashboard} />
      <Route path="/municipal/schools" component={SchoolManagement} />
      
      {/* School Director Dashboard */}
      <Route path="/school/dashboard" component={SchoolDirectorDashboard} />
      
      {/* Student routes */}
      <Route path="/student" component={StudentDashboard} />
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/notificacoes" component={StudentNotificationCenter} />
      <Route path="/student/courses" component={StudentCourses} />

      <Route path="/student/profile" component={StudentProfile} />
      <Route path="/student/wikipedia" component={WikipediaExplorer} />
      <Route path="/student/translator" component={Translator} />
      <Route path="/student/quiz" component={StudentQuiz} />
      <Route path="/student/mindmap" component={StudentMindMap} />
      <Route path="/aluno/dashboard" component={StudentDashboard} />
      <Route path="/aluno/cursos" component={StudentCourses} />

      <Route path="/aluno/planejamento" component={StudyPlanning} />
      <Route path="/aluno/gerador-plano" component={StudyPlanGenerator} />
      <Route path="/aluno/tutor-ia" component={AITutorChat} />
      <Route path="/aluno/tutor-voz" component={VoiceTutorTeacher} />
      

      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StudyPlanProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </StudyPlanProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
