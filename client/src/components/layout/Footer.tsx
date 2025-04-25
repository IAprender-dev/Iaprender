import { Link } from "wouter";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-neutral-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div>
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-white text-2xl font-bold font-heading">
                i<span className="text-[#34C759]">Aula</span>
              </span>
            </Link>
            <p className="mt-4 text-sm">
              A plataforma de IA educacional que está revolucionando o modo como ensinamos e aprendemos no Brasil.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-neutral-400 hover:text-white" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white" aria-label="LinkedIn">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/#recursos" className="hover:text-white">
                  Recursos
                </Link>
              </li>
              <li>
                <Link href="/#beneficios" className="hover:text-white">
                  Benefícios
                </Link>
              </li>
              <li>
                <Link href="/cursos" className="hover:text-white">
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/#seguranca" className="hover:text-white">
                  Segurança
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="hover:text-white">
                  Sobre nós
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-white font-medium mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="hover:text-white">
                  Perguntas Frequentes
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-white">
                  Entre em Contato
                </Link>
              </li>
              <li>
                <Link href="/ajuda" className="hover:text-white">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-white">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-white">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Information */}
          <div>
            <h3 className="text-white font-medium mb-4">Contato</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-3 text-neutral-400">📍</span>
                <span>Av. Paulista, 1000, São Paulo - SP</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-neutral-400">✉️</span>
                <span>contato@iaula.com.br</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 text-neutral-400">📞</span>
                <span>+55 (11) 3456-7890</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">© {new Date().getFullYear()} iAula. Todos os direitos reservados.</p>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <span className="text-xs text-neutral-500">Formas de pagamento:</span>
            <div className="flex space-x-2">
              <div className="h-6 w-10 bg-neutral-700 rounded"></div>
              <div className="h-6 w-10 bg-neutral-700 rounded"></div>
              <div className="h-6 w-10 bg-neutral-700 rounded"></div>
              <div className="h-6 w-10 bg-neutral-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
