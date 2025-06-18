import { useState } from "react";
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
  Share
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
    }
  ]);

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-50 to-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Central de Downloads
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {downloads.length} itens
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {downloads.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getFileIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{item.size}</span>
                      <span>•</span>
                      <span>{item.downloadedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Share className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator className="my-3" />
        <Button variant="outline" size="sm" className="w-full">
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
    }
  ]);

  return (
    <Card className="border-0 bg-gradient-to-br from-rose-50 to-pink-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-600" />
            Itens Favoritos
          </CardTitle>
          <Badge variant="secondary" className="bg-rose-100 text-rose-700">
            {favorites.length} itens
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {favorites.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow group">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getTypeColor(item.type)}`}
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
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator className="my-3" />
        <Button variant="outline" size="sm" className="w-full">
          Gerenciar favoritos
        </Button>
      </CardContent>
    </Card>
  );
}