import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Brain, 
  Coffee, 
  Play, 
  CheckCircle2,
  Timer
} from "lucide-react";

interface PomodoroSession {
  id: number;
  subject: string;
  studyTime: number; // em minutos
  breakTime: number; // em minutos
  longBreakTime: number; // em minutos
  cycles: number; // número de ciclos pomodoro
  startTime: string;
  endTime: string;
  isCompleted: boolean;
}

interface PomodoroScheduleDisplayProps {
  sessions: PomodoroSession[];
  onStartSession?: (sessionId: number) => void;
}

export default function PomodoroScheduleDisplay({ sessions, onStartSession }: PomodoroScheduleDisplayProps) {
  const calculateTotalDuration = (session: PomodoroSession) => {
    // Cada ciclo: tempo de estudo + pausa curta
    // Último ciclo: apenas tempo de estudo + pausa longa
    const regularCycles = session.cycles - 1;
    const regularTime = regularCycles * (session.studyTime + session.breakTime);
    const finalCycle = session.studyTime + session.longBreakTime;
    return regularTime + finalCycle;
  };

  const formatPomodoroSchedule = (session: PomodoroSession) => {
    const schedule = [];
    let currentTime = session.startTime;
    
    for (let i = 0; i < session.cycles; i++) {
      const isLastCycle = i === session.cycles - 1;
      
      // Período de estudo
      const studyStart = currentTime;
      const studyEnd = addMinutes(currentTime, session.studyTime);
      schedule.push({
        type: 'study',
        start: studyStart,
        end: studyEnd,
        duration: session.studyTime,
        cycle: i + 1
      });
      
      currentTime = studyEnd;
      
      // Período de descanso
      if (!isLastCycle) {
        const breakEnd = addMinutes(currentTime, session.breakTime);
        schedule.push({
          type: 'break',
          start: currentTime,
          end: breakEnd,
          duration: session.breakTime,
          cycle: i + 1
        });
        currentTime = breakEnd;
      } else {
        // Pausa longa no final
        const longBreakEnd = addMinutes(currentTime, session.longBreakTime);
        schedule.push({
          type: 'longBreak',
          start: currentTime,
          end: longBreakEnd,
          duration: session.longBreakTime,
          cycle: i + 1
        });
      }
    }
    
    return schedule;
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    return date.toTimeString().slice(0, 5);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'study': return <Brain className="w-4 h-4 text-blue-600" />;
      case 'break': return <Coffee className="w-4 h-4 text-green-600" />;
      case 'longBreak': return <Coffee className="w-4 h-4 text-purple-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'study': return 'Estudo';
      case 'break': return 'Pausa';
      case 'longBreak': return 'Pausa Longa';
      default: return '';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'break': return 'bg-green-50 border-green-200 text-green-700';
      case 'longBreak': return 'bg-purple-50 border-purple-200 text-purple-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const schedule = formatPomodoroSchedule(session);
        
        return (
          <Card key={session.id} className={`border shadow-sm ${
            session.isCompleted 
              ? 'bg-green-50 border-green-300' 
              : 'bg-white border-gray-300'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    session.isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {session.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Brain className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">{session.subject}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Timer className="w-4 h-4" />
                      <span>{session.startTime} - {session.endTime}</span>
                      <Badge variant="secondary" className="ml-2">
                        {session.cycles} Pomodoros
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {!session.isCompleted && onStartSession && (
                  <button
                    onClick={() => onStartSession(session.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Iniciar</span>
                  </button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 mb-3">Cronograma Pomodoro:</h4>
                <div className="grid gap-2">
                  {schedule.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getTypeColor(item.type)}`}
                    >
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <div className="font-medium">
                            {getTypeLabel(item.type)} {item.type === 'study' ? `- Ciclo ${item.cycle}` : ''}
                          </div>
                          <div className="text-sm opacity-75">
                            {item.start} - {item.end}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-white/50">
                        {item.duration}min
                      </Badge>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tempo total de estudo:</span>
                    <span className="font-medium">{session.cycles * session.studyTime}min</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tempo total de pausas:</span>
                    <span className="font-medium">
                      {(session.cycles - 1) * session.breakTime + session.longBreakTime}min
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-900 pt-1 border-t border-gray-300 mt-1">
                    <span>Duração total:</span>
                    <span>{calculateTotalDuration(session)}min</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {sessions.length === 0 && (
        <Card className="border border-gray-200 bg-white">
          <CardContent className="text-center py-8">
            <Timer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma sessão programada
            </h3>
            <p className="text-gray-600">
              Crie um plano de estudos para ver o cronograma Pomodoro
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}