import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Languages } from "lucide-react";
import LibreTranslateWidget from "@/components/LibreTranslateWidget";

export default function Translator() {
  return (
    <>
      <Helmet>
        <title>Tradutor Educacional - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-12">
            <Link href="/student/dashboard">
              <Button variant="outline" className="gap-3 h-12 px-6 bg-white/80 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200 rounded-xl">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Languages className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">IAverse Tradutor</span>
            </div>
          </div>

          {/* Main Content */}
          <LibreTranslateWidget />
        </div>
      </div>
    </>
  );
}