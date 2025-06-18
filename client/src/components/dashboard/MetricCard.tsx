import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  gradient: string;
  iconColor: string;
  textColor: string;
  chart?: ReactNode;
}

export function MetricCard({ 
  title, 
  value, 
  icon, 
  trend, 
  gradient, 
  iconColor, 
  textColor,
  chart 
}: MetricCardProps) {
  return (
    <Card className={`border-0 ${gradient} hover:shadow-md transition-all duration-300`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <p className={`text-sm font-medium ${textColor}/70`}>{title}</p>
            <p className={`text-2xl font-bold ${textColor} mt-1`}>{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className={`h-3 w-3 ${textColor}/60`} />
                ) : (
                  <TrendingDown className={`h-3 w-3 ${textColor}/60`} />
                )}
                <span className={`text-xs ${textColor}/60`}>
                  {trend.isPositive ? '+' : ''}{trend.value}% {trend.period}
                </span>
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${iconColor}`}>
            {icon}
          </div>
        </div>
        {chart && (
          <div className="h-12 mt-3">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  );
}