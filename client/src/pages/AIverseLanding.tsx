import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
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
  Clock
} from "lucide-react";

import aiverseLogo from "@assets/Design sem nome (5)_1749594709695.png";

export default function AIverseLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src={aiverseLogo} alt="AIverse" className="w-10 h-10" />
              <div>
                <span className="text-2xl font-bold text-gray-900">AIverse</span>
                <p className="text-xs text-gray-500">Seu Universo de Inteligência Artificial</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Recursos</a>
              <a href="#ai-tools" className="text-gray-600 hover:text-blue-600 transition-colors">IA Tools</a>
              <a href="#impact" className="text-gray-600 hover:text-blue-600 transition-colors">Impacto</a>
              <Link href="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Acessar Plataforma
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200">
              🚀 Transformando a Educação com IA
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AIverse
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Seu Universo de Inteligência Artificial
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              A plataforma completa que conecta diretores, professores e alunos através de mais de 25 modelos de IA avançados. 
              Crie, ensine e aprenda de forma revolucionária.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-gray-300">
                Ver Demonstração
                <Video className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* AI in Education Stats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              A IA está Transformando a Educação Global
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Dados que mostram a importância da inclusão de IA na educação moderna
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">87%</div>
              <p className="text-gray-600">das escolas globais planejam adotar IA até 2025</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">40%</div>
              <p className="text-gray-600">melhoria no engajamento dos alunos com IA</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">60%</div>
              <p className="text-gray-600">redução no tempo de criação de materiais</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">25x</div>
              <p className="text-gray-600">mais personalização no aprendizado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Para Todos na Educação
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Soluções específicas para cada perfil educacional
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Directors */}
            <Card className="border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Diretores</h3>
                <p className="text-gray-600 mb-6">
                  Gerencie a transformação digital da sua escola com analytics, relatórios e ferramentas de gestão educacional.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Dashboard executivo</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Relatórios de desempenho</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Gestão de professores</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Analytics de uso</li>
                </ul>
              </CardContent>
            </Card>

            {/* Teachers */}
            <Card className="border-2 border-blue-200 bg-blue-50/30 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Professores</h3>
                <p className="text-gray-600 mb-6">
                  Crie materiais didáticos, atividades e planejamentos de aula usando IA de última geração.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Geração de atividades</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Materiais didáticos</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Planejamento BNCC</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Imagens educacionais</li>
                </ul>
              </CardContent>
            </Card>

            {/* Students */}
            <Card className="border-2 border-gray-100 hover:border-purple-200 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Alunos</h3>
                <p className="text-gray-600 mb-6">
                  Aprenda com tutores de IA personalizados, faça exercícios adaptativos e explore o conhecimento.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Tutor IA Pro Versa</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Exercícios adaptativos</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Tradutor integrado</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Wikipedia Explorer</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Tools Showcase */}
      <section id="ai-tools" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Mais de 25 Modelos de IA Integrados
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Acesse os modelos mais avançados do mundo em uma única plataforma educacional
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Text Generation */}
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="font-semibold text-gray-900">Geração de Texto</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• GPT-4o, GPT-4o mini</div>
                  <div>• Gemini 1.5 Pro, 2.0 Flash</div>
                  <div>• Claude 3.5 Sonnet v2</div>
                  <div>• Mistral Models</div>
                  <div>• Command R Plus</div>
                  <div>• Llama 3 Meta AI</div>
                </div>
              </CardContent>
            </Card>

            {/* Image Generation */}
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Image className="h-6 w-6 text-purple-600 mr-3" />
                  <h3 className="font-semibold text-gray-900">Geração de Imagem</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• Stable Diffusion 3.5</div>
                  <div>• Flux 1.1 Pro Ultra</div>
                  <div>• Ideogram 2-Turbo</div>
                  <div>• Google Imagen 3</div>
                  <div>• Recraft AI</div>
                  <div>• DALL-E 3</div>
                </div>
              </CardContent>
            </Card>

            {/* Video Generation */}
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Video className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="font-semibold text-gray-900">Geração de Vídeo</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• Runway Gen-3 Alpha</div>
                  <div>• Luma AI</div>
                  <div>• Vídeos do zero</div>
                  <div>• A partir de imagens</div>
                  <div>• Qualidade profissional</div>
                  <div>• Múltiplos formatos</div>
                </div>
              </CardContent>
            </Card>

            {/* Voice & Audio */}
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Mic className="h-6 w-6 text-orange-600 mr-3" />
                  <h3 className="font-semibold text-gray-900">Voz & Áudio</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• ElevenLabs</div>
                  <div>• OpenAI Whisper</div>
                  <div>• Deepgram AI</div>
                  <div>• Assembly AI</div>
                  <div>• Rev AI</div>
                  <div>• Múltiplos idiomas</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why AI in Education */}
      <section id="impact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Por que IA na Educação é Essencial?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                A inteligência artificial não é o futuro da educação - é o presente. 
                Escolas que não se adaptarem ficarão para trás na formação dos profissionais de amanhã.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <Brain className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Personalização em Escala</h3>
                    <p className="text-gray-600">Cada aluno aprende de forma única. A IA permite adaptar o ensino ao ritmo e estilo de cada estudante.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Eficiência para Professores</h3>
                    <p className="text-gray-600">Automatize tarefas repetitivas e foque no que realmente importa: ensinar e inspirar.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Preparo para o Futuro</h3>
                    <p className="text-gray-600">Estudantes que convivem com IA desde cedo estão melhor preparados para o mercado de trabalho.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Sparkles className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Transformação Comprovada
                </h3>
                <p className="text-gray-600 mb-6">
                  Escolas que implementaram IA educacional reportam melhorias significativas em engajamento, performance e satisfação.
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">92%</div>
                    <div className="text-sm text-gray-600">Satisfação dos professores</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">78%</div>
                    <div className="text-sm text-gray-600">Melhoria nas notas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para Revolucionar sua Educação?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Junte-se às escolas que já estão transformando o futuro da educação com AIverse.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold">
                Começar Gratuitamente
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg">
              Falar com Especialista
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src={aiverseLogo} alt="AIverse" className="w-8 h-8" />
                <span className="text-xl font-bold">AIverse</span>
              </div>
              <p className="text-gray-400 mb-4">
                Seu Universo de Inteligência Artificial para transformar a educação.
              </p>
              <p className="text-sm text-gray-500">
                © 2024 AIverse. Todos os direitos reservados.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Para Professores</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Para Alunos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Para Diretores</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}