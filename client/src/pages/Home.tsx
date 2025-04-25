import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Award, BookOpen, CalendarDays, CheckCircle, MessageSquare, User, Users } from "lucide-react";
import { LogoWithText, Logo } from "@/components/ui/logo";

import { BookText, Brain, FileText, Image, PenTool, BarChart4, Lightbulb, Scissors, FileImage, BookCopy, Puzzle, School, ScrollText, Target, FolderKanban } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header/Navbar */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2">
              <LogoWithText textSize="md" />
            </a>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Recursos</a>
            <a href="#courses" className="text-sm font-medium text-muted-foreground hover:text-foreground">Cursos</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">Planos</a>
            <a href="#events" className="text-sm font-medium text-muted-foreground hover:text-foreground">Eventos</a>
            <a href="#newsletter" className="text-sm font-medium text-muted-foreground hover:text-foreground">Newsletter</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link href="/auth?register=true">
              <Button>Começar agora</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                    A primeira plataforma de Inteligência Artificial Educacional para Professores e Alunos
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Ferramentas de IA, cursos sobre inteligência artificial e as últimas novidades do mundo da educação e tecnologia – tudo em um só lugar.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/auth?register=true">
                    <Button size="lg" className="gap-2">
                      Comece agora <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline">
                    Solicitar demonstração para sua escola
                  </Button>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto flex justify-center lg:justify-end">
                <div className="w-full max-w-[500px] aspect-video rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-primary/20 to-primary/10 p-6 flex items-center justify-center">
                  <div className="relative w-full h-full bg-muted/80 rounded backdrop-blur-sm overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Logo size={100} className="text-primary/80 animate-pulse" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60"></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-4 text-center text-sm">
                      <p className="font-medium">Imagine um mundo onde cada aluno recebe atenção personalizada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* iAula One Section */}
        <section id="features" className="py-16 md:py-20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter">
                    iAula One – Hub Educacional de IAs
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground">
                    O iAula One é o coração da plataforma, reunindo modelos avançados de IA customizados para o ambiente educacional.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h3 className="font-medium">Modelos de IA</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> GPT-4.1</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Gemini 2.5 Pro</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Claude 3.7 Sonnet</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Sabiá-3</li>
                    </ul>
                  </div>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <h3 className="font-medium">Treinados para</h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Professores: planos de aula, provas, avaliações</li>
                      <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Alunos: resumos, explicações, exercícios</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">Funcionalidades principais</h3>
                  <ul className="grid gap-2 md:grid-cols-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Pastas para projetos escolares</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Flows educacionais</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Experts IA personalizados</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Análise de documentos</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> iAula Vision</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Análise de planilhas e gráficos</li>
                  </ul>
                </div>
              </div>
              <div className="mx-auto flex justify-center">
                <div className="relative w-full max-w-[500px] aspect-square rounded-lg overflow-hidden shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                  <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                    <div className="bg-background rounded-md shadow-sm p-3 flex flex-col">
                      <h4 className="text-xs font-medium mb-2">Plano de Aula</h4>
                      <div className="flex-1 bg-muted rounded-sm animate-pulse"></div>
                    </div>
                    <div className="bg-background rounded-md shadow-sm p-3 flex flex-col">
                      <h4 className="text-xs font-medium mb-2">Análise de Texto</h4>
                      <div className="flex-1 bg-muted rounded-sm animate-pulse"></div>
                    </div>
                    <div className="bg-background rounded-md shadow-sm p-3 flex flex-col">
                      <h4 className="text-xs font-medium mb-2">Geração de Imagem</h4>
                      <div className="flex-1 bg-muted/60 rounded-sm flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary/20 rounded-full"></div>
                      </div>
                    </div>
                    <div className="bg-background rounded-md shadow-sm p-3 flex flex-col">
                      <h4 className="text-xs font-medium mb-2">Resumo</h4>
                      <div className="flex-1 bg-muted rounded-sm animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="py-16 md:py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">
                  Cursos e Certificações
                </h2>
                <p className="max-w-[600px] text-muted-foreground">
                  Ofereça cursos rápidos e práticos sobre Inteligência Artificial voltados para o ambiente educacional.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full max-w-4xl">
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Como usar IA na educação</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">
                    Conceitos básicos e aplicações práticas para transformar sua abordagem pedagógica.
                  </p>
                  <Button variant="outline" className="w-full mt-auto">Ver curso</Button>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Masterizando o uso de IA para professores</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">
                    Aprofunde seus conhecimentos em IA para criar experiências de aprendizado únicas.
                  </p>
                  <Button variant="outline" className="w-full mt-auto">Ver curso</Button>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">IA para auxiliar nos estudos</h3>
                  <p className="text-sm text-muted-foreground flex-1 mb-4">
                    Técnicas e ferramentas para alunos maximizarem seu potencial de aprendizado com IA.
                  </p>
                  <Button variant="outline" className="w-full mt-auto">Ver curso</Button>
                </div>
              </div>
              <div className="bg-primary/5 rounded-lg p-6 mt-8 max-w-4xl w-full">
                <div className="flex items-center gap-4">
                  <Award className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <h3 className="font-medium">Certificações para Professores</h3>
                    <p className="text-sm text-muted-foreground">
                      Obtenha certificados reconhecidos ao dominar o uso das ferramentas de IA em sala de aula.
                    </p>
                  </div>
                  <Button className="ml-auto">Saiba mais</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ferramentas Pedagógicas - Grid Section */}
        <section id="tools" className="py-16 md:py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">
                  Ferramentas Inteligentes para a Sala de Aula
                </h2>
                <p className="max-w-[800px] text-muted-foreground">
                  O coração da iAula está em suas ferramentas de IA. Potencialize o ensino com recursos que economizam tempo e ampliam possibilidades pedagógicas.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 w-full max-w-6xl">
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <PenTool className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Correção de Redação</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Avaliação automática de textos com feedback detalhado baseado em critérios pedagógicos.
                  </p>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Scissors className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Revisor de Tarefas</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Correção automática de atividades escritas ou digitalizadas com feedback personalizado.
                  </p>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Gerador de Ideias</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Sugestões criativas para aulas, atividades e projetos alinhadas ao seu contexto pedagógico.
                  </p>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <FileImage className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Criador de Imagens</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Gere ilustrações educacionais personalizadas para transformar conceitos abstratos em recursos visuais.
                  </p>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <BarChart4 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Análise de Dados</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Interprete informações e visualize o desempenho da turma para intervenções pedagógicas eficazes.
                  </p>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <BookCopy className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Plano de Aula</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Gere planos didáticos alinhados à BNCC com um clique, otimizando o tempo do educador.
                  </p>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Análise de Documentos</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Transforme PDFs, planilhas e imagens em conteúdos educativos prontos para uso em sala de aula.
                  </p>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <FolderKanban className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-xl mb-2">Organização em Pastas</h3>
                  <p className="text-sm text-muted-foreground flex-1">
                    Interface intuitiva para criação de pastas por disciplina, turma ou projetos específicos.
                  </p>
                </div>
              </div>
              <div className="bg-primary/5 w-full max-w-6xl rounded-lg p-6 mt-8">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="font-medium text-xl mb-2">Assistente Virtual - 24/7</h3>
                    <p className="text-sm text-muted-foreground">
                      Suporte contínuo para dúvidas, sugestões e resolução de tarefas, disponível a qualquer momento para professores e alunos.
                    </p>
                  </div>
                  <Button className="ml-auto mt-4 md:mt-0">Experimentar</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section id="newsletter" className="py-16 md:py-20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter">
                    Newsletter Semanal – iAula Insights
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground">
                    Receba os principais avanços em IA e educação, ferramentas novas, dicas práticas e estudos de caso.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input 
                      type="email" 
                      placeholder="Seu email" 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
                    />
                    <Button>Inscrever-se</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Exclusiva para professores e alunos assinantes. Cancelamento a qualquer momento.
                  </p>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto flex justify-center lg:justify-end">
                <div className="grid grid-cols-1 gap-2 max-w-[400px]">
                  <div className="bg-background rounded-lg shadow-sm p-4 flex items-start gap-3">
                    <div className="h-16 w-16 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Novos modelos de IA para resolução de problemas matemáticos
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Edição #42 • 10/04/2025
                      </p>
                    </div>
                  </div>
                  <div className="bg-background rounded-lg shadow-sm p-4 flex items-start gap-3">
                    <div className="h-16 w-16 rounded bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Como a IA está transformando a avaliação de redações
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Edição #41 • 03/04/2025
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-20 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter">
                  Planos de Assinatura
                </h2>
                <p className="max-w-[600px] text-muted-foreground">
                  Escolha o plano ideal para você ou sua instituição.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full max-w-4xl">
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col border border-primary/20">
                  <h3 className="font-medium text-xl mb-2">Plano Individual</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Para alunos ou professores individuais
                  </p>
                  <div className="text-3xl font-bold mb-4">
                    R$ 49,90<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>Acesso a todos os modelos de IA</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>20.000 tokens por mês</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>Acesso a cursos básicos</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>Newsletter semanal</span>
                    </li>
                  </ul>
                  <Button className="w-full">Assinar agora</Button>
                </div>
                <div className="bg-background rounded-xl shadow-sm p-6 flex flex-col border-2 border-primary relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                    Mais popular
                  </div>
                  <h3 className="font-medium text-xl mb-2">Plano Escola</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Licenças em lote para instituições
                  </p>
                  <div className="text-3xl font-bold mb-4">
                    Personalizado<span className="text-sm font-normal text-muted-foreground">/instituição</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>Acesso ilimitado para toda a escola</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>Tokens personalizados por contrato</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>Todos os cursos e certificações</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>Gestão centralizada pelo administrador</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>Controle de uso de tokens por usuário</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                      <span>Suporte dedicado</span>
                    </li>
                  </ul>
                  <Button className="w-full">Solicitar orçamento</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Depoimentos e Eventos Section */}
        <section id="events" className="py-16 md:py-20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Depoimentos */}
              <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter">
                    O que dizem nossos usuários
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground">
                    Experiências reais de professores e alunos transformadas pela iAula.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="bg-background rounded-lg p-6 shadow-sm border border-primary/10">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="italic text-muted-foreground mb-4">
                          "Consigo preparar minhas aulas em metade do tempo, com planos mais completos e detalhados. O assistente virtual ajuda a responder dúvidas dos alunos mesmo fora do horário escolar."
                        </p>
                        <p className="font-medium">Vanessa Santos</p>
                        <p className="text-sm text-muted-foreground">Professora de História, Colégio Estadual</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-6 shadow-sm border border-primary/10">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="italic text-muted-foreground mb-4">
                          "A iAula revolucionou meus estudos. O assistente me ajuda a entender conteúdos complexos de forma simples, e a correção automática de redações me permitiu melhorar rapidamente minha escrita."
                        </p>
                        <p className="font-medium">Lucas Oliveira</p>
                        <p className="text-sm text-muted-foreground">Estudante de Ensino Médio</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Eventos */}
              <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter">
                    iAula Summit 2025
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground">
                    O maior evento de IA aplicada à educação no Brasil. Junte-se a educadores e especialistas em tecnologia educacional.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-6 w-6 text-primary" />
                      <span className="font-medium">15-17 de Maio, 2025</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <School className="h-6 w-6 text-primary" />
                      <span className="font-medium">Centro de Convenções, São Paulo</span>
                    </div>
                    <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 mt-4">
                      <h3 className="font-medium text-lg mb-2">Destaques do evento:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                          <span>Keynotes com especialistas internacionais em IA educacional</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                          <span>Workshops práticos sobre implementação de IA em sala de aula</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                          <span>Networking com educadores inovadores de todo o país</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /> 
                          <span>Certificado de participação reconhecido pelo MEC</span>
                        </li>
                      </ul>
                    </div>
                    <Button size="lg" className="w-full">Inscreva-se para o evento</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-20 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Transforme sua escola com iAula!
                </h2>
                <p className="max-w-[800px] text-muted-foreground md:text-xl">
                  A plataforma inteligente que reúne tudo de que educadores e alunos precisam, potencializada pela IA.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row mt-6">
                <Link href="/auth?register=true">
                  <Button size="lg" className="gap-2">
                    Comece agora gratuitamente <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Agendar demonstração
                </Button>
              </div>
              <p className="text-sm text-muted-foreground max-w-[600px] mt-4">
                Junte-se a milhares de educadores e alunos que já estão revolucionando o aprendizado com IA. 
                Alinhada à LGPD e às diretrizes educacionais brasileiras.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <a href="/" className="flex items-center gap-2 mb-4">
                <LogoWithText textSize="md" />
              </a>
              <p className="text-sm text-muted-foreground mb-4">
                A primeira plataforma de Inteligência Artificial Educacional para Professores e Alunos.
              </p>
              <div className="flex gap-3">
                <a href="#" className="h-9 w-9 flex items-center justify-center rounded-md bg-muted">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="h-9 w-9 flex items-center justify-center rounded-md bg-muted">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="h-9 w-9 flex items-center justify-center rounded-md bg-muted">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-3">Plataforma</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Recursos</a></li>
                <li><a href="#courses" className="hover:text-foreground">Cursos</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Planos</a></li>
                <li><a href="#events" className="hover:text-foreground">Eventos</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3">Empresa</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Sobre nós</a></li>
                <li><a href="#" className="hover:text-foreground">Carreiras</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Contato</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground">Cookies</a></li>
                <li><a href="#" className="hover:text-foreground">Licenças</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-muted-foreground">
              © 2025 iAula. Todos os direitos reservados.
            </p>
            <p className="text-xs text-muted-foreground mt-4 md:mt-0">
              Feito com ❤️ para professores e alunos do Brasil
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}