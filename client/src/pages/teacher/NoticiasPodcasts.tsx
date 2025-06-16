import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet";
import aiverseLogo from "@assets/Design sem nome (5).png";
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

  // Garantir que a página sempre inicie no topo com animação suave
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ 
        top: 0, 
        left: 0, 
        behavior: 'smooth' 
      });
    };
    
    scrollToTop();
    
    // Também rolar para o topo quando trocar de aba
    if (activeTab) {
      setTimeout(scrollToTop, 100);
    }
  }, [activeTab]);

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
    <div className="space-y-8">
      {/* Featured News */}
      {news.filter(item => item.isHighlighted).map((item) => (
        <Card key={item.id} className="border-0 bg-white shadow-lg hover:shadow-xl rounded-3xl overflow-hidden transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Newspaper className="h-10 w-10 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-blue-600 text-white px-3 py-1 rounded-full">✨ Destaque</Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 rounded-full">{item.category}</Badge>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight">{item.title}</h2>
                <p className="text-slate-700 mb-6 leading-relaxed text-lg">{item.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="font-medium">Por {item.author}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      {formatDate(item.publishedAt)}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button size="sm" variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50">
                      <Share2 className="h-4 w-4" />
                      Compartilhar
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6">
                      <BookOpen className="h-4 w-4" />
                      Ler Artigo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Regular News */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.filter(item => !item.isHighlighted).map((item) => (
          <Card key={item.id} className="border-0 bg-white hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300">
                <Newspaper className="h-6 w-6 text-slate-600 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 rounded-full px-3 py-1">{item.category}</Badge>
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">
                {item.title}
              </h3>
              <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">{item.summary}</p>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3 w-3 text-blue-500" />
                    {formatDate(item.publishedAt)}
                  </div>
                  <span className="font-medium">Por {item.author}</span>
                </div>
                <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 rounded-full">
                  <ExternalLink className="h-4 w-4" />
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
        <Card key={podcast.id} className="border-0 bg-white hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:from-purple-200 group-hover:to-indigo-200 transition-all duration-300">
                <Headphones className="h-10 w-10 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 rounded-full px-3 py-1">{podcast.category}</Badge>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{podcast.duration}</span>
                  </div>
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-3 group-hover:text-purple-600 transition-colors leading-tight">{podcast.title}</h3>
                <p className="text-slate-600 mb-4 line-clamp-2 leading-relaxed">{podcast.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{formatDate(podcast.publishedAt)}</span>
                  </div>
                  <div className="flex gap-3">
                    <Button size="sm" variant="outline" className="gap-2 border-slate-300 hover:bg-slate-50 rounded-full">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-2 px-6 rounded-full"
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

      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50/30">
        <div className="container mx-auto px-6 pt-4 pb-8 max-w-7xl">
          {/* Header with Logo and Back Button */}
          <div className="flex items-center gap-6 mb-6">
            {/* Back Button - moved to left */}
            <Link href="/professor/dashboard">
              <Button size="sm" className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            
            <div className="flex items-center gap-3">
              <img src={aiverseLogo} alt="AIverse" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Notícias do Universo</h1>
                <p className="text-gray-600 text-sm md:text-base">Mantenha-se atualizado com as últimas novidades em IA e educação</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-3 mb-6">
            <Button
              variant={activeTab === 'news' ? 'default' : 'outline'}
              onClick={() => setActiveTab('news')}
              className={`gap-2 h-10 px-5 rounded-lg font-medium ${
                activeTab === 'news' 
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg' 
                  : 'border-orange-300 text-orange-700 hover:bg-orange-50'
              }`}
            >
              <Newspaper className="h-4 w-4" />
              Notícias IA
            </Button>
            <Button
              onClick={() => setActiveTab('podcasts')}
              className={`gap-2 h-10 px-5 rounded-lg font-medium ${
                activeTab === 'podcasts' 
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg border-0' 
                  : 'border border-red-300 text-red-700 hover:bg-red-50 bg-white'
              }`}
            >
              <Headphones className={`h-4 w-4 ${activeTab === 'podcasts' ? 'text-white' : 'text-red-700'}`} />
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