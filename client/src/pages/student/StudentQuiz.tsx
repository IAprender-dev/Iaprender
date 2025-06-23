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
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

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

      if (!response.ok) {
        throw new Error('Erro ao gerar quiz');
      }

      const data = await response.json();
      
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
      } else {
        throw new Error('Nenhuma pergunta foi gerada');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Erro ao gerar quiz",
        description: "Tente novamente com um tema diferente",
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

        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Link href="/student">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                    Quiz Educativo
                  </h1>
                  <p className="text-slate-600">Teste seus conhecimentos com perguntas geradas por IA</p>
                </div>
              </div>
            </div>

            {/* Quiz Configuration */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  Criar Novo Quiz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-base font-bold text-slate-700">Tema do Quiz</Label>
                    <Input
                      placeholder="Ex: Matemática básica, História do Brasil, Ciências..."
                      value={quizConfig.topic}
                      onChange={(e) => setQuizConfig({...quizConfig, topic: e.target.value})}
                      className="h-12 bg-white border-slate-300 focus:border-purple-500 focus:ring-purple-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-bold text-slate-700">Número de Perguntas</Label>
                    <Select value={quizConfig.questionCount.toString()} onValueChange={(value) => setQuizConfig({...quizConfig, questionCount: parseInt(value)})}>
                      <SelectTrigger className="h-12 bg-white border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 perguntas</SelectItem>
                        <SelectItem value="5">5 perguntas</SelectItem>
                        <SelectItem value="10">10 perguntas</SelectItem>
                        <SelectItem value="15">15 perguntas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-base font-bold text-slate-700">Nível de Dificuldade</Label>
                    <Select value={quizConfig.difficulty} onValueChange={(value) => setQuizConfig({...quizConfig, difficulty: value})}>
                      <SelectTrigger className="h-12 bg-white border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Fácil</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="hard">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={generateQuiz}
                      disabled={isGenerating || !quizConfig.topic.trim()}
                      className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                          Gerando Quiz...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Gerar Quiz
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

        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Concluído!</h2>
                  <p className="text-slate-600">Confira seu desempenho</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="p-6 text-center">
                      <Target className="h-8 w-8 text-green-600 mx-auto mb-3" />
                      <div className={`text-3xl font-bold mb-1 ${getScoreColor(percentage)}`}>
                        {quizSession.score}/{quizSession.questions.length}
                      </div>
                      <div className="text-sm text-slate-600">Acertos</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-6 text-center">
                      <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <div className={`text-3xl font-bold mb-1 ${getScoreColor(percentage)}`}>
                        {percentage}%
                      </div>
                      <div className="text-sm text-slate-600">Aproveitamento</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                    <CardContent className="p-6 text-center">
                      <Clock className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm text-slate-600">Tempo</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Feedback</h3>
                  <p className="text-slate-700">{getScoreMessage(percentage)}</p>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={resetQuiz}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Novo Quiz
                  </Button>
                  <Link href="/student">
                    <Button variant="outline" className="px-8">
                      <Home className="h-5 w-5 mr-2" />
                      Dashboard
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

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2">
                  <Book className="h-4 w-4 mr-1" />
                  {quizConfig.topic}
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
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
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`${
                    currentQ.difficulty === 'easy' ? 'bg-green-100 text-green-700 border-green-200' :
                    currentQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {currentQ.difficulty === 'easy' ? 'Fácil' : 
                     currentQ.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 leading-relaxed">
                  {currentQ.question}
                </h2>
              </div>

              <div className="space-y-4 mb-8">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !showExplanation && setSelectedAnswer(index)}
                    disabled={showExplanation}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                      showExplanation
                        ? index === currentQ.correctAnswer
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : index === selectedAnswer && index !== currentQ.correctAnswer
                          ? 'border-red-500 bg-red-50 text-red-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                        : selectedAnswer === index
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-slate-300 bg-white hover:border-purple-300 hover:bg-purple-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        showExplanation
                          ? index === currentQ.correctAnswer
                            ? 'bg-green-500 text-white'
                            : index === selectedAnswer && index !== currentQ.correctAnswer
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-300 text-slate-600'
                          : selectedAnswer === index
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="font-medium">{option}</span>
                      {showExplanation && index === currentQ.correctAnswer && (
                        <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                      )}
                      {showExplanation && index === selectedAnswer && index !== currentQ.correctAnswer && (
                        <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {showExplanation && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    Explicação
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{currentQ.explanation}</p>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetQuiz}
                  className="border-slate-300 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar
                </Button>

                {showExplanation ? (
                  <Button
                    onClick={nextQuestion}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    {quizSession.currentQuestion + 1 >= quizSession.questions.length ? (
                      <>
                        <Trophy className="h-4 w-4 mr-2" />
                        Ver Resultado
                      </>
                    ) : (
                      <>
                        Próxima Pergunta
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
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