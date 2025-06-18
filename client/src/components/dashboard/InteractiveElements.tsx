import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Heart, 
  FileText, 
  Image, 
  Video,
  Music,
  Archive,
  Star,
  Clock,
  Eye,
  Trash2,
  ExternalLink,
  Share,
  BookOpen,
  TrendingUp,
  Users,
  Award,
  Target,
  BarChart
} from "lucide-react";

interface DownloadItem {
  id: number;
  name: string;
  type: "pdf" | "image" | "video" | "audio" | "zip";
  size: string;
  downloadedAt: string;
  url: string;
}

interface FavoriteItem {
  id: number;
  title: string;
  type: "lesson" | "activity" | "material" | "tool";
  lastAccessed: string;
  url: string;
}

interface SummaryData {
  id: number;
  title: string;
  subject: string;
  createdAt: string;
  views: number;
  grade: string;
}

interface StudentPerformance {
  id: number;
  studentName: string;
  subject: string;
  avgScore: number;
  completedActivities: number;
  totalActivities: number;
  lastActivity: string;
  trend: "up" | "down" | "stable";
}

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText className="h-4 w-4" />;
    case "image":
      return <Image className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "audio":
      return <Music className="h-4 w-4" />;
    case "zip":
      return <Archive className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "lesson":
      return "bg-blue-100 text-blue-800";
    case "activity":
      return "bg-green-100 text-green-800";
    case "material":
      return "bg-purple-100 text-purple-800";
    case "tool":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeDarkColor = (type: string) => {
  switch (type) {
    case "lesson":
      return "bg-blue-600 text-blue-100";
    case "activity":
      return "bg-green-600 text-green-100";
    case "material":
      return "bg-purple-600 text-purple-100";
    case "tool":
      return "bg-orange-600 text-orange-100";
    default:
      return "bg-gray-600 text-gray-100";
  }
};

export function DownloadsPanel() {
  const [downloads] = useState<DownloadItem[]>([
    {
      id: 1,
      name: "Plano_Aula_Matematica_8ano.pdf",
      type: "pdf",
      size: "2.3 MB",
      downloadedAt: "2 horas atrás",
      url: "#"
    },
    {
      id: 2,
      name: "Atividade_Algebra_Exercicios.pdf",
      type: "pdf",
      size: "1.8 MB",
      downloadedAt: "1 dia atrás",
      url: "#"
    },
    {
      id: 3,
      name: "Imagem_Educacional_Frações.png",
      type: "image",
      size: "856 KB",
      downloadedAt: "3 dias atrás",
      url: "#"
    },
    {
      id: 4,
      name: "Resumo_BNCC_Ciencias.pdf",
      type: "pdf",
      size: "1.2 MB",
      downloadedAt: "1 semana atrás",
      url: "#"
    },
    {
      id: 5,
      name: "Material_Didatico_Geografia.zip",
      type: "zip",
      size: "5.7 MB",
      downloadedAt: "2 semanas atrás",
      url: "#"
    }
  ]);

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Download className="h-5 w-5 text-white" />
            </div>
            Central de Downloads
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-600 text-white border-blue-500 font-semibold">
            {downloads.length} itens
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {downloads.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white/80 rounded-lg border-2 border-blue-100 hover:bg-white hover:border-blue-200 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    {getFileIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <span>{item.size}</span>
                      <span>•</span>
                      <span>{item.downloadedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-blue-100">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-blue-100">
                    <Share className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator className="my-3 bg-blue-200" />
        <Button variant="outline" size="sm" className="w-full border-2 border-blue-600 text-blue-700 font-semibold hover:bg-blue-600 hover:text-white transition-all">
          Ver todos os downloads
        </Button>
      </CardContent>
    </Card>
  );
}

export function FavoritesPanel() {
  const [favorites] = useState<FavoriteItem[]>([
    {
      id: 1,
      title: "Gerador de Atividades IA",
      type: "tool",
      lastAccessed: "Hoje",
      url: "/professor/ferramentas/gerador-atividades"
    },
    {
      id: 2,
      title: "Plano: Introdução à Álgebra",
      type: "lesson",
      lastAccessed: "Ontem",
      url: "#"
    },
    {
      id: 3,
      title: "Material: Frações Visuais",
      type: "material",
      lastAccessed: "3 dias atrás",
      url: "#"
    },
    {
      id: 4,
      title: "Atividade: Equações 1° Grau",
      type: "activity",
      lastAccessed: "1 semana atrás",
      url: "#"
    },
    {
      id: 5,
      title: "Resumos BNCC - Ciências",
      type: "material",
      lastAccessed: "2 semanas atrás",
      url: "#"
    }
  ]);

  return (
    <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-100 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-pink-600 rounded-lg">
              <Heart className="h-5 w-5 text-white" />
            </div>
            Itens Favoritos
          </CardTitle>
          <Badge variant="secondary" className="bg-pink-600 text-white border-pink-500 font-semibold">
            {favorites.length} itens
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {favorites.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white/80 rounded-lg border-2 border-pink-100 hover:bg-white hover:border-pink-200 transition-all shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs border-slate-200 ${getTypeColor(item.type)}`}
                      >
                        {item.type}
                      </Badge>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{item.lastAccessed}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-pink-100">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-pink-100">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator className="my-3 bg-pink-200" />
        <Button variant="outline" size="sm" className="w-full border-2 border-pink-600 text-pink-700 font-semibold hover:bg-pink-600 hover:text-white transition-all">
          Gerenciar favoritos
        </Button>
      </CardContent>
    </Card>
  );
}

export function SummariesPanel() {
  const [summaries] = useState<SummaryData[]>([
    {
      id: 1,
      title: "Resumo: Sistema Solar",
      subject: "Ciências",
      createdAt: "Hoje",
      views: 45,
      grade: "6º ano"
    },
    {
      id: 2,
      title: "Resumo: Revolução Industrial", 
      subject: "História",
      createdAt: "Ontem",
      views: 32,
      grade: "8º ano"
    },
    {
      id: 3,
      title: "Resumo: Frações e Decimais",
      subject: "Matemática", 
      createdAt: "2 dias atrás",
      views: 67,
      grade: "7º ano"
    }
  ]);

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-100 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            Resumos Criados
          </CardTitle>
          <Badge variant="secondary" className="bg-emerald-600 text-white border-emerald-500 font-semibold">
            {summaries.length} resumos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {summaries.map((item) => (
              <div key={item.id} className="p-3 bg-white/80 rounded-lg border-2 border-emerald-100 hover:bg-white hover:border-emerald-200 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 rounded-lg">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mt-1">
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
                        {item.subject}
                      </Badge>
                      <span>•</span>
                      <span>{item.grade}</span>
                      <span>•</span>
                      <span>{item.views} views</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator className="my-3 bg-emerald-200" />
        <Button variant="outline" size="sm" className="w-full border-2 border-emerald-600 text-emerald-700 font-semibold hover:bg-emerald-600 hover:text-white transition-all">
          Ver todos os resumos
        </Button>
      </CardContent>
    </Card>
  );
}

export function StudentPerformancePanel() {
  const [students] = useState<StudentPerformance[]>([
    {
      id: 1,
      studentName: "Ana Silva",
      subject: "Matemática",
      avgScore: 8.5,
      completedActivities: 12,
      totalActivities: 15,
      lastActivity: "2 horas atrás",
      trend: "up"
    },
    {
      id: 2,
      studentName: "Carlos Santos",
      subject: "Ciências", 
      avgScore: 7.2,
      completedActivities: 8,
      totalActivities: 10,
      lastActivity: "1 dia atrás",
      trend: "stable"
    },
    {
      id: 3,
      studentName: "Maria Oliveira",
      subject: "História",
      avgScore: 9.1,
      completedActivities: 10,
      totalActivities: 12,
      lastActivity: "3 horas atrás",
      trend: "up"
    }
  ]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-400" />;
      case "down":
        return <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />;
      default:
        return <Target className="h-3 w-3 text-yellow-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 7) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-amber-600 rounded-lg">
              <BarChart className="h-5 w-5 text-white" />
            </div>
            Rendimento dos Alunos
          </CardTitle>
          <Badge variant="secondary" className="bg-amber-600 text-white border-amber-500 font-semibold">
            {students.length} alunos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {students.map((student) => (
              <div key={student.id} className="p-3 bg-white/80 rounded-lg border-2 border-amber-100 hover:bg-white hover:border-amber-200 transition-all shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-600 rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {student.studentName}
                        </p>
                        {getTrendIcon(student.trend)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mt-1">
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-semibold">
                          {student.subject}
                        </Badge>
                        <span>•</span>
                        <span>{student.completedActivities}/{student.totalActivities}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getScoreColor(student.avgScore)}`}>
                      {student.avgScore.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator className="my-3 bg-amber-200" />
        <Button variant="outline" size="sm" className="w-full border-2 border-amber-600 text-amber-700 font-semibold hover:bg-amber-600 hover:text-white transition-all">
          Ver relatório completo
        </Button>
      </CardContent>
    </Card>
  );
}