import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { LogoWithText } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <LogoWithText textSize="md" />
          </a>
        </div>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4 border-primary/20">
          <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
            <AlertCircle className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
            <p className="text-md text-muted-foreground mb-6">
              O endereço que você está tentando acessar não existe ou foi movido.
            </p>
            <Button asChild>
              <a href="/">Voltar para a página inicial</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
