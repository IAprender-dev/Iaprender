import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import StudentHeader from "@/components/dashboard/student/StudentHeader";
import StudentSidebar from "@/components/dashboard/student/StudentSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { BackButton } from "@/components/ui/back-button";
import { 
  Brain, 
  Trophy, 
  Target, 
  BookOpen, 
  Calculator, 
  Globe, 
  Microscope, 
  Palette,
  Music,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Star
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizSession {
  id: string;
  subject: string;
  topic: string;
  questions: Question[];
  currentQuestionIndex: number;
  score: number;
  answeredQuestions: number;
  userAnswers: (number | null)[];
  isCompleted: boolean;
}

export default function StudentActivities() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Quiz states
  const [currentView, setCurrentView] = useState<'subjects' | 'topics' | 'quiz' | 'results'>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // BNCC subjects based on grade level (assuming 6th grade for demo)
  const subjects = [
    { id: 'português', name: 'Português', icon: BookOpen, color: 'bg-blue-500' },
    { id: 'matemática', name: 'Matemática', icon: Calculator, color: 'bg-green-500' },
    { id: 'ciências', name: 'Ciências', icon: Microscope, color: 'bg-purple-500' },
    { id: 'história', name: 'História', icon: Globe, color: 'bg-orange-500' },
    { id: 'geografia', name: 'Geografia', icon: Globe, color: 'bg-teal-500' },
    { id: 'arte', name: 'Arte', icon: Palette, color: 'bg-pink-500' },
    { id: 'educação-física', name: 'Educação Física', icon: Target, color: 'bg-red-500' }
  ];

  const getTopicsBySubject = (subject: string) => {
    const topics: { [key: string]: string[] } = {
      'português': [
        'Interpretação de Texto',
        'Gramática e Ortografia', 
        'Produção Textual',
        'Literatura Brasileira',
        'Figuras de Linguagem'
      ],
      'matemática': [
        'Números e Operações',
        'Álgebra e Funções',
        'Geometria',
        'Estatística e Probabilidade',
        'Proporcionalidade'
      ],
      'ciências': [
        'Seres Vivos',
        'Corpo Humano',
        'Meio Ambiente',
        'Física e Química',
        'Sistema Solar'
      ],
      'história': [
        'Brasil Colonial',
        'Independência do Brasil',
        'República Brasileira',
        'História Antiga',
        'História Medieval'
      ],
      'geografia': [
        'Geografia do Brasil',
        'Clima e Relevo',
        'População e Urbanização',
        'Recursos Naturais',
        'Globalização'
      ],
      'arte': [
        'História da Arte',
        'Arte Brasileira',
        'Técnicas Artísticas',
        'Arte Contemporânea',
        'Cultura Popular'
      ],
      'educação-física': [
        'Esportes Coletivos',
        'Ginástica',
        'Dança',
        'Jogos e Brincadeiras',
        'Saúde e Bem-estar'
      ]
    };
    
    return topics[subject] || [];
  };

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async ({ subject, topic }: { subject: string; topic: string }) => {
      const response = await apiRequest('POST', '/api/ai/generate-quiz', {
        subject,
        topic,
        grade: user?.grade || 6,
        questionCount: 10
      });
      return response.json();
    },
    onSuccess: (data) => {
      const newQuizSession: QuizSession = {
        id: Date.now().toString(),
        subject: selectedSubject,
        topic: data.topic,
        questions: data.questions,
        currentQuestionIndex: 0,
        score: 0,
        answeredQuestions: 0,
        userAnswers: new Array(data.questions.length).fill(null),
        isCompleted: false
      };
      setQuizSession(newQuizSession);
      setCurrentView('quiz');
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o quiz. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentView('topics');
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    generateQuizMutation.mutate({ subject: selectedSubject, topic });
  };

  const handleCustomTopicSubmit = () => {
    if (customTopic.trim()) {
      generateQuizMutation.mutate({ subject: selectedSubject, topic: customTopic });
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizSession && !showExplanation) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleAnswerSubmit = () => {
    if (quizSession && selectedAnswer !== null) {
      const isCorrect = selectedAnswer === quizSession.questions[quizSession.currentQuestionIndex].correctAnswer;
      
      // Update quiz session
      const updatedAnswers = [...quizSession.userAnswers];
      updatedAnswers[quizSession.currentQuestionIndex] = selectedAnswer;
      
      const updatedSession = {
        ...quizSession,
        userAnswers: updatedAnswers,
        score: isCorrect ? quizSession.score + 1 : quizSession.score,
        answeredQuestions: quizSession.answeredQuestions + 1
      };
      
      setQuizSession(updatedSession);
      setShowExplanation(true);
    }
  };

  const handleNextQuestion = () => {
    if (quizSession) {
      const nextIndex = quizSession.currentQuestionIndex + 1;
      
      if (nextIndex >= quizSession.questions.length) {
        // Quiz completed
        setQuizSession({
          ...quizSession,
          isCompleted: true
        });
        setCurrentView('results');
      } else {
        // Next question
        setQuizSession({
          ...quizSession,
          currentQuestionIndex: nextIndex
        });
        setSelectedAnswer(null);
        setShowExplanation(false);
      }
    }
  };

  const handleRestartQuiz = () => {
    setQuizSession(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentView('subjects');
    setSelectedSubject('');
    setSelectedTopic('');
    setCustomTopic('');
    setShowCustomInput(false);
  };

  const getScorePercentage = () => {
    if (!quizSession) return 0;
    return Math.round((quizSession.score / quizSession.questions.length) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderSubjectSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto">
          <Brain className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exercícios com IA</h1>
          <p className="text-gray-600 mt-2">Escolha uma matéria para praticar com exercícios personalizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => {
          const IconComponent = subject.icon;
          return (
            <Card 
              key={subject.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
              onClick={() => handleSubjectSelect(subject.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${subject.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <p className="text-sm text-gray-500">Exercícios BNCC</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderTopicSelection = () => {
    const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
    const topics = getTopicsBySubject(selectedSubject);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('subjects')}
            className="gap-3 h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Voltar
          </Button>
          <div className="flex items-center space-x-3">
            {selectedSubjectData && (
              <>
                <div className={`w-10 h-10 ${selectedSubjectData.color} rounded-lg flex items-center justify-center`}>
                  <selectedSubjectData.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{selectedSubjectData.name}</h1>
                  <p className="text-sm text-gray-600">Escolha um tópico para praticar</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((topic, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200"
              onClick={() => handleTopicSelect(topic)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{topic}</h3>
                    <p className="text-sm text-gray-500">10 questões</p>
                  </div>
                  <Play className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Custom Topic Option */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-blue-300 transition-colors">
            <CardContent className="p-4">
              {!showCustomInput ? (
                <div 
                  className="flex items-center justify-center h-full cursor-pointer"
                  onClick={() => setShowCustomInput(true)}
                >
                  <div className="text-center">
                    <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Tópico específico</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Digite um tópico específico..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleCustomTopicSubmit} disabled={!customTopic.trim()}>
                      Iniciar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowCustomInput(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {generateQuizMutation.isPending && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-gray-600">Gerando exercícios personalizados...</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderQuiz = () => {
    if (!quizSession) return null;

    const currentQuestion = quizSession.questions[quizSession.currentQuestionIndex];
    const progress = ((quizSession.currentQuestionIndex + 1) / quizSession.questions.length) * 100;

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleRestartQuiz}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reiniciar
            </Button>
          </div>
          <div className="text-center">
            <h2 className="font-semibold text-gray-900">{quizSession.subject} - {quizSession.topic}</h2>
            <p className="text-sm text-gray-500">
              Questão {quizSession.currentQuestionIndex + 1} de {quizSession.questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{quizSession.score} pts</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
              <Badge variant={currentQuestion.difficulty === 'easy' ? 'secondary' : currentQuestion.difficulty === 'medium' ? 'default' : 'destructive'}>
                {currentQuestion.difficulty === 'easy' ? 'Fácil' : currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedAnswer?.toString()} onValueChange={(value) => handleAnswerSelect(parseInt(value))}>
              {currentQuestion.options.map((option, index) => {
                let optionClass = "p-4 rounded-lg border-2 transition-colors cursor-pointer";
                
                if (showExplanation) {
                  if (index === currentQuestion.correctAnswer) {
                    optionClass += " border-green-500 bg-green-50";
                  } else if (index === selectedAnswer) {
                    optionClass += " border-red-500 bg-red-50";
                  } else {
                    optionClass += " border-gray-200 bg-gray-50";
                  }
                } else {
                  optionClass += selectedAnswer === index ? " border-blue-500 bg-blue-50" : " border-gray-200 hover:border-gray-300";
                }

                return (
                  <div key={index} className={optionClass} onClick={() => handleAnswerSelect(index)}>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                      {showExplanation && index === currentQuestion.correctAnswer && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {showExplanation && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>

            {showExplanation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Explicação:</h4>
                <p className="text-blue-800">{currentQuestion.explanation}</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <div />
              {!showExplanation ? (
                <Button 
                  onClick={handleAnswerSubmit} 
                  disabled={selectedAnswer === null}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Confirmar Resposta
                </Button>
              ) : (
                <Button 
                  onClick={handleNextQuestion}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {quizSession.currentQuestionIndex + 1 >= quizSession.questions.length ? 'Ver Resultado' : 'Próxima Questão'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderResults = () => {
    if (!quizSession) return null;

    const percentage = getScorePercentage();
    const scoreColor = getScoreColor(percentage);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4">
              <Trophy className="h-10 w-10 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Quiz Concluído!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className={`text-6xl font-bold ${scoreColor}`}>
                {percentage}%
              </div>
              <div className="space-y-2">
                <p className="text-lg text-gray-700">
                  Você acertou <span className="font-semibold">{quizSession.score}</span> de{' '}
                  <span className="font-semibold">{quizSession.questions.length}</span> questões
                </p>
                <div className="flex items-center justify-center space-x-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i < Math.round(percentage / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Resumo do Desempenho:</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Matéria:</span>
                  <span className="font-medium capitalize">{quizSession.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tópico:</span>
                  <span className="font-medium">{quizSession.topic}</span>
                </div>
                <div className="flex justify-between">
                  <span>Acertos:</span>
                  <span className="font-medium text-green-600">{quizSession.score}</span>
                </div>
                <div className="flex justify-between">
                  <span>Erros:</span>
                  <span className="font-medium text-red-600">{quizSession.questions.length - quizSession.score}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={handleRestartQuiz}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Novo Quiz
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCurrentView('topics')}
                className="flex-1"
              >
                Escolher Tópico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Exercícios com IA - IAverse</title>
      </Helmet>
      
      <div className="flex h-screen bg-gray-50">
        <StudentSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <StudentHeader />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8">
              {currentView === 'subjects' && renderSubjectSelection()}
              {currentView === 'topics' && renderTopicSelection()}
              {currentView === 'quiz' && renderQuiz()}
              {currentView === 'results' && renderResults()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}