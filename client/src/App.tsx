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

import NoticiasPodcasts from "@/pages/teacher/NoticiasPodcasts";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentCourses from "@/pages/student/StudentCourses";
import SecretaryDashboard from "@/pages/secretary/SecretaryDashboard";
import UserManagement from "@/pages/secretary/UserManagement";

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
import NotificationsDashboard from "@/pages/teacher/NotificationsDashboard";
import AnalyticsDashboard from "@/pages/teacher/AnalyticsDashboard";
import TokenDashboard from "@/pages/TokenDashboard";

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
  const [location, setLocation] = useLocation();
  
  // Ensure platform always starts with landing page for unauthenticated users
  useEffect(() => {
    const isProtectedRoute = location.startsWith("/professor") || 
                            location.startsWith("/student") || 
                            location.startsWith("/secretary") ||
                            location.startsWith("/teacher") ||
                            location.startsWith("/aluno");
    
    if (isProtectedRoute) {
      // Check authentication status for protected routes
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/auth/me');
          if (!response.ok) {
            // Not authenticated, redirect to landing page
            setLocation("/");
          }
        } catch (error) {
          // Error checking auth, redirect to landing page  
          setLocation("/");
        }
      };
      checkAuth();
    }
  }, [location, setLocation]);
  
  return (
    <Switch>
      {/* Public routes - Always serve landing page first */}
      <Route path="/" component={AIverseLanding} />
      <Route path="/auth" component={Auth} />
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
      <Route path="/professor/notificacoes" component={NotificationsDashboard} />
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
      
      {/* Student routes */}
      <Route path="/student" component={StudentDashboard} />
      <Route path="/student/dashboard" component={StudentDashboard} />
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
      
      {/* Secretary routes */}
      <ProtectedRoute path="/secretary" component={SecretaryDashboard} roles={['admin']} />
      <ProtectedRoute path="/secretary/users" component={UserManagement} roles={['admin']} />
      
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
