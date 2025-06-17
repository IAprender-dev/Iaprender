import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

export function TokenUsageCard() {
  const { data: tokenData, isLoading } = useQuery<TokenUsageData>({
    queryKey: ["/api/tokens/status"],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  if (isLoading || !tokenData) {
    return (
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Uso de Tokens IA</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (tokenData.currentUsage / tokenData.monthlyLimit) * 100;
  const resetIn = formatDistanceToNow(new Date(tokenData.resetDate), { 
    addSuffix: true, 
    locale: ptBR 
  });

  const getStatusColor = () => {
    if (usagePercentage >= 90) return "destructive";
    if (usagePercentage >= 70) return "warning";
    return "default";
  };

  const getStatusIcon = () => {
    if (!tokenData.canProceed) return <AlertTriangle className="h-4 w-4" />;
    if (tokenData.warningThreshold) return <TrendingUp className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return "bg-red-500";
    if (usagePercentage >= 70) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium">Tokens IA</CardTitle>
          <Badge variant={getStatusColor()} className="text-xs">
            {getStatusIcon()}
            {tokenData.canProceed ? "Disponível" : "Limite Atingido"}
          </Badge>
        </div>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Uso atual vs limite */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-bold">
                {tokenData.remainingTokens.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                de {tokenData.monthlyLimit.toLocaleString()} tokens
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="w-full h-2" 
              style={{ "--progress-background": getProgressColor() } as any}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Usado: {tokenData.currentUsage.toLocaleString()}</span>
              <span>{usagePercentage.toFixed(1)}%</span>
            </div>
          </div>

          {/* Estatísticas rápidas */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Hoje</div>
              <div className="text-lg font-semibold">
                {tokenData.stats.dailyUsage.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">Média/dia</div>
              <div className="text-lg font-semibold">
                {tokenData.stats.averageDailyUsage.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Informações de reset */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <span>Limite renova {resetIn}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}