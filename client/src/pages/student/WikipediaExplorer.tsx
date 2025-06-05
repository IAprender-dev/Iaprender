import { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  BookOpen, 
  ExternalLink, 
  ArrowLeft,
  Globe,
  Info,
  Clock,
  Eye,
  Bookmark,
  Share2,
  Languages,
  Lightbulb
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

interface WikipediaSearchResult {
  pageid: number;
  title: string;
  snippet: string;
  timestamp: string;
}

interface WikipediaPage {
  pageid: number;
  title: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  pageimage?: string;
}

interface WikipediaSearchResponse {
  query: {
    search: WikipediaSearchResult[];
  };
}

interface WikipediaPageResponse {
  query: {
    pages: Record<string, WikipediaPage>;
  };
}

export default function WikipediaExplorer() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPage, setSelectedPage] = useState<WikipediaPage | null>(null);
  const [savedArticles, setSavedArticles] = useState<number[]>([]);

  // Search Wikipedia articles
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ["/api/wikipedia/search", searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      
      const searchParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: searchTerm,
        srlimit: '10',
        origin: '*'
      });
      
      const response = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`);
      
      if (response.ok) {
        const data = await response.json();
        return [data];
      }
      
      // Fallback to search API
      const searchResponse = await fetch(`https://pt.wikipedia.org/w/api.php?${searchParams}`);
      const searchData = await searchResponse.json() as WikipediaSearchResponse;
      return searchData.query?.search || [];
    },
    enabled: !!searchTerm.trim(),
  });

  // Get article details
  const { data: articleDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["/api/wikipedia/page", selectedPage?.title],
    queryFn: async () => {
      if (!selectedPage?.title) return null;
      
      const response = await fetch(
        `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selectedPage.title)}`
      );
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    },
    enabled: !!selectedPage?.title,
  });

  // Featured articles query
  const { data: featuredArticles } = useQuery({
    queryKey: ["/api/wikipedia/featured"],
    queryFn: async () => {
      const topics = ['Inteligência Artificial', 'Ciência', 'História do Brasil', 'Matemática', 'Física'];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      
      const response = await fetch(
        `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(randomTopic)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return [data];
      }
      
      return [];
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Search is triggered by the query when searchTerm changes
    }
  };

  const selectArticle = (title: string) => {
    setSelectedPage({ title } as WikipediaPage);
  };

  const toggleSaveArticle = (pageId: number) => {
    setSavedArticles(prev => 
      prev.includes(pageId)
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    );
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  return (
    <>
      <Helmet>
        <title>Explorador Wikipedia - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Explorador Wikipedia
                </h1>
                <p className="text-slate-700">Explore o conhecimento mundial</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Globe className="h-4 w-4" />
              <span>Wikipedia em Português</span>
            </div>
          </div>

          {/* Search Section */}
          <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl mb-8 border border-blue-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Buscar Artigos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-4">
                <Input
                  placeholder="Digite um tópico para pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border-blue-200 focus:border-blue-400 focus:ring-blue-100"
                />
                <Button 
                  type="submit"
                  className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-sm"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Search Results */}
            <div className="lg:col-span-2">
              <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border border-blue-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-slate-800">
                    {searchTerm ? `Resultados para "${searchTerm}"` : 'Artigos em Destaque'}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {isSearchLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(searchTerm ? searchResults : featuredArticles)?.map((article: any, index: number) => (
                        <Card 
                          key={article.pageid || index}
                          className="cursor-pointer hover:shadow-md transition-all duration-200 border-blue-100 hover:border-blue-300 bg-white/95"
                          onClick={() => selectArticle(article.title)}
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {article.thumbnail && (
                                <img
                                  src={article.thumbnail.source}
                                  alt={article.title}
                                  className="w-16 h-16 rounded-lg object-cover border border-blue-100"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">
                                  {article.title}
                                </h3>
                                <p className="text-sm text-slate-600 line-clamp-3">
                                  {stripHtml(article.extract || article.snippet || article.description || '')}
                                </p>
                                <div className="flex items-center gap-4 mt-3">
                                  {article.timestamp && (
                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                      <Clock className="h-3 w-3 text-blue-500" />
                                      {formatDate(article.timestamp)}
                                    </div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-blue-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (article.pageid) {
                                        toggleSaveArticle(article.pageid);
                                      }
                                    }}
                                  >
                                    <Bookmark 
                                      className={`h-4 w-4 ${
                                        article.pageid && savedArticles.includes(article.pageid)
                                          ? "fill-blue-500 text-blue-500" 
                                          : "text-slate-400 hover:text-blue-500"
                                      }`} 
                                    />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {searchTerm && (!searchResults || searchResults.length === 0) && (
                        <div className="text-center py-8">
                          <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-600">Nenhum resultado encontrado</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Tente usar palavras-chave diferentes
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Article Details */}
            <div className="lg:col-span-1">
              <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-md rounded-2xl sticky top-4 border border-blue-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    Detalhes do Artigo
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {selectedPage && articleDetails ? (
                    <div className="space-y-6">
                      {/* Article Image */}
                      {articleDetails.thumbnail && (
                        <div className="text-center">
                          <img
                            src={articleDetails.thumbnail.source}
                            alt={articleDetails.title}
                            className="w-full h-48 object-cover rounded-xl"
                          />
                        </div>
                      )}
                      
                      {/* Article Title */}
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">
                          {articleDetails.title}
                        </h2>
                        {articleDetails.description && (
                          <p className="text-sm text-slate-600 italic">
                            {articleDetails.description}
                          </p>
                        )}
                      </div>

                      <Separator className="bg-blue-100" />

                      {/* Article Extract */}
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Resumo</h3>
                        <ScrollArea className="h-48">
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {articleDetails.extract}
                          </p>
                        </ScrollArea>
                      </div>

                      <Separator className="bg-blue-100" />

                      {/* Actions */}
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                          onClick={() => window.open(articleDetails.content_urls?.desktop?.page, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Ver no Wikipedia
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                          onClick={() => {
                            if (articleDetails.pageid) {
                              toggleSaveArticle(articleDetails.pageid);
                            }
                          }}
                        >
                          <Bookmark 
                            className={`h-4 w-4 ${
                              articleDetails.pageid && savedArticles.includes(articleDetails.pageid)
                                ? "fill-blue-500 text-blue-500" 
                                : "text-slate-500"
                            }`} 
                          />
                          {articleDetails.pageid && savedArticles.includes(articleDetails.pageid) 
                            ? 'Remover dos Salvos' 
                            : 'Salvar Artigo'
                          }
                        </Button>
                      </div>

                      {/* Article Info */}
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                        {articleDetails.lang && (
                          <div className="flex items-center gap-1">
                            <Languages className="h-3 w-3" />
                            <span>Idioma: {articleDetails.lang}</span>
                          </div>
                        )}
                        {articleDetails.timestamp && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(articleDetails.timestamp)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 mb-4">
                        Selecione um artigo para ver os detalhes
                      </p>
                      <div className="space-y-2">
                        <Badge variant="default" className="text-xs">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          Dica: Busque por temas educacionais
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Saved Articles Count */}
              {savedArticles.length > 0 && (
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 backdrop-blur-sm shadow-lg rounded-2xl mt-4">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
                      <Bookmark className="h-4 w-4 fill-blue-500" />
                      <span>{savedArticles.length} artigo(s) salvos</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}