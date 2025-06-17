import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { apiRequest } from '@/lib/queryClient';

interface TokenStatus {
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

export default function TokenWidget() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTokenStatus();
    }
  }, [isAuthenticated]);

  const fetchTokenStatus = async () => {
    try {
      const response = await apiRequest('GET', '/api/tokens/status');
      if (response.ok) {
        const data = await response.json();
        setTokenStatus(data);
      }
    } catch (error) {
      console.error('Erro ao buscar status de tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenStatus) {
    return null;
  }

  const usagePercentage = (tokenStatus.currentUsage / tokenStatus.monthlyLimit) * 100;
  const resetDate = new Date(tokenStatus.resetDate);
  const daysUntilReset = Math.ceil((resetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Uso de Tokens de IA
          {tokenStatus.warningThreshold && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Limite Próximo
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{tokenStatus.currentUsage.toLocaleString()} tokens</span>
            <span>{tokenStatus.monthlyLimit.toLocaleString()} tokens</span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-2 ${
              usagePercentage > 90 ? 'text-red-500' : 
              usagePercentage > 80 ? 'text-yellow-500' : 
              'text-green-500'
            }`}
          />
          <div className="text-xs text-center text-gray-500">
            {usagePercentage.toFixed(1)}% utilizado
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Hoje</span>
            </div>
            <div className="font-medium">
              {tokenStatus.stats.dailyUsage.toLocaleString()}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <TrendingUp className="h-3 w-3" />
              <span>Média Diária</span>
            </div>
            <div className="font-medium">
              {tokenStatus.stats.averageDailyUsage.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Reset Info */}
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-600 text-center">
            Renovação em {daysUntilReset} dias
            <div className="text-gray-500">
              {resetDate.toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Warning Message */}
        {tokenStatus.warningThreshold && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
            <div className="text-xs text-yellow-800">
              Você está próximo do seu limite mensal. Use os tokens com moderação.
            </div>
          </div>
        )}

        {/* No Tokens Warning */}
        {!tokenStatus.canProceed && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2">
            <div className="text-xs text-red-800">
              Limite de tokens atingido. Aguarde a renovação ou contate o administrador.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}