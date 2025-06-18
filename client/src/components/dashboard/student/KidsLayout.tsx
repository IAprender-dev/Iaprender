import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BookOpen, Palette, Music, Calculator, Globe, Star, Heart, Smile } from "lucide-react";

interface KidsLayoutProps {
  userName: string;
  children?: React.ReactNode;
}

export function KidsLayout({ userName, children }: KidsLayoutProps) {
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return "Bom dia";
    if (currentHour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const subjects = [
    {
      id: 1,
      name: "Português",
      icon: "📚",
      color: "from-pink-400 to-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      hoverColor: "hover:bg-pink-100",
      description: "Vamos aprender a ler e escrever!"
    },
    {
      id: 2,
      name: "Matemática",
      icon: "🔢",
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      hoverColor: "hover:bg-blue-100",
      description: "Números são divertidos!"
    },
    {
      id: 3,
      name: "Ciências",
      icon: "🔬",
      color: "from-green-400 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      hoverColor: "hover:bg-green-100",
      description: "Vamos descobrir o mundo!"
    },
    {
      id: 4,
      name: "Artes",
      icon: "🎨",
      color: "from-purple-400 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      hoverColor: "hover:bg-purple-100",
      description: "Criatividade em ação!"
    },
    {
      id: 5,
      name: "Educação Física",
      icon: "⚽",
      color: "from-orange-400 to-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      hoverColor: "hover:bg-orange-100",
      description: "Vamos nos exercitar!"
    },
    {
      id: 6,
      name: "Geografia",
      icon: "🌍",
      color: "from-teal-400 to-teal-600",
      bgColor: "bg-teal-50",
      borderColor: "border-teal-200",
      hoverColor: "hover:bg-teal-100",
      description: "Explorando nosso planeta!"
    }
  ];

  const achievements = [
    { icon: "🌟", name: "Primeira Lição", color: "text-yellow-500" },
    { icon: "📖", name: "Leitor Iniciante", color: "text-pink-500" },
    { icon: "🧮", name: "Contador Expert", color: "text-blue-500" },
    { icon: "🎯", name: "Foco Total", color: "text-green-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl animate-bounce animation-delay-1000">🌈</div>
        <div className="absolute top-40 right-20 text-5xl animate-pulse animation-delay-2000">⭐</div>
        <div className="absolute bottom-20 left-20 text-4xl animate-bounce animation-delay-3000">🦋</div>
        <div className="absolute bottom-40 right-10 text-5xl animate-pulse animation-delay-4000">🌻</div>
        <div className="absolute top-1/2 left-1/3 text-3xl animate-spin animation-delay-5000" style={{animationDuration: '10s'}}>🎪</div>
        <div className="absolute top-1/3 right-1/3 text-4xl animate-bounce animation-delay-6000">🎈</div>
      </div>

      <div className="relative z-10 p-4 lg:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2 animate-pulse">
              {getGreeting()}, {userName}! 🌟
            </h1>
            <p className="text-xl lg:text-2xl font-bold text-slate-700 mb-4">
              Pronto para uma nova aventura de aprendizado?
            </p>
            <div className="flex justify-center items-center gap-2 text-lg">
              <span className="animate-bounce">🎒</span>
              <span className="font-semibold text-slate-600">Vamos estudar e se divertir!</span>
              <span className="animate-bounce animation-delay-500">📝</span>
            </div>
          </div>
        </div>

        {/* Quick Stats - Kid Friendly */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-4 border-pink-300 bg-gradient-to-br from-pink-100 to-pink-200 hover:scale-105 transition-transform shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-2xl font-black text-pink-700">5</div>
              <div className="text-sm font-bold text-pink-600">Conquistas</div>
            </CardContent>
          </Card>

          <Card className="border-4 border-blue-300 bg-gradient-to-br from-blue-100 to-blue-200 hover:scale-105 transition-transform shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-4xl mb-2">📚</div>
              <div className="text-2xl font-black text-blue-700">12</div>
              <div className="text-sm font-bold text-blue-600">Lições</div>
            </CardContent>
          </Card>

          <Card className="border-4 border-green-300 bg-gradient-to-br from-green-100 to-green-200 hover:scale-105 transition-transform shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-2xl font-black text-green-700">8</div>
              <div className="text-sm font-bold text-green-600">Estrelas</div>
            </CardContent>
          </Card>

          <Card className="border-4 border-purple-300 bg-gradient-to-br from-purple-100 to-purple-200 hover:scale-105 transition-transform shadow-lg">
            <CardContent className="p-4 text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-2xl font-black text-purple-700">3</div>
              <div className="text-sm font-bold text-purple-600">Metas</div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Cards */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-center mb-6 text-slate-800">
            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              🎪 Escolha sua aventura! 🎪
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Card 
                key={subject.id} 
                className={`group cursor-pointer border-4 ${subject.borderColor} ${subject.bgColor} hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:rotate-1`}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-4 group-hover:animate-bounce">
                    {subject.icon}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">
                    {subject.name}
                  </h3>
                  <p className="text-sm font-semibold text-slate-600 mb-4">
                    {subject.description}
                  </p>
                  <Button 
                    className={`w-full bg-gradient-to-r ${subject.color} text-white font-bold py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-lg`}
                  >
                    Vamos lá! 🚀
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-center mb-6 text-slate-800">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              🏆 Suas Conquistas! 🏆
            </span>
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <Card 
                key={index}
                className="border-4 border-yellow-300 bg-gradient-to-br from-yellow-100 to-orange-100 hover:scale-105 transition-transform shadow-lg"
              >
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2 animate-pulse">{achievement.icon}</div>
                  <div className="text-sm font-bold text-slate-700">{achievement.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Assistant Section */}
        <div className="mb-8">
          <Card className="border-4 border-indigo-300 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="text-8xl mb-4 animate-bounce">🤖</div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Seu Amigo Robô está aqui! 
              </h2>
              <p className="text-lg font-semibold text-slate-700 mb-6">
                Oi! Eu sou sua assistente virtual e estou aqui para te ajudar a aprender de forma divertida! 
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/central-ia">
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-lg">
                    💬 Conversar com o Robô
                  </Button>
                </Link>
                <Link href="/aluno/tutor-voz">
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all text-lg">
                    🎤 Falar com o Robô
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fun Activities */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-center mb-6 text-slate-800">
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              🎮 Atividades Divertidas! 🎮
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-4 border-pink-300 bg-gradient-to-br from-pink-100 to-red-100 hover:scale-105 transition-transform shadow-lg cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4 animate-spin" style={{animationDuration: '3s'}}>🎨</div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Desenho Mágico</h3>
                <p className="text-sm font-semibold text-slate-600">Crie desenhos incríveis!</p>
              </CardContent>
            </Card>

            <Card className="border-4 border-blue-300 bg-gradient-to-br from-blue-100 to-cyan-100 hover:scale-105 transition-transform shadow-lg cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4 animate-bounce">🧩</div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Quebra-Cabeças</h3>
                <p className="text-sm font-semibold text-slate-600">Desafie sua mente!</p>
              </CardContent>
            </Card>

            <Card className="border-4 border-green-300 bg-gradient-to-br from-green-100 to-emerald-100 hover:scale-105 transition-transform shadow-lg cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="text-6xl mb-4 animate-pulse">🎵</div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Música Divertida</h3>
                <p className="text-sm font-semibold text-slate-600">Aprenda cantando!</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export default KidsLayout;