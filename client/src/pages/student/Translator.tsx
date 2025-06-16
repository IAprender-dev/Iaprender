import { Helmet } from "react-helmet";
import LibreTranslateWidget from "@/components/LibreTranslateWidget";
import { BackButton } from "@/components/ui/back-button";
import iaprenderLogo from "@assets/iaprender-logo.png";

export default function Translator() {
  return (
    <>
      <Helmet>
        <title>Tradutor Educacional - IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <BackButton href="/aluno/dashboard" />
            
            <div className="flex items-center gap-3">
              <img 
                src={iaprenderLogo} 
                alt="IAprender Logo" 
                className="w-8 h-8"
              />
              <span className="text-sm font-medium text-gray-600">IAprender Tradutor</span>
            </div>
          </div>

          {/* Main Content */}
          <LibreTranslateWidget />
        </div>
      </div>
    </>
  );
}