import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  chart?: React.ReactNode;
  color?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  chart,
  color = "blue",
  className = ""
}: MetricCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
          border: "border-blue-200",
          accent: "bg-blue-600"
        };
      case "green":
        return {
          bg: "bg-gradient-to-br from-emerald-50 to-teal-100",
          border: "border-emerald-200",
          accent: "bg-emerald-600"
        };
      case "purple":
        return {
          bg: "bg-gradient-to-br from-purple-50 to-violet-100",
          border: "border-purple-200",
          accent: "bg-purple-600"
        };
      case "orange":
        return {
          bg: "bg-gradient-to-br from-orange-50 to-amber-100",
          border: "border-orange-200",
          accent: "bg-orange-600"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-slate-50 to-gray-100",
          border: "border-slate-200",
          accent: "bg-slate-600"
        };
    }
  };

  const colorClasses = getColorClasses(color);

  return (
    <Card className={`relative overflow-hidden border-2 ${colorClasses.border} ${colorClasses.bg} shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-slate-700">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses.accent}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
        {description && (
          <p className="text-sm text-slate-600 font-medium">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-3">
            <Badge 
              variant={trend.isPositive ? "default" : "destructive"}
              className={`text-xs font-semibold ${
                trend.isPositive 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-red-100 text-red-800 border-red-200"
              }`}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </Badge>
            <span className="text-xs text-slate-500 ml-2 font-medium">
              vs. mês anterior
            </span>
          </div>
        )}
        {chart && (
          <div className="mt-4">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  );
}