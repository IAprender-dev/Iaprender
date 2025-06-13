import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  ChevronRight,
  Globe,
  TrendingUp,
  Zap,
  Star,
  MessageSquare,
  Image,
  Video,
  Mic,
  FileText,
  ArrowRight,
  CheckCircle2,
  Target,
  Clock,
  BarChart,
  Bot,
  Play,
  Award,
  Shield,
  Lightbulb,
  Rocket,
  Calendar,
  Lock,
  Building2,
  DollarSign,
  UserCheck,
  HeartHandshake,
  Laptop,
  FileCheck,
  Briefcase,
  School,
  ArrowUpRight,
  CircleCheck,
  X,
  Menu,
  Quote,
  Cpu,
  Gauge,
  Heart,
  Headphones,
  Gift,
  Timer,
  TrendingDown,
  Infinity,
  Layers,
  Network,
  Palette,
  Microscope,
  Compass,
  Puzzle,
  Landmark,
  Languages
} from "lucide-react";
import { useState, useEffect } from "react";

export default function AIverseLanding() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Brain, label: "Inteligência Adaptativa", color: "from-indigo-500 to-purple-600" },
    { icon: Users, label: "Inclusão Total", color: "from-purple-500 to-pink-600" },
    { icon: Globe, label: "Alcance Global", color: "from-green-500 to-emerald-600" },
    { icon: Infinity, label: "Possibilidades Infinitas", color: "from-orange-500 to-red-600" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg' : 'bg-white/80 backdrop-blur-lg'
      } border-b border-gray-100`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AIverse
              </span>
            </div>

            <div className="hidden lg:flex items-center space-x-8">
              <a href="#plataforma" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">Plataforma</a>
              <a href="#inteligencias" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">Inteligências</a>
              <a href="#educacao" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">Para Educação</a>
              <a href="#impacto" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">Impacto</a>
              <a href="#recursos" className="text-gray-700 hover:text-indigo-600 transition-colors font-medium">Recursos</a>
            </div>

            <div className="hidden lg:flex items-center space-x-4">
              <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25">
                Acessar AIverse
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <a href="#plataforma" className="block py-2 text-gray-700 hover:text-indigo-600">Plataforma</a>
              <a href="#inteligencias" className="block py-2 text-gray-700 hover:text-indigo-600">Inteligências</a>
              <a href="#educacao" className="block py-2 text-gray-700 hover:text-indigo-600">Para Educação</a>
              <a href="#impacto" className="block py-2 text-gray-700 hover:text-indigo-600">Impacto</a>
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
                Acessar AIverse
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-gray-50 via-white to-indigo-50/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gray-900">A Plataforma Mundial de</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Inteligência Artificial
              </span>
              <br />
              <span className="text-gray-900">para Educação</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Democratizando o acesso às <span className="font-semibold text-gray-900">mais avançadas IAs do planeta</span>, 
              capacitando professores e alunos para o futuro que já chegou.
            </p>

            {/* Dynamic Feature Display */}
            <div className="mb-12 h-24 flex items-center justify-center">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    activeFeature === index ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-2xl font-semibold text-gray-800">{feature.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-10 py-6 text-lg shadow-xl shadow-indigo-500/25 group">
                Explorar o AIverse
                <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-gray-300 hover:border-indigo-300 px-10 py-6 text-lg group">
                <Play className="mr-2 h-5 w-5 text-gray-600 group-hover:text-indigo-600" />
                Ver em Ação
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section id="plataforma" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
              Plataforma Completa
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Um Universo de Possibilidades em IA
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Reunimos as melhores inteligências artificiais do mundo em uma única plataforma, 
              especialmente otimizada para transformar a educação.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden border-2 hover:border-indigo-200 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <CardContent className="p-8 relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Layers className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Interface Unificada</h3>
                <p className="text-gray-600 mb-4">
                  Acesse mais de 30 modelos de IA através de uma interface intuitiva e consistente, 
                  sem precisar aprender múltiplas plataformas.
                </p>
                <div className="flex items-center text-indigo-600 font-medium">
                  <span>Simplicidade no poder</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <CardContent className="p-8 relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                  <Network className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Integração Total</h3>
                <p className="text-gray-600 mb-4">
                  Todas as IAs conversam entre si, permitindo fluxos de trabalho complexos 
                  que combinam o melhor de cada tecnologia.
                </p>
                <div className="flex items-center text-purple-600 font-medium">
                  <span>Sinergia perfeita</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover:border-green-200 transition-all duration-300 hover:shadow-xl group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              <CardContent className="p-8 relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Languages className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">100% em Português</h3>
                <p className="text-gray-600 mb-4">
                  Interface, suporte e documentação completamente em português, 
                  eliminando barreiras linguísticas.
                </p>
                <div className="flex items-center text-green-600 font-medium">
                  <span>Inclusão real</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Ecosystem */}
      <section id="inteligencias" className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
              Ecossistema Completo
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              As Melhores IAs do Mundo, Juntas
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Um arsenal completo de inteligências artificiais líderes mundiais, 
              todas otimizadas para educação
            </p>
          </div>

          {/* AI Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Text & Language */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-indigo-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Linguagem & Texto</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">GPT-4o</p>
                    <p className="text-xs text-gray-500">OpenAI</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Claude 3.5</p>
                    <p className="text-xs text-gray-500">Anthropic</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Gemini 2.0</p>
                    <p className="text-xs text-gray-500">Google</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Llama 3</p>
                    <p className="text-xs text-gray-500">Meta</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                + 8 outros modelos especializados em educação
              </p>
            </div>

            {/* Image Generation */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-purple-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                  <Image className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Criação Visual</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Palette className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">DALL-E 3</p>
                    <p className="text-xs text-gray-500">OpenAI</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Microscope className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Stable Diffusion</p>
                    <p className="text-xs text-gray-500">Stability AI</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <Compass className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Flux 1.0</p>
                    <p className="text-xs text-gray-500">Black Forest</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Ideogram 2</p>
                    <p className="text-xs text-gray-500">Ideogram AI</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                + 6 outros geradores especializados
              </p>
            </div>

            {/* Video & Motion */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-red-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Vídeo & Animação</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Play className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Runway Gen-3 Alpha</p>
                      <p className="text-sm text-gray-500">Criação de vídeos educacionais</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Luma AI</p>
                      <p className="text-sm text-gray-500">Animações 3D interativas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Audio & Voice */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-green-100">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Áudio & Voz</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">ElevenLabs</p>
                      <p className="text-sm text-gray-500">Narração natural em português</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Deepgram</p>
                      <p className="text-sm text-gray-500">Transcrição automática precisa</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Power */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white text-center">
            <Puzzle className="h-12 w-12 mx-auto mb-4 text-indigo-200" />
            <h3 className="text-2xl font-bold mb-4">O Poder da Integração</h3>
            <p className="text-lg text-indigo-100 max-w-3xl mx-auto">
              Não são apenas ferramentas isoladas. No AIverse, todas as IAs trabalham em conjunto, 
              criando possibilidades infinitas para professores e alunos explorarem o conhecimento.
            </p>
          </div>
        </div>
      </section>

      {/* Education Focus */}
      <section id="educacao" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700">
              Foco Educacional
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ferramentas Projetadas para Transformar a Educação
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Cada recurso foi pensado para empoderar educadores e inspirar estudantes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* For Educators */}
            <div>
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Para Educadores</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-4 mt-1">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Criador de Conteúdo Inteligente</h4>
                    <p className="text-gray-600">
                      Gere planos de aula, atividades e avaliações personalizadas em minutos, 
                      alinhadas aos objetivos pedagógicos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-4 mt-1">
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Assistente Pedagógico 24/7</h4>
                    <p className="text-gray-600">
                      IA treinada em metodologias educacionais para apoiar no planejamento 
                      e execução de estratégias de ensino.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4 mt-1">
                    <BarChart className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Analytics de Aprendizagem</h4>
                    <p className="text-gray-600">
                      Acompanhe o progresso individual e coletivo com insights profundos 
                      sobre o desenvolvimento dos alunos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Students */}
            <div>
              <div className="flex items-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Para Estudantes</h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mr-4 mt-1">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Tutor Personalizado</h4>
                    <p className="text-gray-600">
                      Assistente de estudos que se adapta ao ritmo e estilo de aprendizagem 
                      de cada aluno, disponível 24/7.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center mr-4 mt-1">
                    <MessageSquare className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Aprendizagem Interativa</h4>
                    <p className="text-gray-600">
                      Converse naturalmente com a IA para explorar conceitos, 
                      tirar dúvidas e aprofundar conhecimentos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center mr-4 mt-1">
                    <Rocket className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Preparação para o Futuro</h4>
                    <p className="text-gray-600">
                      Desenvolva habilidades essenciais do século XXI trabalhando 
                      diretamente com as tecnologias que moldarão o amanhã.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inclusive Education */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-12">
            <div className="max-w-4xl mx-auto text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Educação Verdadeiramente Inclusiva
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                O AIverse foi construído com acessibilidade em mente. Interface adaptável, 
                suporte multilíngue, recursos para diferentes necessidades de aprendizagem. 
                Porque acreditamos que todos merecem acesso às melhores ferramentas educacionais.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-3">
                    <Languages className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Multilíngue</h4>
                  <p className="text-sm text-gray-600 mt-1">Suporte completo em português e outros idiomas</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Acessível</h4>
                  <p className="text-sm text-gray-600 mt-1">Interface adaptável para todas as necessidades</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-3">
                    <HeartHandshake className="h-8 w-8 text-pink-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Personalizada</h4>
                  <p className="text-sm text-gray-600 mt-1">Adaptação ao ritmo individual de cada usuário</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Impact */}
      <section id="impacto" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200">
              Impacto Global
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Transformando a Educação Mundial
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              O AIverse está na vanguarda da revolução educacional, democratizando o acesso 
              às tecnologias mais avançadas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Globe className="h-10 w-10 text-cyan-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Alcance Global</h3>
                <p className="text-gray-600 text-sm">
                  Preparando estudantes para um mundo conectado e digitalizado
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-green-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-10 w-10 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Resultados Comprovados</h3>
                <p className="text-gray-600 text-sm">
                  Melhoria significativa no engajamento e desempenho acadêmico
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-yellow-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Award className="h-10 w-10 text-yellow-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Excelência Reconhecida</h3>
                <p className="text-gray-600 text-sm">
                  Desenvolvido com as melhores práticas pedagógicas mundiais
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Shield className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Segurança Total</h3>
                <p className="text-gray-600 text-sm">
                  Proteção de dados e privacidade com padrões internacionais
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 border border-blue-200 shadow-xl max-w-4xl mx-auto">
            <div className="text-center">
              <Landmark className="h-12 w-12 text-indigo-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Nossa Missão</h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                Democratizar o acesso à inteligência artificial na educação, capacitando cada professor 
                a se tornar um super-educador e cada aluno a alcançar seu máximo potencial. 
                O AIverse não é apenas uma plataforma - é um movimento global pela educação do futuro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="recursos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Recursos e Suporte
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Tudo que você precisa para dominar o AIverse e transformar sua prática educacional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-xl transition-shadow border-2 hover:border-indigo-200">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Documentação Completa</h3>
                <p className="text-gray-600 mb-4">
                  Guias detalhados, tutoriais e melhores práticas para cada ferramenta
                </p>
                <Button variant="outline" className="w-full">
                  Acessar Documentação
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-2 hover:border-purple-200">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Comunidade Ativa</h3>
                <p className="text-gray-600 mb-4">
                  Conecte-se com educadores do mundo todo compartilhando experiências
                </p>
                <Button variant="outline" className="w-full">
                  Entrar na Comunidade
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow border-2 hover:border-green-200">
              <CardContent className="p-8 text-center">
                <Headphones className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Suporte Especializado</h3>
                <p className="text-gray-600 mb-4">
                  Equipe dedicada pronta para ajudar em português, quando você precisar
                </p>
                <Button variant="outline" className="w-full">
                  Falar com Suporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5"></div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-indigo-200">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              Pronto para Transformar sua Educação?
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Junte-se à revolução educacional. O futuro está aqui, e ele fala português.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 px-10 py-6 text-lg font-semibold shadow-xl">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-10 py-6 text-lg font-semibold">
                <MessageSquare className="mr-2 h-5 w-5" />
                Falar com Especialista
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">AIverse</span>
              </div>
              <p className="text-slate-300 mb-4">
                A plataforma mundial de inteligência artificial para educação.
              </p>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Heart className="h-4 w-4 text-red-400" />
                <span>Feito com paixão para educadores</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-slate-100">Plataforma</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrações</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Acessibilidade</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-slate-100">Recursos</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Tutoriais</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Comunidade</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-slate-100">Empresa</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Missão</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-300 text-sm mb-4 md:mb-0">
                © 2024 AIverse. Todos os direitos reservados.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <a href="#" className="text-slate-300 hover:text-white transition-colors">Termos de Uso</a>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">Privacidade</a>
                <a href="#" className="text-slate-300 hover:text-white transition-colors">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}