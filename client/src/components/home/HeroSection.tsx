import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-primary to-primary/70 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <img 
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
          alt="Fundo educacional" 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white font-heading leading-tight">
              Revolucione o Aprendizado com <span className="text-[#34C759]">iAula</span>
            </h1>
            <p className="mt-4 text-lg text-white opacity-90">
              A Inteligência Artificial que transforma a educação, personalizando o aprendizado e otimizando o tempo dos educadores.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                asChild
                size="lg"
                className="bg-[#34C759] hover:bg-[#34C759]/90 text-white"
              >
                <Link href="/cursos">
                  Demonstração
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="bg-white text-primary hover:bg-neutral-100"
              >
                <Link href="/#planos">
                  Nossos planos
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-full max-w-lg">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1364&q=80" 
                  alt="Estudantes aprendendo com tecnologia" 
                  className="rounded-lg shadow-2xl" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
