import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";

export default function GradeCalculator() {
  const { toast } = useToast();
  const [students, setStudents] = useState([
    { id: 1, name: "", registration: "", grade1: "", grade2: "", grade3: "", average: 0, status: "" }
  ]);

  const addStudent = () => {
    const newId = Math.max(...students.map(s => s.id), 0) + 1;
    setStudents([...students, { id: newId, name: "", registration: "", grade1: "", grade2: "", grade3: "", average: 0, status: "" }]);
  };

  const removeStudent = (id: number) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const updateStudent = (id: number, field: string, value: string) => {
    setStudents(students.map(student => {
      if (student.id === id) {
        const updated = { ...student, [field]: value };
        
        // Calculate average if grades are updated
        if (field.includes('grade') || field === 'grade1' || field === 'grade2' || field === 'grade3') {
          const g1 = parseFloat(updated.grade1) || 0;
          const g2 = parseFloat(updated.grade2) || 0;
          const g3 = parseFloat(updated.grade3) || 0;
          const average = (g1 + g2 + g3) / 3;
          updated.average = Math.round(average * 100) / 100;
          
          // Determine status
          if (average >= 7) {
            updated.status = "Aprovado";
          } else if (average >= 5) {
            updated.status = "Recuperação";
          } else {
            updated.status = "Reprovado";
          }
        }
        
        return updated;
      }
      return student;
    }));
  };

  const exportResults = () => {
    const validStudents = students.filter(s => s.name.trim() !== "");
    if (validStudents.length === 0) {
      toast({
        title: "Nenhum aluno válido",
        description: "Adicione pelo menos um aluno com nome para exportar.",
        variant: "destructive",
      });
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + 
      "Nome,Matrícula,Nota 1,Nota 2,Nota 3,Média,Status\n" +
      validStudents.map(s => `${s.name},${s.registration},${s.grade1},${s.grade2},${s.grade3},${s.average},${s.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "notas_trimestre.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportado com sucesso!",
      description: "As notas foram exportadas para arquivo CSV.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Gestão de Notas por Aluno</h3>
        <div className="space-x-2">
          <Button onClick={addStudent} variant="outline" className="border-purple-300 text-purple-800 hover:bg-purple-50 hover:text-purple-900 bg-white">
            <User className="h-4 w-4 mr-2" />
            Adicionar Aluno
          </Button>
          <Button onClick={exportResults} className="bg-purple-600 hover:bg-purple-700">
            <FileText className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {students.map((student) => (
          <Card key={student.id} className="p-4 border-2 border-purple-200/60 bg-white hover:border-purple-300/80 transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
              <div className="md:col-span-2">
                <Label htmlFor={`name-${student.id}`} className="text-sm font-semibold text-purple-700">Nome do Aluno</Label>
                <Input
                  id={`name-${student.id}`}
                  value={student.name}
                  onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                  placeholder="Nome completo"
                  className="border-2 border-purple-200 focus:border-purple-600 focus:ring-purple-600/20 focus:ring-4 transition-all duration-300 bg-white text-purple-900 placeholder:text-purple-600"
                />
              </div>
              
              <div>
                <Label htmlFor={`registration-${student.id}`} className="text-sm font-semibold text-purple-700">Matrícula</Label>
                <Input
                  id={`registration-${student.id}`}
                  value={student.registration}
                  onChange={(e) => updateStudent(student.id, 'registration', e.target.value)}
                  placeholder="Matrícula"
                  className="border-2 border-purple-200 focus:border-purple-600 focus:ring-purple-600/20 focus:ring-4 transition-all duration-300 bg-white text-purple-900 placeholder:text-purple-600"
                />
              </div>
              
              <div>
                <Label htmlFor={`grade1-${student.id}`} className="text-sm font-semibold text-purple-700">1ª Nota</Label>
                <Input
                  id={`grade1-${student.id}`}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={student.grade1}
                  onChange={(e) => updateStudent(student.id, 'grade1', e.target.value)}
                  placeholder="0.0"
                  className="border-2 border-purple-200 focus:border-purple-600 focus:ring-purple-600/20 focus:ring-4 transition-all duration-300 bg-white text-purple-900 placeholder:text-purple-600"
                />
              </div>
              
              <div>
                <Label htmlFor={`grade2-${student.id}`} className="text-sm font-semibold text-purple-700">2ª Nota</Label>
                <Input
                  id={`grade2-${student.id}`}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={student.grade2}
                  onChange={(e) => updateStudent(student.id, 'grade2', e.target.value)}
                  placeholder="0.0"
                  className="border-2 border-purple-200 focus:border-purple-600 focus:ring-purple-600/20 focus:ring-4 transition-all duration-300 bg-white text-purple-900 placeholder:text-purple-600"
                />
              </div>
              
              <div>
                <Label htmlFor={`grade3-${student.id}`} className="text-sm font-semibold text-purple-700">3ª Nota</Label>
                <Input
                  id={`grade3-${student.id}`}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={student.grade3}
                  onChange={(e) => updateStudent(student.id, 'grade3', e.target.value)}
                  placeholder="0.0"
                  className="border-2 border-purple-200 focus:border-purple-600 focus:ring-purple-600/20 focus:ring-4 transition-all duration-300 bg-white text-purple-900 placeholder:text-purple-600"
                />
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-slate-800">Média</Label>
                <div className={`text-lg font-bold p-2 rounded ${
                  student.average >= 7 ? 'text-green-800 bg-green-50' :
                  student.average >= 5 ? 'text-yellow-800 bg-yellow-50' :
                  'text-red-800 bg-red-50'
                }`}>
                  {student.average.toFixed(1)}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold text-slate-800">Status</Label>
                <div className="flex items-center gap-2">
                  {student.status === "Aprovado" && <CheckCircle className="h-4 w-4 text-green-700" />}
                  {student.status === "Recuperação" && <Clock className="h-4 w-4 text-yellow-700" />}
                  {student.status === "Reprovado" && <AlertTriangle className="h-4 w-4 text-red-700" />}
                  <span className={`text-sm font-semibold ${
                    student.status === "Aprovado" ? 'text-green-800' :
                    student.status === "Recuperação" ? 'text-yellow-800' :
                    'text-red-800'
                  }`}>{student.status}</span>
                </div>
              </div>
              
              <div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => removeStudent(student.id)}
                  disabled={students.length === 1}
                >
                  Remover
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}