import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { 
  ArrowLeft,
  Newspaper,
  PlayCircle,
  Calendar,
  Clock,
  Volume2,
  ExternalLink,
  Share2,
  BookOpen,
  Headphones,
  TrendingUp,
  Star,
  Download,
  Pause,
  Play,
  SkipForward,
  SkipBack
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  imageUrl?: string;
  isHighlighted: boolean;
}

interface PodcastEpisode {
  id: number;
  title: string;
  description: string;
  duration: string;
  publishedAt: string;
  category: string;
  audioUrl: string;
  thumbnail?: string;
  isPlaying?: boolean;
}

export default function NoticiasPodcasts() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'news' | 'podcasts'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);

  useEffect(() => {
    // Simulate loading news and podcasts
    const loadContent = async () => {
      setIsLoading(true);
      
      // Mock news data
      const mockNews: NewsItem[] = [
        {
          id: 1,
          title: "Inteligência Artificial Revoluciona o Ensino: Novas Ferramentas Chegam às Escolas",
          summary: "Estudo mostra como a IA está transformando a educação brasileira com ferramentas personalizadas.",
          content: "A implementação de inteligência artificial nas escolas brasileiras está mostrando resultados promissores...",
          author: "Dr. Maria Silva",
          publishedAt: "2025-01-02",
          category: "Tecnologia",
          isHighlighted: true
        },
        {
          id: 2,
          title: "BNCC e Tecnologia: Como Adaptar o Currículo para a Era Digital",
          summary: "Diretrizes para integração de tecnologias digitais seguindo a Base Nacional Comum Curricular.",
          content: "A Base Nacional Comum Curricular estabelece competências digitais essenciais...",
          author: "Prof. João Santos",
          publishedAt: "2025-01-01",
          category: "Educação",
          isHighlighted: false
        },
        {
          id: 3,
          title: "Metodologias Ativas: Transformando a Sala de Aula Tradicional",
          summary: "Descubra como aplicar metodologias ativas para engajar estudantes no processo de aprendizagem.",
          content: "As metodologias ativas colocam o estudante como protagonista do seu aprendizado...",
          author: "Dra. Ana Costa",
          publishedAt: "2024-12-30",
          category: "Metodologia",
          isHighlighted: false
        }
      ];

      // Mock podcasts data
      const mockPodcasts: PodcastEpisode[] = [
        {
          id: 1,
          title: "IA na Educação: Oportunidades e Desafios",
          description: "Discussão sobre como a inteligência artificial está transformando o cenário educacional brasileiro.",
          duration: "42:15",
          publishedAt: "2025-01-02",
          category: "Tecnologia",
          audioUrl: "#"
        },
        {
          id: 2,
          title: "Metodologias Ativas em Práticas",
          description: "Entrevista com especialistas sobre implementação de metodologias ativas na sala de aula.",
          duration: "35:20",
          publishedAt: "2024-12-28",
          category: "Metodologia",
          audioUrl: "#"
        },
        {
          id: 3,
          title: "Avaliação Formativa no Século XXI",
          description: "Como modernizar os processos de avaliação para melhor acompanhar o progresso dos estudantes.",
          duration: "28:45",
          publishedAt: "2024-12-25",
          category: "Avaliação",
          audioUrl: "#"
        }
      ];

      setNews(mockNews);
      setPodcasts(mockPodcasts);
      setIsLoading(false);
    };

    loadContent();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const togglePodcast = (podcastId: number) => {
    if (currentlyPlaying === podcastId) {
      setCurrentlyPlaying(null);
    } else {
      setCurrentlyPlaying(podcastId);
    }
  };

  const NewsSection = () => (
    <div className="space-y-6">
      {/* Featured News */}
      {news.filter(item => item.isHighlighted).map((item) => (
        <Card key={item.id} className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-blue-600 text-white">Destaque</Badge>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">{item.title}</h2>
                <p className="text-slate-700 mb-4 leading-relaxed">{item.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>Por {item.author}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(item.publishedAt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Compartilhar
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                      <BookOpen className="h-4 w-4" />
                      Ler Mais
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Regular News */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.filter(item => !item.isHighlighted).map((item) => (
          <Card key={item.id} className="border border-slate-200 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{item.category}</Badge>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {item.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-3">{item.summary}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.publishedAt)}
                  </div>
                  <span>Por {item.author}</span>
                </div>
                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Ler
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const PodcastSection = () => (
    <div className="space-y-6">
      {podcasts.map((podcast) => (
        <Card key={podcast.id} className="border border-slate-200 hover:shadow-lg transition-all duration-300 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Headphones className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{podcast.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-slate-500">
                    <Clock className="h-3 w-3" />
                    {podcast.duration}
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">{podcast.title}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{podcast.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="h-3 w-3" />
                    {formatDate(podcast.publishedAt)}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                      onClick={() => togglePodcast(podcast.id)}
                    >
                      {currentlyPlaying === podcast.id ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pausar
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Reproduzir
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Notícias e Podcasts - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/professor/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Notícias e Podcasts</h1>
            <p className="text-slate-600">Mantenha-se atualizado com as últimas novidades em educação e tecnologia</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8">
            <Button
              variant={activeTab === 'news' ? 'default' : 'outline'}
              onClick={() => setActiveTab('news')}
              className={`gap-2 ${activeTab === 'news' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
            >
              <Newspaper className="h-4 w-4" />
              Notícias
            </Button>
            <Button
              variant={activeTab === 'podcasts' ? 'default' : 'outline'}
              onClick={() => setActiveTab('podcasts')}
              className={`gap-2 ${activeTab === 'podcasts' ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
            >
              <PlayCircle className="h-4 w-4" />
              Podcasts
            </Button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border border-slate-200 rounded-xl">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-1/4 mb-3"></div>
                      <div className="h-6 bg-slate-200 rounded mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'news' && <NewsSection />}
              {activeTab === 'podcasts' && <PodcastSection />}
            </>
          )}
        </div>
      </div>
    </>
  );
}