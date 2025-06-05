import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, 
  Star, 
  Heart, 
  Zap, 
  Shield, 
  Sword, 
  ArrowLeft,
  Sparkles,
  Eye,
  Filter,
  Grid3X3,
  List,
  Shuffle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";

interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  types: Array<{
    type: {
      name: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
  height: number;
  weight: number;
  abilities: Array<{
    ability: {
      name: string;
    };
  }>;
}

interface PokemonListItem {
  name: string;
  url: string;
}

const typeColors: Record<string, string> = {
  normal: "bg-gray-400",
  fire: "bg-red-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-blue-300",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-yellow-600",
  flying: "bg-indigo-400",
  psychic: "bg-pink-500",
  bug: "bg-green-400",
  rock: "bg-yellow-800",
  ghost: "bg-purple-700",
  dragon: "bg-indigo-700",
  dark: "bg-gray-800",
  steel: "bg-gray-500",
  fairy: "bg-pink-300"
};

export default function PokemonExplorer() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [favoritePokemons, setFavoritePokemons] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Fetch Pokemon list
  const { data: pokemonList, isLoading: isListLoading } = useQuery({
    queryKey: ["/api/pokemon/list"],
    queryFn: async () => {
      const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
      const data = await response.json();
      return data.results as PokemonListItem[];
    },
  });

  // Fetch individual Pokemon details
  const { data: pokemonDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["/api/pokemon/details", selectedPokemon?.id],
    queryFn: async () => {
      if (!selectedPokemon) return null;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${selectedPokemon.id}`);
      return await response.json() as Pokemon;
    },
    enabled: !!selectedPokemon,
  });

  // Fetch Pokemon for grid view
  const { data: pokemonGridData, isLoading: isGridLoading } = useQuery({
    queryKey: ["/api/pokemon/grid"],
    queryFn: async () => {
      if (!pokemonList) return [];
      
      const pokemonPromises = pokemonList.slice(0, 20).map(async (pokemon) => {
        const id = pokemon.url.split('/').slice(-2, -1)[0];
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        return await response.json() as Pokemon;
      });
      
      return await Promise.all(pokemonPromises);
    },
    enabled: !!pokemonList,
  });

  const getRandomPokemon = async () => {
    const randomId = Math.floor(Math.random() * 151) + 1;
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const pokemon = await response.json() as Pokemon;
    setSelectedPokemon(pokemon);
  };

  const toggleFavorite = (pokemonId: number) => {
    setFavoritePokemons(prev => 
      prev.includes(pokemonId)
        ? prev.filter(id => id !== pokemonId)
        : [...prev, pokemonId]
    );
  };

  const filteredPokemon = pokemonGridData?.filter(pokemon => {
    const matchesSearch = pokemon.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || pokemon.types.some(type => type.type.name === selectedType);
    return matchesSearch && matchesType;
  });

  const getStatColor = (statName: string) => {
    switch (statName) {
      case "hp": return "bg-green-500";
      case "attack": return "bg-red-500";
      case "defense": return "bg-blue-500";
      case "special-attack": return "bg-purple-500";
      case "special-defense": return "bg-yellow-500";
      case "speed": return "bg-pink-500";
      default: return "bg-gray-500";
    }
  };

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case "hp": return <Heart className="h-4 w-4" />;
      case "attack": return <Sword className="h-4 w-4" />;
      case "defense": return <Shield className="h-4 w-4" />;
      case "special-attack": return <Zap className="h-4 w-4" />;
      case "special-defense": return <Star className="h-4 w-4" />;
      case "speed": return <Sparkles className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Explorador Pokémon - IAverse</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Explorador Pokémon
                </h1>
                <p className="text-slate-600">Descubra e aprenda sobre os Pokémon</p>
              </div>
            </div>
            
            <Button 
              onClick={getRandomPokemon}
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Shuffle className="h-4 w-4" />
              Pokémon Aleatório
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pokemon List/Grid */}
            <div className="lg:col-span-2">
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-slate-900">Lista de Pokémon</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Buscar Pokémon..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-slate-200"
                      />
                    </div>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        {Object.keys(typeColors).map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                <CardContent>
                  {isGridLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-xl"></div>
                      ))}
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {filteredPokemon?.map((pokemon) => (
                        <Card 
                          key={pokemon.id}
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-blue-300 group"
                          onClick={() => setSelectedPokemon(pokemon)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="relative mb-3">
                              <img
                                src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
                                alt={pokemon.name}
                                className="w-20 h-20 mx-auto group-hover:scale-110 transition-transform duration-200"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-0 right-0 p-1 h-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(pokemon.id);
                                }}
                              >
                                <Heart 
                                  className={`h-4 w-4 ${
                                    favoritePokemons.includes(pokemon.id) 
                                      ? "fill-red-500 text-red-500" 
                                      : "text-slate-400"
                                  }`} 
                                />
                              </Button>
                            </div>
                            <h3 className="font-semibold text-slate-900 capitalize mb-2">
                              {pokemon.name}
                            </h3>
                            <div className="flex gap-1 justify-center">
                              {pokemon.types.map((type) => (
                                <Badge 
                                  key={type.type.name}
                                  className={`${typeColors[type.type.name]} text-white text-xs px-2 py-1`}
                                >
                                  {type.type.name}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredPokemon?.map((pokemon) => (
                        <Card 
                          key={pokemon.id}
                          className="cursor-pointer hover:shadow-md transition-all duration-200 border-slate-200 hover:border-blue-300"
                          onClick={() => setSelectedPokemon(pokemon)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={pokemon.sprites.front_default}
                                alt={pokemon.name}
                                className="w-16 h-16"
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 capitalize">
                                  {pokemon.name}
                                </h3>
                                <div className="flex gap-2 mt-1">
                                  {pokemon.types.map((type) => (
                                    <Badge 
                                      key={type.type.name}
                                      className={`${typeColors[type.type.name]} text-white text-xs`}
                                    >
                                      {type.type.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(pokemon.id);
                                }}
                              >
                                <Heart 
                                  className={`h-5 w-5 ${
                                    favoritePokemons.includes(pokemon.id) 
                                      ? "fill-red-500 text-red-500" 
                                      : "text-slate-400"
                                  }`} 
                                />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pokemon Details */}
            <div className="lg:col-span-1">
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl sticky top-4">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Detalhes do Pokémon
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {selectedPokemon ? (
                    <div className="space-y-6">
                      {/* Pokemon Image and Basic Info */}
                      <div className="text-center">
                        <div className="relative mb-4">
                          <img
                            src={selectedPokemon.sprites.other['official-artwork'].front_default || selectedPokemon.sprites.front_default}
                            alt={selectedPokemon.name}
                            className="w-32 h-32 mx-auto"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-0 right-0"
                            onClick={() => toggleFavorite(selectedPokemon.id)}
                          >
                            <Heart 
                              className={`h-6 w-6 ${
                                favoritePokemons.includes(selectedPokemon.id) 
                                  ? "fill-red-500 text-red-500" 
                                  : "text-slate-400"
                              }`} 
                            />
                          </Button>
                        </div>
                        
                        <h2 className="text-2xl font-bold text-slate-900 capitalize mb-2">
                          {selectedPokemon.name}
                        </h2>
                        
                        <div className="flex gap-2 justify-center mb-4">
                          {selectedPokemon.types.map((type) => (
                            <Badge 
                              key={type.type.name}
                              className={`${typeColors[type.type.name]} text-white`}
                            >
                              {type.type.name}
                            </Badge>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-slate-600">Altura</p>
                            <p className="font-semibold">{selectedPokemon.height / 10} m</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <p className="text-slate-600">Peso</p>
                            <p className="font-semibold">{selectedPokemon.weight / 10} kg</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Stats */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Estatísticas</h3>
                        <div className="space-y-3">
                          {selectedPokemon.stats.map((stat) => (
                            <div key={stat.stat.name}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <div className="flex items-center gap-2">
                                  {getStatIcon(stat.stat.name)}
                                  <span className="capitalize text-slate-700">
                                    {stat.stat.name.replace('-', ' ')}
                                  </span>
                                </div>
                                <span className="font-medium">{stat.base_stat}</span>
                              </div>
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${getStatColor(stat.stat.name)} transition-all duration-500`}
                                  style={{ width: `${(stat.base_stat / 150) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Abilities */}
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Habilidades</h3>
                        <div className="space-y-2">
                          {selectedPokemon.abilities.map((ability, index) => (
                            <Badge 
                              key={index}
                              variant="outline" 
                              className="capitalize"
                            >
                              {ability.ability.name.replace('-', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600">
                        Selecione um Pokémon para ver os detalhes
                      </p>
                      <Button 
                        onClick={getRandomPokemon}
                        className="mt-4 gap-2"
                        variant="outline"
                      >
                        <Shuffle className="h-4 w-4" />
                        Pokémon Aleatório
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}