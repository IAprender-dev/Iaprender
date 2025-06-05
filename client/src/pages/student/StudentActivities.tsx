import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import aiverseLogo from "@assets/Design sem nome (5)_1749151937571.png";
import { 
  Brain, 
  Trophy, 
  Target, 
  BookOpen, 
  Calculator, 
  Globe, 
  Microscope, 
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  User,
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

export default function StudentActivities() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados do sistema
  const [currentView, setCurrentView] = useState<'subjects' | 'topic-input' | 'quiz'>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [studyTopic, setStudyTopic] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [questionsAnswered, setQuestionsAnswered] = useState<number>(0);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState<boolean>(false);

  // Disciplinas da BNCC (1º ano fundamental ao 3º ano ensino médio)
  const subjects = [
    { id: 'português', name: 'Português', icon: BookOpen, color: 'bg-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { id: 'matemática', name: 'Matemática', icon: Calculator, color: 'bg-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { id: 'ciências', name: 'Ciências', icon: Microscope, color: 'bg-purple-500', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    { id: 'história', name: 'História', icon: Globe, color: 'bg-orange-500', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { id: 'geografia', name: 'Geografia', icon: Globe, color: 'bg-teal-500', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
    { id: 'biologia', name: 'Biologia', icon: Microscope, color: 'bg-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    { id: 'química', name: 'Química', icon: Microscope, color: 'bg-cyan-500', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
    { id: 'física', name: 'Física', icon: Target, color: 'bg-indigo-500', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    { id: 'inglês', name: 'Inglês', icon: Globe, color: 'bg-rose-500', bgColor: 'bg-rose-50', borderColor: 'border-rose-200' },
    { id: 'filosofia', name: 'Filosofia', icon: Brain, color: 'bg-amber-500', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { id: 'sociologia', name: 'Sociologia', icon: Brain, color: 'bg-violet-500', bgColor: 'bg-violet-50', borderColor: 'border-violet-200' },
    { id: 'literatura', name: 'Literatura', icon: BookOpen, color: 'bg-pink-500', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' }
  ];

  // Geração de questão individual
  const generateQuestionMutation = useMutation({
    mutationFn: async ({ subject, topic }: { subject: string; topic: string }) => {
      const response = await apiRequest('POST', '/api/ai/generate-quiz', {
        subject,
        topic,
        grade: '6º ano',
        questionCount: 1
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.questions && data.questions.length > 0) {
        setCurrentQuestion(data.questions[0]);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setIsLoadingQuestion(false);
        setCurrentView('quiz');
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível gerar a questão. Tente novamente.",
        variant: "destructive"
      });
      setIsLoadingQuestion(false);
    }
  });

  // Funções de navegação
  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentView('topic-input');
  };

  const handleStartQuiz = () => {
    if (!studyTopic.trim()) {
      toast({
        title: "Tema obrigatório",
        description: "Por favor, digite um tema de estudo.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingQuestion(true);
    generateQuestionMutation.mutate({ 
      subject: selectedSubject, 
      topic: studyTopic 
    });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!currentQuestion || showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    const points = isCorrect ? 10 : -5;
    
    setTotalScore(prev => prev + points);
    setQuestionsAnswered(prev => prev + 1);
    
    toast({
      title: isCorrect ? "Resposta Correta!" : "Resposta Incorreta",
      description: isCorrect ? "+10 pontos" : "-5 pontos",
      variant: isCorrect ? "default" : "destructive"
    });
  };

  const handleNextQuestion = () => {
    setIsLoadingQuestion(true);
    generateQuestionMutation.mutate({ 
      subject: selectedSubject, 
      topic: studyTopic 
    });
  };

  const handleBackToSubjects = () => {
    setCurrentView('subjects');
    setSelectedSubject('');
    setStudyTopic('');
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleBackToTopicInput = () => {
    setCurrentView('topic-input');
    setCurrentQuestion(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  // Renderização da seleção de disciplinas
  const renderSubjectSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Exercícios com IA</h2>
        <p className="text-gray-600">Escolha uma disciplina para começar a estudar</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => {
          const IconComponent = subject.icon;
          return (
            <Card 
              key={subject.id}
              className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${subject.borderColor} ${subject.bgColor} hover:shadow-xl`}
              onClick={() => handleSubjectSelect(subject.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${subject.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Renderização da entrada de tópico
  const renderTopicInput = () => {
    const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
    const IconComponent = selectedSubjectData?.icon || BookOpen;
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToSubjects}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card className={`${selectedSubjectData?.bgColor} border-2 ${selectedSubjectData?.borderColor}`}>
          <CardHeader className="text-center">
            <div className={`w-16 h-16 ${selectedSubjectData?.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <IconComponent className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900">
              {selectedSubjectData?.name}
            </CardTitle>
            <p className="text-gray-600">Digite o tema que você gostaria de estudar</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="study-topic" className="text-base font-medium text-gray-700">
                Tema de estudo
              </Label>
              <Input
                id="study-topic"
                type="text"
                placeholder="Ex: Teorema de Pitágoras, Revolução Francesa, etc."
                value={studyTopic}
                onChange={(e) => setStudyTopic(e.target.value)}
                className="mt-2 text-lg py-3"
                onKeyDown={(e) => e.key === 'Enter' && handleStartQuiz()}
              />
            </div>
            
            <Button 
              onClick={handleStartQuiz}
              disabled={!studyTopic.trim() || isLoadingQuestion}
              className="w-full py-3 text-lg"
            >
              {isLoadingQuestion ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Gerando questão...
                </>
              ) : (
                'Começar exercícios'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderização do quiz
  const renderQuiz = () => {
    if (!currentQuestion) return null;

    const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header do quiz */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToTopicInput}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Questões</p>
              <p className="text-xl font-bold text-gray-900">{questionsAnswered}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Pontuação</p>
              <p className={`text-xl font-bold ${totalScore >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalScore}
              </p>
            </div>
          </div>
        </div>

        {/* Cabeçalho da disciplina */}
        <Card className={`${selectedSubjectData?.bgColor} border-2 ${selectedSubjectData?.borderColor}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${selectedSubjectData?.color} rounded-lg flex items-center justify-center`}>
                {selectedSubjectData && <selectedSubjectData.icon className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedSubjectData?.name}</h3>
                <p className="text-sm text-gray-600">{studyTopic}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questão */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Badge variant="outline" className="capitalize">
                  {currentQuestion.difficulty === 'easy' ? 'Fácil' : 
                   currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                </Badge>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.question}
              </h3>
              
              <RadioGroup
                value={selectedAnswer?.toString()}
                onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                disabled={showExplanation}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrect = index === currentQuestion.correctAnswer;
                  const shouldHighlight = showExplanation && (isSelected || isCorrect);
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors
                        ${shouldHighlight
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isSelected
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                      {showExplanation && (
                        <>
                          {isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-600" />}
                        </>
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Explicação */}
            {showExplanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Explicação:</h4>
                <p className="text-blue-800">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex justify-center">
              {showExplanation ? (
                <Button 
                  onClick={handleNextQuestion}
                  disabled={isLoadingQuestion}
                  className="px-8 py-3"
                >
                  {isLoadingQuestion ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Próxima questão'
                  )}
                </Button>
              ) : (
                <p className="text-gray-600">Selecione uma resposta para continuar</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Exercícios com IA - AIverse</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={aiverseLogo} 
                  alt="AIverse Logo" 
                  className="w-10 h-10"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AIverse</h1>
                  <p className="text-sm text-gray-600">Exercícios com IA</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {user && (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {user.firstName || 'Aluno'}
                    </span>
                  </div>
                )}
                
                <BackButton href="/student/dashboard" label="Dashboard" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {currentView === 'subjects' && renderSubjectSelection()}
          {currentView === 'topic-input' && renderTopicInput()}
          {currentView === 'quiz' && renderQuiz()}
        </main>
      </div>
    </>
  );
}