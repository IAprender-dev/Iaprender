import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import LibreTranslateWidget from "@/components/LibreTranslateWidget";
import aiverseLogo from "@assets/Design sem nome (5)_1749147884733.png";

export default function Translator() {
  return (
    <>
      <Helmet>
        <title>Tradutor Educacional - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/student/dashboard">
              <Button className="gap-3 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <img 
                src={aiverseLogo} 
                alt="AIverse Logo" 
                className="w-8 h-8"
              />
              <span className="text-sm font-medium text-gray-600">AIverse Tradutor</span>
            </div>
          </div>

          {/* Main Content */}
          <LibreTranslateWidget />
        </div>
      </div>
    </>
  );
}