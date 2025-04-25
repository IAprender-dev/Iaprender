import { 
  ShieldCheck, 
  LockKeyhole, 
  FileText 
} from "lucide-react";

interface SecurityFeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function SecurityFeature({ icon, title, description }: SecurityFeatureProps) {
  return (
    <div className="flex">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white">
          {icon}
        </div>
      </div>
      <div className="ml-4">
        <h3 className="text-lg font-medium text-neutral-900">{title}</h3>
        <p className="mt-2 text-neutral-600">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function SecuritySection() {
  return (
    <section id="seguranca" className="py-16 bg-neutral-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 font-heading">Segurança em primeiro lugar na iAula</h2>
            <p className="mt-4 text-lg text-neutral-600">
              Tratamos os dados educacionais com o máximo cuidado e responsabilidade. Nossa plataforma segue rigorosamente a Lei Geral de Proteção de Dados (LGPD).
            </p>
            <div className="mt-8 space-y-6">
              <SecurityFeature
                icon={<ShieldCheck className="h-6 w-6" />}
                title="Dados Protegidos"
                description="Utilizamos criptografia avançada para proteger todas as informações dos usuários, garantindo que apenas pessoas autorizadas tenham acesso."
              />
              
              <SecurityFeature
                icon={<LockKeyhole className="h-6 w-6" />}
                title="Acesso Seguro"
                description="Autenticação de dois fatores e controles de acesso rigorosos garantem que só pessoas autorizadas acessem informações sensíveis."
              />
              
              <SecurityFeature
                icon={<FileText className="h-6 w-6" />}
                title="Transparência"
                description="Política de privacidade clara e objetiva, explicando exatamente como utilizamos os dados e respeitamos o direito à privacidade."
              />
            </div>
          </div>
          
          <div className="mt-10 lg:mt-0 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1581092787765-e3feb951d987?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
              alt="Segurança de dados educacionais" 
              className="rounded-lg shadow-xl max-w-md" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
