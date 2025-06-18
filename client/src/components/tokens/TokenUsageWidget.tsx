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
  const { user } = useAuth();
  
  const { data: tokenData, isLoading, error } = useQuery<TokenUsageData>({
    queryKey: ["/api/tokens/status"],
    refetchInterval: 60000, // Atualiza a cada 1 minuto
    retry: 1,
    staleTime: 30000, // 30 segundos
    enabled: !!user, // Só executa quando o usuário está autenticado
  });

  // Se o usuário não está autenticado, não mostra o widget
  if (!user) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Tokens IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">
              Faça login para ver seus tokens
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
    <Card className="h-fit border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-violet-600 rounded-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Tokens IA
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={`text-xs font-semibold ${
              !tokenData.canProceed 
                ? "bg-red-100 text-red-800 border-red-200" 
                : tokenData.warningThreshold 
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-green-100 text-green-800 border-green-200"
            }`}
          >
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
        <div className="text-center space-y-3 bg-white/70 rounded-xl p-4 border border-violet-200">
          <div className="text-3xl font-bold text-slate-900">
            {formatNumber(tokenData.remainingTokens)}
          </div>
          <div className="text-sm text-slate-600 font-medium">
            tokens disponíveis
          </div>
          
          <Progress 
            value={usagePercentage} 
            className="h-3 bg-slate-200"
          />
          
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>{formatNumber(tokenData.currentUsage)} usado</span>
            <span>{formatNumber(tokenData.monthlyLimit)} total</span>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center space-y-1 bg-white/60 rounded-lg p-3 border border-violet-100">
            <div className="text-xs text-slate-600 font-medium">Hoje</div>
            <div className="text-lg font-bold text-slate-900">
              {formatNumber(tokenData.stats.dailyUsage)}
            </div>
          </div>
          <div className="text-center space-y-1 bg-white/60 rounded-lg p-3 border border-violet-100">
            <div className="text-xs text-slate-600 font-medium">Esta semana</div>
            <div className="text-lg font-bold text-slate-900">
              {formatNumber(tokenData.stats.weeklyUsage)}
            </div>
          </div>
        </div>

        {/* Aviso se necessário */}
        {!tokenData.canProceed && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-red-800 mb-1">
                  Limite mensal atingido
                </div>
                <div className="text-red-700 font-medium">
                  Aguarde a renovação automática ou entre em contato com suporte.
                </div>
              </div>
            </div>
          </div>
        )}

        {tokenData.warningThreshold && tokenData.canProceed && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-amber-800 mb-1">
                  Uso elevado detectado
                </div>
                <div className="text-amber-700 font-medium">
                  Você está próximo do limite mensal. Use com moderação.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Link para dashboard completo */}
        <div className="pt-2 border-t border-violet-200">
          <Link href="/tokens">
            <button className="w-full h-8 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 hover:text-violet-800 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1">
              <Settings className="h-2.5 w-2.5" />
              Ver detalhes completos
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}