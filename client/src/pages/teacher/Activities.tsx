import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PenTool, Save, Download, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function Activities() {
  const [activityData, setActivityData] = useState({
    title: '',
    subject: '',
    type: '',
    difficulty: '',
    grade: '',
    instructions: '',
    questions: ''
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/professor">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gerador de Atividades</h1>
              <p className="text-slate-600">Crie atividades personalizadas com inteligência artificial</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5 text-emerald-600" />
                  Criar Nova Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Título da Atividade</Label>
                    <Input 
                      value={activityData.title}
                      onChange={(e) => setActivityData({...activityData, title: e.target.value})}
                      placeholder="Ex: Exercícios de Adição"
                    />
                  </div>
                  <div>
                    <Label>Série/Ano</Label>
                    <Select value={activityData.grade} onValueChange={(value) => setActivityData({...activityData, grade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1ano">1º Ano</SelectItem>
                        <SelectItem value="2ano">2º Ano</SelectItem>
                        <SelectItem value="3ano">3º Ano</SelectItem>
                        <SelectItem value="4ano">4º Ano</SelectItem>
                        <SelectItem value="5ano">5º Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Matéria</Label>
                    <Select value={activityData.subject} onValueChange={(value) => setActivityData({...activityData, subject: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="matematica">Matemática</SelectItem>
                        <SelectItem value="portugues">Português</SelectItem>
                        <SelectItem value="ciencias">Ciências</SelectItem>
                        <SelectItem value="historia">História</SelectItem>
                        <SelectItem value="geografia">Geografia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo de Atividade</Label>
                    <Select value={activityData.type} onValueChange={(value) => setActivityData({...activityData, type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exercicio">Exercício</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="atividade-pratica">Atividade Prática</SelectItem>
                        <SelectItem value="projeto">Projeto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Dificuldade</Label>
                    <Select value={activityData.difficulty} onValueChange={(value) => setActivityData({...activityData, difficulty: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="dificil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Instruções da Atividade</Label>
                  <Textarea 
                    value={activityData.instructions}
                    onChange={(e) => setActivityData({...activityData, instructions: e.target.value})}
                    placeholder="Descreva as instruções e objetivos da atividade..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label>Tópicos ou Questões Específicas (opcional)</Label>
                  <Textarea 
                    value={activityData.questions}
                    onChange={(e) => setActivityData({...activityData, questions: e.target.value})}
                    placeholder="Digite questões específicas ou tópicos que devem ser abordados..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-4">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <PenTool className="h-4 w-4 mr-2" />
                    Gerar Atividade com IA
                  </Button>
                  <Button variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Rascunho
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Recent */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Prévia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-500 py-8">
                  <PenTool className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Preencha os campos ao lado para ver uma prévia da atividade</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: "Exercícios de Adição", subject: "Matemática", date: "Hoje" },
                    { title: "Interpretação de Texto", subject: "Português", date: "Ontem" },
                    { title: "Sistema Solar", subject: "Ciências", date: "2 dias atrás" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-slate-600">{item.subject} • {item.date}</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}