import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Download, 
  Palette, 
  Sparkles, 
  Eye,
  CheckCircle,
  Image as ImageIcon
} from "lucide-react";
import iaprenderLogo from "@assets/iaprender-logo.png";

export default function LogoShowcase() {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create download link for the logo
      const link = document.createElement('a');
      link.href = iaprenderLogo;
      link.download = 'iaprender-logo.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Logo IAprender - Showcase | AIverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-3">
              <Link href="/professor/dashboard">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl">
                  <Palette className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-slate-900">Logo IAprender</h1>
                  <p className="text-slate-600 text-sm">Gerado com IA - AIverse Logo Generator</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Logo Display */}
            <div className="space-y-6">
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <ImageIcon className="h-5 w-5 text-blue-600" />
                    Logo Gerado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl p-8 flex items-center justify-center">
                    <img 
                      src={iaprenderLogo} 
                      alt="Logo IAprender" 
                      className="max-w-full h-auto rounded-lg shadow-lg"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                  
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button 
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
                    >
                      {isDownloading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Download PNG
                    </Button>
                    
                    <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Logo Information */}
            <div className="space-y-6">
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                    Informações do Logo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Nome do Projeto</h3>
                    <p className="text-slate-700">IAprender</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Estilo</h3>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Moderno e Profissional
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Características</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-700">Design circular com padrão de rede neural</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-700">Cores azul e azul-petróleo profissionais</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-700">Tipografia limpa e legível</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-700">Elementos visuais de IA integrados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-700">Alto contraste e escalável</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Especificações Técnicas</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Formato:</span>
                        <p className="text-slate-600">PNG</p>
                      </div>
                      <div>
                        <span className="font-medium">Resolução:</span>
                        <p className="text-slate-600">1024x1024px</p>
                      </div>
                      <div>
                        <span className="font-medium">Qualidade:</span>
                        <p className="text-slate-600">Alta Definição</p>
                      </div>
                      <div>
                        <span className="font-medium">Transparência:</span>
                        <p className="text-slate-600">Não</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generation Info */}
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">Gerado com IA</h3>
                      <p className="text-sm text-slate-700">
                        Este logo foi criado usando a funcionalidade de geração de imagens do AIverse, 
                        powered by OpenAI DALL-E 3. O sistema utiliza prompts especializados para criar 
                        logos profissionais adequados para projetos educacionais e tecnológicos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}