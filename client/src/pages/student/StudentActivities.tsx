import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, BookOpen, Trophy, Target, CheckCircle2, XCircle, RotateCcw, Lightbulb, Star, Award, Flame, Brain, Sparkles, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizResponse {
  topic: string;
  questions: Question[];
  bnccAlignment: string;
  validatedTopic: string;
}

interface GameStats {
  totalQuestions: number;
  correctAnswers: number;
  streak: number;
  maxStreak: number;
  points: number;
  level: number;
}

export default function StudentActivities() {
  const [currentTopic, setCurrentTopic] = useState('');
  const [inputTopic, setInputTopic] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    streak: 0,
    maxStreak: 0,
    points: 0,
    level: 1
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const { toast } = useToast();

  // Exemplos de temas para ajudar o aluno
  const topicExamples = [
    "Verbos no presente", "Frações", "Sistema solar", "Fotossíntese", 
    "História do Brasil", "Geometria básica", "Inglês básico", 
    "Educação física", "Arte moderna", "Meio ambiente"
  ];

  const generateQuestionMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await apiRequest('POST', '/api/ai/generate-quiz', {
        topic,
        questionCount: 1,
        validateTopic: true
      });
      return await response.json();
    },
    onSuccess: (data: QuizResponse) => {
      if (data.questions && data.questions.length > 0) {
        setCurrentQuestion(data.questions[0]);
        setCurrentTopic(data.validatedTopic || data.topic);
        setSelectedAnswer(null);
        setShowExplanation(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao gerar pergunta",
        description: error.message || "Tente novamente com outro tema",
        variant: "destructive",
      });
    }
  });

  const handleTopicSubmit = () => {
    if (!inputTopic.trim()) {
      toast({
        title: "Digite um tema",
        description: "Escolha um tema para começar a estudar",
        variant: "destructive",
      });
      return;
    }
    generateQuestionMutation.mutate(inputTopic.trim());
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setLastAnswerCorrect(isCorrect);
    setShowExplanation(true);

    // Atualizar estatísticas do jogo
    setGameStats(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      const newPoints = prev.points + (isCorrect ? 10 : 0);
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      return {
        totalQuestions: prev.totalQuestions + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        points: newPoints,
        level: newLevel
      };
    });

    // Mostrar celebração para acertos
    if (isCorrect) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }

    // Feedback toast
    toast({
      title: isCorrect ? "🎉 Parabéns!" : "❌ Resposta incorreta",
      description: isCorrect ? 
        `+10 pontos! Sequência: ${gameStats.streak + 1}` :
        "Não desista! Continue tentando!",
      variant: isCorrect ? "default" : "destructive",
    });
  };

  const handleNextQuestion = () => {
    generateQuestionMutation.mutate(currentTopic);
  };

  const handleChangeTopic = () => {
    setCurrentTopic('');
    setCurrentQuestion(null);
    setInputTopic('');
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const getLevelBadge = (level: number) => {
    if (level < 3) return { icon: <Star className="h-4 w-4" />, color: "bg-gray-100 text-gray-800", name: "Iniciante" };
    if (level < 6) return { icon: <Award className="h-4 w-4" />, color: "bg-blue-100 text-blue-800", name: "Estudante" };
    if (level < 10) return { icon: <Trophy className="h-4 w-4" />, color: "bg-purple-100 text-purple-800", name: "Expert" };
    return { icon: <Sparkles className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-800", name: "Gênio" };
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 10) return "🔥";
    if (streak >= 5) return "⚡";
    if (streak >= 3) return "🌟";
    return "💪";
  };

  // Tela inicial - escolha do tema
  if (!currentTopic || (!currentQuestion && !generateQuestionMutation.isPending)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header com AIverse */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AIverse</h1>
              <p className="text-gray-600">Exercícios Inteligentes</p>
            </div>
          </div>
        </div>

        {/* Estatísticas do jogo */}
        {gameStats.totalQuestions > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{gameStats.points}</div>
                  <div className="text-sm text-gray-600">Pontos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {gameStats.streak} {getStreakEmoji(gameStats.streak)}
                  </div>
                  <div className="text-sm text-gray-600">Sequência</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {gameStats.totalQuestions > 0 ? Math.round((gameStats.correctAnswers / gameStats.totalQuestions) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Acertos</div>
                </div>
                <div className="text-center">
                  <Badge className={`${getLevelBadge(gameStats.level).color} flex items-center space-x-1`}>
                    {getLevelBadge(gameStats.level).icon}
                    <span>Nível {gameStats.level}</span>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulário de tema */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-900 flex items-center justify-center space-x-2">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
              <span>O que você quer estudar hoje?</span>
            </CardTitle>
            <p className="text-gray-600">
              Digite um tema e nossa IA criará perguntas personalizadas para você!
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input do tema */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-base font-medium">
                Digite seu tema de estudo:
              </Label>
              <Input
                id="topic"
                value={inputTopic}
                onChange={(e) => setInputTopic(e.target.value)}
                placeholder="Ex: Verbos no presente, Frações, Sistema solar..."
                className="text-lg p-4 border-2 border-gray-300 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleTopicSubmit()}
              />
            </div>

            {/* Botão de enviar */}
            <Button 
              onClick={handleTopicSubmit}
              disabled={generateQuestionMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg"
            >
              {generateQuestionMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Criando sua pergunta...
                </>
              ) : (
                <>
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Começar a estudar!
                </>
              )}
            </Button>

            {/* Exemplos de temas */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                💡 Exemplos de temas:
              </p>
              <div className="flex flex-wrap gap-2">
                {topicExamples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInputTopic(example)}
                    className="text-xs hover:bg-blue-50 hover:border-blue-300"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela da pergunta
  if (currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header com estatísticas */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                  📚 {currentTopic}
                </Badge>
                <Badge className={`${getLevelBadge(gameStats.level).color} flex items-center space-x-1`}>
                  {getLevelBadge(gameStats.level).icon}
                  <span>Nível {gameStats.level}</span>
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{gameStats.points} pts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{gameStats.streak} {getStreakEmoji(gameStats.streak)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pergunta */}
        <Card className="border-2 border-blue-200">
          <CardContent className="p-8 space-y-6">
            {/* Celebração */}
            {showCelebration && (
              <div className="text-center py-4 animate-bounce">
                <div className="text-4xl mb-2">🎉</div>
                <div className="text-lg font-bold text-green-600">Parabéns! Resposta correta!</div>
              </div>
            )}

            {/* Título da pergunta */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="outline" className="capitalize">
                  {currentQuestion.difficulty === 'easy' ? 'Fácil' : 
                   currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                </Badge>
                <Badge variant="outline">
                  Pergunta {gameStats.totalQuestions + 1}
                </Badge>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.question}
              </h3>
              
              {/* Opções */}
              <RadioGroup
                value={selectedAnswer?.toString() || ""}
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                disabled={showExplanation}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === currentQuestion.correctAnswer;
                  const shouldHighlight = showExplanation && (isSelected || isCorrect);
                  
                  return (
                    <div key={index} className={`
                      flex items-center space-x-3 p-4 rounded-lg border-2 transition-all
                      ${!showExplanation ? 'hover:bg-gray-50 cursor-pointer' : ''}
                      ${shouldHighlight && isCorrect ? 'bg-green-50 border-green-300' : ''}
                      ${shouldHighlight && !isCorrect && isSelected ? 'bg-red-50 border-red-300' : ''}
                      ${!shouldHighlight ? 'border-gray-200' : ''}
                    `}>
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                        {option}
                      </Label>
                      {showExplanation && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {showExplanation && !isCorrect && isSelected && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Explicação */}
            {showExplanation && (
              <Card className={`border-2 ${lastAnswerCorrect ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {lastAnswerCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                    ) : (
                      <Lightbulb className="h-6 w-6 text-orange-600 mt-0.5" />
                    )}
                    <div>
                      <h4 className={`font-semibold mb-2 ${lastAnswerCorrect ? 'text-green-800' : 'text-orange-800'}`}>
                        {lastAnswerCorrect ? '🎉 Parabéns! Resposta correta!' : '📚 Vamos aprender juntos!'}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {!showExplanation ? (
                <Button 
                  onClick={handleConfirmAnswer}
                  disabled={selectedAnswer === null}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Confirmar resposta
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleNextQuestion}
                    disabled={generateQuestionMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 text-lg"
                  >
                    {generateQuestionMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Criando próxima pergunta...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-5 w-5 mr-2" />
                        Próxima pergunta
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handleChangeTopic}
                    variant="outline"
                    className="flex-1 border-2 border-gray-300 py-3 text-lg"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Mudar tema
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  return (
    <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Preparando sua experiência de aprendizado...</p>
      </div>
    </div>
  );
}