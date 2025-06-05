import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, ArrowRightLeft, Copy, Volume2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LANGUAGES = [
  { code: "pt", name: "Português" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文" },
  { code: "ru", name: "Русский" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" }
];

export default function LibreTranslateWidget() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "Erro",
        description: "Digite um texto para traduzir",
        variant: "destructive"
      });
      return;
    }

    setIsTranslating(true);
    try {
      // Usando nossa API interna que chama o LibreTranslate
      const response = await fetch('/api/translate/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang: sourceLang === "auto" ? "auto" : sourceLang,
          targetLang: targetLang
        })
      });

      if (!response.ok) {
        throw new Error('Erro na tradução');
      }

      const data = await response.json();
      setTranslatedText(data.translatedText);
      
      toast({
        title: "Sucesso",
        description: "Texto traduzido com sucesso!",
      });
    } catch (error) {
      console.error('Erro na tradução:', error);
      toast({
        title: "Erro",
        description: "Falha ao traduzir o texto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang !== "auto") {
      setSourceLang(targetLang);
      setTargetLang(sourceLang);
      setSourceText(translatedText);
      setTranslatedText(sourceText);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
      toast({
        title: "Copiado",
        description: "Texto copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar o texto",
        variant: "destructive"
      });
    }
  };

  const handleTextToSpeech = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'auto' ? 'pt-BR' : `${lang}-${lang === 'en' ? 'US' : lang === 'pt' ? 'BR' : 'ES'}`;
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta síntese de voz",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tradutor Educacional</h1>
          <p className="text-gray-600 mt-2">Traduza textos e materiais educacionais com precisão</p>
        </div>
      </div>

      {/* Main Translation Interface */}
      <Card className="border-0 shadow-xl bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-8">
          {/* Language Selection */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">Idioma de origem</label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="h-12 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="Selecionar idioma" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="auto" className="h-10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Detectar automaticamente
                    </div>
                  </SelectItem>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="h-10 rounded-lg">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col items-center justify-end h-20">
              <Button
                size="icon"
                onClick={handleSwapLanguages}
                disabled={sourceLang === "auto"}
                className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50 disabled:bg-gray-300"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">Idioma de destino</label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="h-12 border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="Selecionar idioma" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code} className="h-10 rounded-lg">
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Text Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Input Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Texto original</label>
                {sourceText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTextToSpeech(sourceText, sourceLang)}
                    className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100"
                  >
                    <Volume2 className="h-4 w-4 text-gray-600" />
                  </Button>
                )}
              </div>
              <div className="relative">
                <Textarea
                  placeholder="Digite ou cole o texto que deseja traduzir..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="min-h-[200px] resize-none border-gray-200 bg-gray-50 text-gray-900 rounded-2xl p-4 text-base leading-relaxed placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {sourceText.length} caracteres
                </div>
              </div>
            </div>
            
            {/* Output Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Tradução</label>
                <div className="flex gap-1">
                  {translatedText && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTextToSpeech(translatedText, targetLang)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100"
                      >
                        <Volume2 className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyToClipboard}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100"
                      >
                        <Copy className="h-4 w-4 text-gray-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="relative">
                <Textarea
                  placeholder="A tradução aparecerá aqui..."
                  value={translatedText}
                  readOnly
                  className="min-h-[200px] resize-none border-gray-200 bg-blue-50 text-gray-900 rounded-2xl p-4 text-base leading-relaxed placeholder-gray-400"
                />
                {translatedText && (
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {translatedText.length} caracteres
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !sourceText.trim()}
              className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Traduzindo...
                </>
              ) : (
                <>
                  <Languages className="h-5 w-5 mr-2" />
                  Traduzir Texto
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Powered by MyMemory
        </p>
      </div>
    </div>
  );
}