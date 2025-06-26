import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Trophy,
  Clock,
  Target,
  Sparkles,
  Book,
  Home,
  ArrowLeft,
  Star,
  Zap,
  Award,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import iaprenderLogo from "@assets/IAprender_1750262542315.png";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizSession {
  questions: Question[];
  currentQuestion: number;
  answers: number[];
  score: number;
  isCompleted: boolean;
  startTime: Date;
  endTime?: Date;
}

export default function StudentQuiz() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizConfig, setQuizConfig] = useState({
    topic: "",
    questionCount: 5,
    difficulty: "medium"
  });

  const generateQuiz = async () => {
    if (!quizConfig.topic.trim()) {
      toast({
        title: "Tema obrigatório",
        description: "Digite um tema para gerar o quiz",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: quizConfig.topic,
          questionCount: quizConfig.questionCount,
          difficulty: quizConfig.difficulty,
          grade: user?.schoolYear || '9º ano'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error && data.suggestedTopics) {
          toast({
            title: "Tema não adequado para sua série",
            description: data.error,
            variant: "destructive"
          });
          return;
        }
        throw new Error(data.error || 'Erro ao gerar quiz');
      }
      
      if (data.questions && data.questions.length > 0) {
        setQuizSession({
          questions: data.questions.map((q: any, index: number) => ({
            ...q,
            id: `q${index}`
          })),
          currentQuestion: 0,
          answers: [],
          score: 0,
          isCompleted: false,
          startTime: new Date()
        });
        setSelectedAnswer(null);
        setShowExplanation(false);
        
        toast({
          title: "Quiz gerado com sucesso!",
          description: `${data.questions.length} perguntas criadas seguindo a BNCC para o ${user?.schoolYear}`,
        });
      } else {
        throw new Error('Nenhuma pergunta foi gerada');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Erro ao gerar quiz",
        description: error instanceof Error ? error.message : "Tente novamente com um tema diferente",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const submitAnswer = () => {
    if (!quizSession || selectedAnswer === null) return;

    const currentQ = quizSession.questions[quizSession.currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correctAnswer;
    
    const newAnswers = [...quizSession.answers, selectedAnswer];
    const newScore = isCorrect ? quizSession.score + 1 : quizSession.score;
    
    setQuizSession({
      ...quizSession,
      answers: newAnswers,
      score: newScore
    });
    
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (!quizSession) return;

    const nextIndex = quizSession.currentQuestion + 1;
    
    if (nextIndex >= quizSession.questions.length) {
      // Quiz completed
      setQuizSession({
        ...quizSession,
        currentQuestion: nextIndex,
        isCompleted: true,
        endTime: new Date()
      });
    } else {
      setQuizSession({
        ...quizSession,
        currentQuestion: nextIndex
      });
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const resetQuiz = () => {
    setQuizSession(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizConfig({ topic: "", questionCount: 5, difficulty: "medium" });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return "Excelente! Você domina o assunto!";
    if (percentage >= 80) return "Muito bom! Continue assim!";
    if (percentage >= 60) return "Bom trabalho! Pode melhorar ainda mais!";
    if (percentage >= 40) return "Precisa estudar mais este tema.";
    return "Recomendo revisar o conteúdo antes de tentar novamente.";
  };

  if (!quizSession) {
    return (
      <>
        <Helmet>
          <title>Quiz Educativo - IAprender</title>
        </Helmet>

        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
          {/* Header with Back Button */}
          <div className="bg-white/90 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4">
              <div className="flex items-center gap-4">
                <Link href="/student/dashboard">
                  <Button size="sm" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
                
                <div className="flex items-center gap-3">
                  <img src={iaprenderLogo} alt="IAprender" className="w-10 h-10 object-contain" />
                  <div>
                    <span className="text-xl font-bold text-gray-900">IAprender</span>
                    <div className="text-xs text-slate-500">Quiz Educativo</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto p-4 lg:p-8">

            {/* Welcome Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-100 to-teal-100 px-6 py-3 rounded-full mb-4">
                <Brain className="h-6 w-6 text-emerald-600" />
                <span className="text-emerald-800 font-semibold">Desafie seu conhecimento</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Configure seu Quiz Personalizado</h2>
              <p className="text-slate-600 text-lg">Nossa IA criará perguntas exclusivas baseadas no seu tema de interesse</p>
            </div>

            {/* Quiz Configuration */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-xl">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  Configuração do Quiz
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-3">
                    <Label className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Book className="h-5 w-5 text-emerald-600" />
                      Tema do Quiz
                    </Label>
                    <Input
                      placeholder="Digite o tema que deseja estudar..."
                      value={quizConfig.topic}
                      onChange={(e) => setQuizConfig({...quizConfig, topic: e.target.value})}
                      className="h-14 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-emerald-200 text-slate-900 text-lg placeholder:text-slate-400 rounded-xl"
                    />
                    <p className="text-sm text-slate-500">
                      Digite um tema do conteúdo programático do <strong>{user?.schoolYear}</strong> segundo a BNCC
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      ⚠️ O quiz só será gerado se o tema for adequado para sua série escolar
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-600" />
                      Perguntas
                    </Label>
                    <Select value={quizConfig.questionCount.toString()} onValueChange={(value) => setQuizConfig({...quizConfig, questionCount: parseInt(value)})}>
                      <SelectTrigger className="h-14 bg-white border-2 border-slate-200 focus:border-emerald-500 text-slate-900 text-lg rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 perguntas - Rápido</SelectItem>
                        <SelectItem value="5">5 perguntas - Padrão</SelectItem>
                        <SelectItem value="10">10 perguntas - Completo</SelectItem>
                        <SelectItem value="15">15 perguntas - Desafio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      Nível de Dificuldade
                    </Label>
                    <Select value={quizConfig.difficulty} onValueChange={(value) => setQuizConfig({...quizConfig, difficulty: value})}>
                      <SelectTrigger className="h-14 bg-white border-2 border-slate-200 focus:border-emerald-500 text-slate-900 text-lg rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">🟢 Fácil - Conceitos básicos</SelectItem>
                        <SelectItem value="medium">🟡 Médio - Conhecimento intermediário</SelectItem>
                        <SelectItem value="hard">🔴 Difícil - Nível avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={generateQuiz}
                      disabled={isGenerating || !quizConfig.topic.trim()}
                      className="w-full h-14 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                          Gerando Quiz Inteligente...
                        </>
                      ) : (
                        <>
                          <Zap className="h-6 w-6 mr-3" />
                          Gerar Quiz com IA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (quizSession.isCompleted) {
    const percentage = Math.round((quizSession.score / quizSession.questions.length) * 100);
    const duration = quizSession.endTime && quizSession.startTime 
      ? Math.round((quizSession.endTime.getTime() - quizSession.startTime.getTime()) / 1000)
      : 0;

    return (
      <>
        <Helmet>
          <title>Resultado do Quiz - IAprender</title>
        </Helmet>

        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
          {/* Header with Back Button */}
          <div className="bg-white/90 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4">
              <div className="flex items-center gap-4">
                <Link href="/student/dashboard">
                  <Button size="sm" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
                
                <div className="flex items-center gap-3">
                  <img src={iaprenderLogo} alt="IAprender" className="w-10 h-10 object-contain" />
                  <div>
                    <span className="text-xl font-bold text-gray-900">IAprender</span>
                    <div className="text-xs text-slate-500">Resultado do Quiz</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto p-4 lg:p-8">
            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardContent className="p-8 lg:p-12 text-center">
                <div className="mb-8">
                  <div className="relative inline-block mb-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                      <Trophy className="h-16 w-16 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold text-slate-900 mb-3">Quiz Concluído!</h2>
                  <p className="text-slate-600 text-lg">Veja como você se saiu neste desafio</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                  <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8 text-center">
                      <div className="p-4 bg-green-500 rounded-full w-fit mx-auto mb-4">
                        <Target className="h-10 w-10 text-white" />
                      </div>
                      <div className={`text-4xl font-bold mb-2 ${getScoreColor(percentage)}`}>
                        {quizSession.score}/{quizSession.questions.length}
                      </div>
                      <div className="text-lg font-semibold text-slate-700">Respostas Corretas</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8 text-center">
                      <div className="p-4 bg-blue-500 rounded-full w-fit mx-auto mb-4">
                        <Award className="h-10 w-10 text-white" />
                      </div>
                      <div className={`text-4xl font-bold mb-2 ${getScoreColor(percentage)}`}>
                        {percentage}%
                      </div>
                      <div className="text-lg font-semibold text-slate-700">Aproveitamento</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8 text-center">
                      <div className="p-4 bg-purple-500 rounded-full w-fit mx-auto mb-4">
                        <Clock className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-lg font-semibold text-slate-700">Tempo Total</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-8 mb-10 shadow-lg">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    Feedback do seu Desempenho
                  </h3>
                  <p className="text-slate-800 text-lg leading-relaxed">{getScoreMessage(percentage)}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button
                    onClick={resetQuiz}
                    className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <RotateCcw className="h-6 w-6 mr-3" />
                    Fazer Novo Quiz
                  </Button>
                  <Link href="/student/dashboard">
                    <Button className="px-10 py-4 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Home className="h-6 w-6 mr-3" />
                      Voltar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const currentQ = quizSession.questions[quizSession.currentQuestion];
  const progress = ((quizSession.currentQuestion + 1) / quizSession.questions.length) * 100;

  return (
    <>
      <Helmet>
        <title>Quiz em Andamento - IAprender</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        {/* Header with Back Button */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/student/dashboard">
                  <Button size="sm" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                </Link>
                
                <div className="flex items-center gap-3">
                  <img src={iaprenderLogo} alt="IAprender" className="w-10 h-10 object-contain" />
                  <div>
                    <span className="text-xl font-bold text-gray-900">IAprender</span>
                    <div className="text-xs text-slate-500">Quiz em Andamento</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Pergunta {quizSession.currentQuestion + 1} de {quizSession.questions.length}</p>
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
                      style={{width: `${progress}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 lg:p-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-2">
                  <Book className="h-4 w-4 mr-1" />
                  {quizConfig.topic}
                </Badge>
                <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                  Pergunta {quizSession.currentQuestion + 1} de {quizSession.questions.length}
                </Badge>
              </div>
              <div className="text-sm text-slate-600">
                Acertos: {quizSession.score}/{quizSession.currentQuestion}
              </div>
            </div>
            <Progress value={progress} className="h-3 bg-slate-200" />
          </div>

            {/* Question Card */}
            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardContent className="p-8 lg:p-12">
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-lg font-bold text-slate-700">
                      Pergunta {quizSession.currentQuestion + 1}
                    </span>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-relaxed">
                    {currentQ.question}
                  </h2>
                </div>

                <div className="space-y-4 mb-10">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !showExplanation && setSelectedAnswer(index)}
                      disabled={showExplanation}
                      className={`group w-full p-6 text-left rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] ${
                        showExplanation
                          ? index === currentQ.correctAnswer
                            ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900 shadow-lg shadow-green-200/50'
                            : index === selectedAnswer && index !== currentQ.correctAnswer
                            ? 'border-red-500 bg-gradient-to-r from-red-50 to-rose-50 text-red-900 shadow-lg shadow-red-200/50'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                          : selectedAnswer === index
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-lg shadow-blue-200/50'
                          : 'border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50 text-slate-900 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                          showExplanation
                            ? index === currentQ.correctAnswer
                              ? 'bg-green-500 text-white shadow-lg'
                              : index === selectedAnswer && index !== currentQ.correctAnswer
                              ? 'bg-red-500 text-white shadow-lg'
                              : 'bg-slate-300 text-slate-600'
                            : selectedAnswer === index
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-slate-200 text-slate-700 group-hover:bg-blue-500 group-hover:text-white'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="font-semibold text-lg flex-1">{option}</span>
                        {showExplanation && index === currentQ.correctAnswer && (
                          <CheckCircle className="h-6 w-6 text-green-500 animate-pulse" />
                        )}
                        {showExplanation && index === selectedAnswer && index !== currentQ.correctAnswer && (
                          <XCircle className="h-6 w-6 text-red-500 animate-pulse" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {showExplanation && (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 rounded-xl p-8 mb-8 shadow-lg">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-3 text-xl">
                      <div className="p-2 bg-emerald-500 rounded-lg">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      Explicação Detalhada
                    </h3>
                    <p className="text-slate-800 leading-relaxed text-lg">{currentQ.explanation}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <Button
                    variant="outline"
                    onClick={resetQuiz}
                    className="border-2 border-slate-300 hover:bg-slate-50 px-6 py-3 text-lg font-semibold"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Reiniciar Quiz
                  </Button>

                  {showExplanation ? (
                    <Button
                      onClick={nextQuestion}
                      className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {quizSession.currentQuestion + 1 >= quizSession.questions.length ? (
                        <>
                          <Trophy className="h-5 w-5 mr-2" />
                          Ver Resultado Final
                        </>
                      ) : (
                        <>
                          Próxima Pergunta
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={submitAnswer}
                      disabled={selectedAnswer === null}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirmar Resposta
                    </Button>
                  )}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}