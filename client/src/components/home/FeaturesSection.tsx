import { 
  FileCheck, 
  Lightbulb, 
  Image, 
  BarChart, 
  CalendarDays, 
  Bot 
} from "lucide-react";

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="bg-neutral-50 rounded-lg p-6 hover:shadow-md transition duration-300">
      <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 font-heading">{title}</h3>
      <p className="mt-2 text-neutral-600">
        {description}
      </p>
    </div>
  );
}

function LargeFeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="bg-neutral-50 rounded-lg p-8 hover:shadow-lg transition duration-300">
      <div className="flex items-center">
        <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center">
          {icon}
        </div>
        <div className="ml-6">
          <h3 className="text-xl font-semibold text-neutral-900 font-heading">{title}</h3>
          <p className="mt-2 text-neutral-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="recursos" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 font-heading">Ferramentas Inteligentes</h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-neutral-600">
            O coração da iAula está em suas ferramentas de IA que potencializam o ensino.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureItem 
            icon={<FileCheck className="text-primary" />}
            title="Revisor de Tarefas"
            description="Correção automática de atividades com feedback personalizado para cada aluno."
          />
          
          <FeatureItem 
            icon={<Lightbulb className="text-primary" />}
            title="Gerador de Ideias"
            description="Sugestões criativas para aulas, atividades e projetos alinhados ao seu contexto."
          />
          
          <FeatureItem 
            icon={<Image className="text-primary" />}
            title="Criador de Imagens"
            description="Gere ilustrações educacionais personalizadas para conceitos abstratos."
          />
          
          <FeatureItem 
            icon={<BarChart className="text-primary" />}
            title="Análise de Dados"
            description="Visualize o desempenho da turma com insights para intervenções pedagógicas."
          />
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <LargeFeatureItem 
            icon={<CalendarDays className="text-primary h-6 w-6" />}
            title="Planejamento de Aula"
            description="Crie planos personalizados alinhados à BNCC com auxílio da IA. Basta selecionar a disciplina, o tópico, o ano escolar e o objetivo da aula."
          />
          
          <LargeFeatureItem 
            icon={<Bot className="text-primary h-6 w-6" />}
            title="Assistente Virtual"
            description="Suporte 24/7 para dúvidas, sugestões e resolução de tarefas. Assistência personalizada para alunos e professores."
          />
        </div>
      </div>
    </section>
  );
}
