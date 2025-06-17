import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, AlertTriangle, Info, Settings } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/AuthContext";

interface TokenUsageData {
  canProceed: boolean;
  currentUsage: number;
  monthlyLimit: number;
  remainingTokens: number;
  resetDate: string;
  warningThreshold: boolean;
  stats: {
    totalUsage: number;
    dailyUsage: number;
    weeklyUsage: number;
    monthlyUsage: number;
    averageDailyUsage: number;
  };
}

export function TokenUsageWidget() {
  const { data: tokenData, isLoading, error } = useQuery<TokenUsageData>({
    queryKey: ["/api/tokens/status"],
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    retry: 1,
    staleTime: 30000, // 30 segundos
  });

  if (error) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Tokens IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Erro ao carregar dados
            </div>
            <div className="text-xs text-red-600">
              {error.message}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !tokenData) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 animate-pulse" />
            Tokens IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (tokenData.currentUsage / tokenData.monthlyLimit) * 100;
  const remainingPercentage = (tokenData.remainingTokens / tokenData.monthlyLimit) * 100;

  const getStatusVariant = () => {
    if (usagePercentage >= 90) return "destructive";
    if (usagePercentage >= 75) return "secondary";
    return "default";
  };

  const getProgressColorClass = () => {
    if (usagePercentage >= 90) return "bg-red-500";
    if (usagePercentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Tokens IA
          </CardTitle>
          <Badge variant={getStatusVariant()} className="text-xs">
            {!tokenData.canProceed ? (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Limite
              </>
            ) : tokenData.warningThreshold ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1" />
                Alto uso
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Normal
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Indicador visual principal */}
        <div className="text-center space-y-2">
          <div className="text-2xl font-bold text-primary">
            {formatNumber(tokenData.remainingTokens)}
          </div>
          <div className="text-xs text-muted-foreground">
            tokens disponíveis
          </div>
          
          <Progress 
            value={usagePercentage} 
            className="h-2"
            style={{
              backgroundColor: 'hsl(var(--muted))',
            }}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatNumber(tokenData.currentUsage)} usado</span>
            <span>{formatNumber(tokenData.monthlyLimit)} total</span>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 gap-3 text-center text-xs">
          <div className="space-y-1">
            <div className="text-muted-foreground">Hoje</div>
            <div className="font-semibold">
              {formatNumber(tokenData.stats.dailyUsage)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Esta semana</div>
            <div className="font-semibold">
              {formatNumber(tokenData.stats.weeklyUsage)}
            </div>
          </div>
        </div>

        {/* Aviso se necessário */}
        {!tokenData.canProceed && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-destructive mb-1">
                  Limite mensal atingido
                </div>
                <div className="text-muted-foreground">
                  Aguarde a renovação automática ou entre em contato com suporte.
                </div>
              </div>
            </div>
          </div>
        )}

        {tokenData.warningThreshold && tokenData.canProceed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-yellow-800 mb-1">
                  Uso elevado detectado
                </div>
                <div className="text-yellow-700">
                  Você está próximo do limite mensal. Use com moderação.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Link para dashboard completo */}
        <div className="pt-2 border-t">
          <Link href="/tokens">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Ver detalhes completos
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}