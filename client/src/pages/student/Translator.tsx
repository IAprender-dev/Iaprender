import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import LibreTranslateWidget from "@/components/LibreTranslateWidget";

export default function Translator() {
  return (
    <>
      <Helmet>
        <title>Tradutor Educacional - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm" className="gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                Tradutor Educacional
              </h1>
              <p className="text-slate-600">
                Traduza textos e materiais educacionais em tempo real
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <LibreTranslateWidget />
          </div>
        </div>
      </div>
    </>
  );
}