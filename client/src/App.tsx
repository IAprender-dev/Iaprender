import { Switch, Route, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { StudyPlanProvider } from "@/lib/StudyPlanContext";
import { ThemeProvider } from "next-themes";

// Pages
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Courses from "@/pages/Courses";
import CourseDetails from "@/pages/CourseDetails";
import CentralIA from "@/pages/CentralIA";
import ChatGPTPage from "@/pages/ai/ChatGPTPage";
import ClaudePage from "@/pages/ai/ClaudePage";
import PerplexityPage from "@/pages/ai/PerplexityPage";
import ImageGenPage from "@/pages/ai/ImageGenPage";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherCourses from "@/pages/teacher/TeacherCourses";
import TeacherPlanning from "@/pages/teacher/TeacherPlanning";
import TeacherTools from "@/pages/teacher/TeacherTools";
import NoticiasPodcasts from "@/pages/teacher/NoticiasPodcasts";
import StudentDashboard from "@/pages/student/StudentDashboard";
import StudentCourses from "@/pages/student/StudentCourses";
import StudentActivities from "@/pages/student/StudentActivities";
import StudyPlanning from "@/pages/student/StudyPlanning";
import WikipediaExplorer from "@/pages/student/WikipediaExplorer";
import NotFound from "@/pages/not-found";

// Ferramentas IA
import ImagemEducacional from "@/pages/teacher/ferramentas/ImagemEducacional";
import GeradorAtividades from "@/pages/teacher/ferramentas/GeradorAtividades";
import MateriaisDidaticos from "@/pages/teacher/ferramentas/MateriaisDidaticos";
import ResumosBNCC from "@/pages/teacher/ferramentas/ResumosBNCC";

import PlanejamentoAula from "@/pages/teacher/ferramentas/PlanejamentoAula";
import ModelosPlanejamento from "@/pages/teacher/ferramentas/ModelosPlanejamento";
import AnaliseDocumentos from "@/pages/teacher/AnaliseDocumentos";

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
      {/* Public routes */}
      <Route path="/" component={Home} />
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
      <Route path="/professor/dashboard" component={TeacherDashboard} />
      <Route path="/professor/cursos" component={TeacherCourses} />
      <Route path="/professor/planejamento" component={TeacherPlanning} />
      <Route path="/professor/ferramentas" component={TeacherTools} />
      <Route path="/professor/noticias-podcasts" component={NoticiasPodcasts} />
      
      {/* Teacher AI Tools routes */}
      <Route path="/professor/ferramentas/imagem-educacional" component={ImagemEducacional} />
      <Route path="/professor/ferramentas/gerador-atividades" component={GeradorAtividades} />
      <Route path="/professor/ferramentas/materiais-didaticos" component={MateriaisDidaticos} />
      <Route path="/professor/ferramentas/resumos-bncc" component={ResumosBNCC} />

      <Route path="/professor/ferramentas/planejamento-aula" component={PlanejamentoAula} />
      <Route path="/professor/ferramentas/modelos-planejamento" component={ModelosPlanejamento} />
      <Route path="/professor/ferramentas/analise-documentos" component={AnaliseDocumentos} />
      
      {/* Student routes */}
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/courses" component={StudentCourses} />
      <Route path="/student/activities" component={StudentActivities} />
      <Route path="/student/wikipedia" component={WikipediaExplorer} />
      <Route path="/aluno/dashboard" component={StudentDashboard} />
      <Route path="/aluno/cursos" component={StudentCourses} />
      <Route path="/aluno/atividades" component={StudentActivities} />
      <Route path="/aluno/planejamento" component={StudyPlanning} />
      
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
