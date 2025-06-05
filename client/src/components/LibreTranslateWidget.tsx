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
      // Usando LibreTranslate auto-hospedado
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: sourceText,
          source: sourceLang === "auto" ? "auto" : sourceLang,
          target: targetLang,
          format: "text"
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
    <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-sm shadow-lg rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
            <Languages className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Tradutor LibreTranslate</CardTitle>
            <p className="text-sm text-slate-600">Traduza textos educacionais instantaneamente</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Language Selection */}
        <div className="flex items-center gap-2">
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Idioma origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Detectar idioma</SelectItem>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapLanguages}
            disabled={sourceLang === "auto"}
            className="px-3"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
          
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Idioma destino" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Texto original</label>
              {sourceText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTextToSpeech(sourceText, sourceLang)}
                  className="h-6 w-6 p-0"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Textarea
              placeholder="Digite o texto que deseja traduzir..."
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[120px] resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Tradução</label>
              <div className="flex gap-1">
                {translatedText && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTextToSpeech(translatedText, targetLang)}
                      className="h-6 w-6 p-0"
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyToClipboard}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Textarea
              placeholder="A tradução aparecerá aqui..."
              value={translatedText}
              readOnly
              className="min-h-[120px] resize-none bg-slate-50"
            />
          </div>
        </div>

        {/* Translate Button */}
        <Button
          onClick={handleTranslate}
          disabled={isTranslating || !sourceText.trim()}
          className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm"
        >
          {isTranslating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Traduzindo...
            </>
          ) : (
            <>
              <Languages className="h-4 w-4" />
              Traduzir
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-slate-500 text-center">
          Powered by LibreTranslate - Tradução gratuita e open source
        </p>
      </CardContent>
    </Card>
  );
}