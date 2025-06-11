import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Brain, 
  Clock,
  Volume2,
  VolumeX
} from "lucide-react";

interface PomodoroTimerProps {
  studyDuration?: number; // em minutos
  shortBreakDuration?: number; // em minutos
  longBreakDuration?: number; // em minutos
  sessionsUntilLongBreak?: number;
  subject?: string;
  onSessionComplete?: (type: 'study' | 'shortBreak' | 'longBreak') => void;
}

type TimerState = 'study' | 'shortBreak' | 'longBreak' | 'paused' | 'stopped';

export default function PomodoroTimer({
  studyDuration = 25,
  shortBreakDuration = 5,
  longBreakDuration = 15,
  sessionsUntilLongBreak = 4,
  subject = "Estudos",
  onSessionComplete
}: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(studyDuration * 60);
  const [timerState, setTimerState] = useState<TimerState>('stopped');
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentSessionType, setCurrentSessionType] = useState<'study' | 'shortBreak' | 'longBreak'>('study');
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const getCurrentSessionDuration = useCallback(() => {
    switch (currentSessionType) {
      case 'study':
        return studyDuration * 60;
      case 'shortBreak':
        return shortBreakDuration * 60;
      case 'longBreak':
        return longBreakDuration * 60;
      default:
        return studyDuration * 60;
    }
  }, [currentSessionType, studyDuration, shortBreakDuration, longBreakDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playNotificationSound = () => {
    if (soundEnabled) {
      // Criar um som simples usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    setTimerState(currentSessionType);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setTimerState('paused');
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimerState('stopped');
    setTimeLeft(getCurrentSessionDuration());
  };

  const completeSession = () => {
    playNotificationSound();
    onSessionComplete?.(currentSessionType);
    
    if (currentSessionType === 'study') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      // Determinar próxima sessão
      if (newCompletedSessions % sessionsUntilLongBreak === 0) {
        setCurrentSessionType('longBreak');
      } else {
        setCurrentSessionType('shortBreak');
      }
    } else {
      setCurrentSessionType('study');
    }
    
    setIsRunning(false);
    setTimerState('stopped');
    setTimeLeft(getCurrentSessionDuration());
  };

  const skipSession = () => {
    completeSession();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            completeSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    setTimeLeft(getCurrentSessionDuration());
  }, [getCurrentSessionDuration]);

  const getProgressPercentage = () => {
    const totalTime = getCurrentSessionDuration();
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getSessionIcon = () => {
    switch (currentSessionType) {
      case 'study':
        return <Brain className="w-5 h-5" />;
      case 'shortBreak':
        return <Coffee className="w-5 h-5" />;
      case 'longBreak':
        return <Coffee className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getSessionTitle = () => {
    switch (currentSessionType) {
      case 'study':
        return `Estudando: ${subject}`;
      case 'shortBreak':
        return 'Pausa Curta';
      case 'longBreak':
        return 'Pausa Longa';
      default:
        return 'Pomodoro Timer';
    }
  };

  const getSessionColor = () => {
    switch (currentSessionType) {
      case 'study':
        return 'from-blue-500 to-indigo-600';
      case 'shortBreak':
        return 'from-green-500 to-emerald-600';
      case 'longBreak':
        return 'from-purple-500 to-violet-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-200 bg-white overflow-hidden">
      <div className="bg-white p-6 border-b border-gray-200">
        <CardHeader className="p-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                currentSessionType === 'study' ? 'bg-blue-100' : 
                currentSessionType === 'shortBreak' ? 'bg-green-100' : 'bg-purple-100'
              }`}>
                {getSessionIcon()}
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">{getSessionTitle()}</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:bg-gray-100"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        
        <div className="text-center space-y-4">
          <div className={`text-6xl font-mono font-bold tracking-wider ${
            currentSessionType === 'study' ? 'text-blue-600' : 
            currentSessionType === 'shortBreak' ? 'text-green-600' : 'text-purple-600'
          }`}>
            {formatTime(timeLeft)}
          </div>
          
          <Progress 
            value={getProgressPercentage()} 
            className="h-3 bg-gray-200"
          />
          
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300">
              Sessão {completedSessions + 1}
            </Badge>
            <Badge variant="secondary" className="bg-gray-100 text-gray-700 border border-gray-300">
              {completedSessions} completas
            </Badge>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-center space-x-3">
          {!isRunning ? (
            <Button 
              onClick={startTimer}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
          ) : (
            <Button 
              onClick={pauseTimer}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
              size="lg"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pausar
            </Button>
          )}
          
          <Button 
            onClick={resetTimer}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
        </div>
        
        <Button 
          onClick={skipSession}
          variant="ghost"
          className="w-full mt-3 text-gray-500 hover:text-gray-700"
          size="sm"
        >
          Pular Sessão
        </Button>
        
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="font-semibold text-blue-700">{studyDuration}min</div>
            <div className="text-gray-600">Estudo</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="font-semibold text-green-700">{shortBreakDuration}min</div>
            <div className="text-gray-600">Pausa</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="font-semibold text-purple-700">{longBreakDuration}min</div>
            <div className="text-gray-600">Pausa Longa</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}