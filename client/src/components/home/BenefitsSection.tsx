import { CheckIcon } from "lucide-react";

interface BenefitGroupProps {
  icon: React.ReactNode;
  title: string;
  benefits: string[];
}

function BenefitGroup({ icon, title, benefits }: BenefitGroupProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md">
      <div className="p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 font-heading">{title}</h3>
        <ul className="mt-4 space-y-3 text-neutral-600">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start">
              <CheckIcon className="h-5 w-5 text-[#34C759] mt-1 mr-2 flex-shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function BenefitsSection() {
  const teacherBenefits = [
    "Correções automatizadas que economizam horas de trabalho",
    "Relatórios detalhados de desempenho para intervenções precisas",
    "Sugestões de atividades personalizadas baseadas em IA",
    "Planejamento pedagógico alinhado às diretrizes nacionais"
  ];

  const studentBenefits = [
    "Conteúdo adaptativo que se ajusta ao seu ritmo de aprendizado",
    "Identificação automática do seu estilo de aprendizagem",
    "Personalização em tempo real das atividades e explicações",
    "Assistência para dúvidas 24 horas por dia, 7 dias por semana"
  ];

  const institutionBenefits = [
    "Otimização de recursos humanos e materiais",
    "Automação de processos administrativos e pedagógicos",
    "Insights valiosos sobre o desempenho institucional",
    "Diferencial competitivo no mercado educacional"
  ];

  return (
    <section id="beneficios" className="py-16 bg-neutral-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 font-heading">Benefícios da iAula para Todos</h2>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-neutral-600">
            Nossa plataforma transforma a experiência educacional para toda a comunidade escolar.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <BenefitGroup 
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1l-1.17-1.8"></path><path d="m7.7 10.7-.8.8"></path><path d="M12 22c-1.1 0-2-.9-2-2"></path><path d="M14 22h4a2 2 0 0 0 0-4h-4v-1a3 3 0 0 0-3 3"></path><path d="M22 16c0 .27-.1.5-.29.7l-.3.3"></path><path d="m21 16-2-2 1-1"></path><path d="m12 10 4.24-4.24a5.21 5.21 0 1 0-7.4 7.4"></path><circle cx="7.5" cy="4.21" r="1"></circle></svg>}
            title="Para Professores"
            benefits={teacherBenefits}
          />

          <BenefitGroup 
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>}
            title="Para Alunos"
            benefits={studentBenefits}
          />

          <BenefitGroup 
            icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="M17 21h-10a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"></path><path d="M11 12v-3a2 2 0 1 1 2 2h-2z"></path><path d="M11 14h5"></path><path d="M11 18h5"></path><path d="M7 14h.01"></path><path d="M7 18h.01"></path></svg>}
            title="Para Instituições"
            benefits={institutionBenefits}
          />
        </div>
      </div>
    </section>
  );
}
