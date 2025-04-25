import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-16 bg-primary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white font-heading">Transforme sua escola com iAula!</h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-white opacity-90">
          A plataforma inteligente que reúne tudo de que educadores e alunos precisam para uma experiência educacional revolucionária.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="text-primary bg-white hover:bg-neutral-100"
          >
            <Link href="/contato">
              Agendar demonstração
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-white bg-primary-600 bg-opacity-60 hover:bg-opacity-80 border border-white border-opacity-20"
          >
            <Link href="/contato">
              Falar com consultor
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
