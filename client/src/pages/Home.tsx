import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, TrendingUp, Star, ArrowRight, Sparkles, Brain, Target, Zap, Lightbulb, Rocket, Shield, ChevronRight, Bot, ImageIcon, MessageSquare, GraduationCap, BookIcon, Award } from "lucide-react";
import { Link } from "wouter";
import iaverseLogo from "@/assets/IAverse.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img src={iaverseLogo} alt="IAverse" className="w-12 h-12 rounded-xl shadow-lg" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl"></div>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IAverse
              </span>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-slate-600 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">
                Recursos
              </a>
              <a href="#about" className="text-slate-600 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">
                Sobre
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">
                Planos
              </a>
              <a href="#contact" className="text-slate-600 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105">
                Contato
              </a>
            </div>
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/auth">
                <Button variant="ghost" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-6 h-11 font-medium">
                  Entrar
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 h-11 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-40 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-full shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Revolucione a Educação com IA
                </span>
              </div>
            </div>
            
            {/* Main Heading */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
                O Futuro da{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                  Educação
                </span>
                <br />é Hoje
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                IAverse conecta educadores e estudantes através de ferramentas de Inteligência Artificial 
                de última geração, criando experiências de aprendizado personalizadas e transformadoras.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <Link href="/auth">
                <Button className="group px-10 py-4 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  Iniciar Jornada Gratuita
                  <Rocket className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" className="px-10 py-4 h-14 text-lg font-semibold border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-all duration-300">
                <BookOpen className="mr-3 h-5 w-5" />
                Explorar Recursos
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-24 max-w-5xl mx-auto">
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">50K+</div>
                <div className="text-slate-600 font-medium">Educadores Ativos</div>
              </div>
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">1M+</div>
                <div className="text-slate-600 font-medium">Atividades Criadas</div>
              </div>
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">99%</div>
                <div className="text-slate-600 font-medium">Satisfação</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6 bg-slate-50/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-8 mb-24">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-full shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ferramentas Poderosas
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              Tecnologia que{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Transforma
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Descubra como nossas ferramentas de IA revolucionam a forma de ensinar 
              e aprender, criando experiências únicas e personalizadas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-500 rounded-2xl hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative pb-6 space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
                  <Bot className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent" />
                </div>
                <CardTitle className="text-2xl font-bold">Geração Inteligente</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-gray-600">
                  Crie atividades educacionais personalizadas instantaneamente com IA de última geração, 
                  adaptadas ao seu currículo e objetivos específicos.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl">
              <CardHeader className="pb-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Análise Avançada</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-gray-600">
                  Analise documentos, PDFs e materiais educacionais automaticamente para extrair 
                  insights valiosos e gerar conteúdo relevante.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl">
              <CardHeader className="pb-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Criação Visual</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-gray-600">
                  Gere imagens educacionais únicas e ilustrações personalizadas para tornar 
                  seus materiais mais envolventes e eficazes.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl">
              <CardHeader className="pb-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Lightbulb className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">IA Conversacional</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-gray-600">
                  Interaja com diferentes modelos de IA como ChatGPT, Claude e Gemini em uma 
                  interface unificada e intuitiva.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl">
              <CardHeader className="pb-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Segurança Total</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-gray-600">
                  Plataforma segura e confiável com controle de acesso avançado e proteção 
                  completa dos dados educacionais.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white rounded-2xl">
              <CardHeader className="pb-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Colaboração</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed text-gray-600">
                  Conecte professores e estudantes em um ambiente colaborativo que potencializa 
                  o aprendizado e o ensino.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Badge variant="outline" className="text-primary border-primary/30 px-4 py-2 rounded-full">
                Nossa Missão
              </Badge>
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900">
                Democratizar o
                <span className="text-primary"> Acesso à IA</span>
                na Educação
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Acreditamos que toda instituição educacional deve ter acesso às melhores 
                ferramentas de Inteligência Artificial. Nossa plataforma foi desenvolvida 
                para ser simples, poderosa e acessível a todos.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl">Interface Intuitiva</h3>
                    <p className="text-gray-600 text-lg">Design clean e minimalista que facilita o uso para todos os níveis de experiência.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl">IA de Vanguarda</h3>
                    <p className="text-gray-600 text-lg">Integração com os melhores modelos de IA do mercado para resultados excepcionais.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl">Suporte Especializado</h3>
                    <p className="text-gray-600 text-lg">Equipe dedicada de especialistas em educação e tecnologia para te apoiar.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-12 shadow-2xl">
              <div className="space-y-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-3">Comece Agora</div>
                  <p className="text-gray-600 text-lg">Transforme sua forma de ensinar</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center text-gray-700">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-4">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-lg">Acesso completo às ferramentas de IA</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-4">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-lg">Biblioteca rica em recursos educacionais</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-4">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-lg">Análises e relatórios detalhados</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-4">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-lg">Suporte técnico especializado</span>
                  </div>
                </div>
                
                <Link href="/auth">
                  <Button className="w-full text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90">
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <p className="text-center text-sm text-gray-500">
                  Sem compromisso • Configuração em minutos
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-4 bg-primary">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-5xl md:text-6xl font-bold text-white">
                Pronto para o Futuro?
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Junte-se à revolução educacional. Milhares de educadores já estão 
                transformando o ensino com o poder da Inteligência Artificial.
              </p>
            </div>
            <Link href="/auth">
              <Button size="lg" variant="secondary" className="px-12 py-4 text-lg font-semibold bg-white text-primary hover:bg-gray-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                Começar Agora - É Gratuito
                <Rocket className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-white/70 text-sm">
              Mais de 50.000 educadores confiam na IAverse
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <img src={iaverseLogo} alt="IAverse" className="w-12 h-12" />
              <span className="text-3xl font-bold">IAverse</span>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Transformando a educação através da Inteligência Artificial. 
              Criando o futuro do aprendizado, hoje.
            </p>
            <div className="pt-8 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                © 2024 IAverse. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}