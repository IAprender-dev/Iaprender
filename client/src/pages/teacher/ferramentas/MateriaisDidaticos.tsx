import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { 
  BookOpenCheck, 
  FileText, 
  ArrowLeft, 
  Copy, 
  Download, 
  Loader2,
  Sparkles,
  RefreshCw,
  Heart,
  Share2,
  GraduationCap,
  Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Tipo para representar um resumo gerado
interface ResumoGerado {
  id: string;
  titulo: string;
  materia: string;
  serie: string;
  conteudo: string;
  dataGeracao: Date;
  favorito: boolean;
}

export default function ResumosDidaticos() {
  const { toast } = useToast();
  
  // Estados para os parâmetros da geração
  const [assunto, setAssunto] = useState("");
  const [contextoPedagogico, setContextoPedagogico] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para os resumos gerados
  const [resumosGerados, setResumosGerados] = useState<ResumoGerado[]>([]);
  const [resumoSelecionado, setResumoSelecionado] = useState<ResumoGerado | null>(null);
  
  // Função para gerar resumos
  const gerarResumo = async () => {
    if (!assunto.trim()) {
      toast({
        title: "Assunto obrigatório",
        description: "Por favor, informe o assunto para criar o resumo didático.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Aqui seria a chamada para a API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock de resposta com análise automática
      const analiseAutomatica = analisarAssunto(assunto);
      
      const novoResumo: ResumoGerado = {
        id: `res-${Date.now()}`,
        titulo: assunto,
        materia: analiseAutomatica.materia,
        serie: analiseAutomatica.series.join(', '),
        conteudo: mockConteudoResumoCompleto(analiseAutomatica),
        dataGeracao: new Date(),
        favorito: false
      };
      
      setResumosGerados(prev => [novoResumo, ...prev]);
      setResumoSelecionado(novoResumo);
      
      toast({
        title: "Resumo criado com sucesso!",
        description: `Resumo sobre ${assunto} foi gerado conforme diretrizes da BNCC.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar resumo",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para analisar o assunto e determinar matéria/série automaticamente
  const analisarAssunto = (assunto: string) => {
    const assuntoLower = assunto.toLowerCase();
    
    // Mapeamento de assuntos para matérias e séries
    if (assuntoLower.includes('fotossíntese') || assuntoLower.includes('respiração') || assuntoLower.includes('célula')) {
      return {
        materia: 'Ciências/Biologia',
        series: ['7º ano EF', '8º ano EF', '1º ano EM'],
        area: 'Ciências da Natureza'
      };
    }
    if (assuntoLower.includes('revolução industrial') || assuntoLower.includes('brasil colônia')) {
      return {
        materia: 'História',
        series: ['8º ano EF', '9º ano EF'],
        area: 'Ciências Humanas'
      };
    }
    if (assuntoLower.includes('equação') || assuntoLower.includes('matemática') || assuntoLower.includes('geometria')) {
      return {
        materia: 'Matemática',
        series: ['8º ano EF', '9º ano EF', '1º ano EM'],
        area: 'Matemática'
      };
    }
    if (assuntoLower.includes('figura de linguagem') || assuntoLower.includes('português') || assuntoLower.includes('literatura')) {
      return {
        materia: 'Língua Portuguesa',
        series: ['6º ano EF', '7º ano EF', '8º ano EF'],
        area: 'Linguagens'
      };
    }
    if (assuntoLower.includes('sistema solar') || assuntoLower.includes('planeta') || assuntoLower.includes('astronomia')) {
      return {
        materia: 'Ciências',
        series: ['6º ano EF', '7º ano EF'],
        area: 'Ciências da Natureza'
      };
    }
    if (assuntoLower.includes('bioma') || assuntoLower.includes('geografia') || assuntoLower.includes('clima')) {
      return {
        materia: 'Geografia',
        series: ['6º ano EF', '7º ano EF', '8º ano EF'],
        area: 'Ciências Humanas'
      };
    }
    
    // Padrão para assuntos não identificados
    return {
      materia: 'Multidisciplinar',
      series: ['6º ao 9º ano EF'],
      area: 'Geral'
    };
  };

  // Conteúdo completo do resumo com informações reais
  const mockConteudoResumoCompleto = (analise: any) => {
    const conteudoEspecifico = obterConteudoEspecifico(assunto, analise);
    
    return `
    <div class="resumo-content">
      <div class="resumo-header">
        <h1>${assunto}</h1>
        <div class="meta-info">
          <p><strong>Área do Conhecimento:</strong> ${analise.area}</p>
          <p><strong>Componente Curricular:</strong> ${analise.materia}</p>
          <p><strong>Séries/Anos Recomendados:</strong> ${analise.series.join(', ')}</p>
          <p><strong>Alinhamento BNCC:</strong> ✅ Conforme diretrizes curriculares nacionais</p>
        </div>
      </div>
      
      <div class="resumo-body">
        <section class="competencias-bncc">
          <h2>🎯 Competências e Habilidades (BNCC)</h2>
          <div class="competencias-list">
            ${conteudoEspecifico.competencias}
          </div>
        </section>

        <section class="resumo-materia">
          <h2>📖 Resumo da Matéria para Apresentação em Aula</h2>
          ${conteudoEspecifico.resumoAula}
        </section>

        <section class="conteudo-detalhado">
          <h2>📚 Desenvolvimento do Conteúdo</h2>
          ${conteudoEspecifico.conteudo}
        </section>

        <section class="conceitos-fundamentais">
          <h2>💡 Conceitos Fundamentais</h2>
          ${conteudoEspecifico.conceitos}
        </section>

        <section class="aplicacoes-praticas">
          <h2>🔧 Aplicações Práticas</h2>
          ${conteudoEspecifico.aplicacoes}
        </section>

        <section class="metodologia-sugerida">
          <h2>🎓 Metodologia de Ensino Sugerida</h2>
          <div class="metodologia-steps">
            <ol>
              <li><strong>Sensibilização:</strong> ${conteudoEspecifico.metodologia.sensibilizacao}</li>
              <li><strong>Desenvolvimento:</strong> ${conteudoEspecifico.metodologia.desenvolvimento}</li>
              <li><strong>Aplicação:</strong> ${conteudoEspecifico.metodologia.aplicacao}</li>
              <li><strong>Avaliação:</strong> ${conteudoEspecifico.metodologia.avaliacao}</li>
            </ol>
          </div>
        </section>

        <section class="recursos-complementares">
          <h2>📖 Recursos Complementares</h2>
          ${conteudoEspecifico.recursos}
        </section>

        <section class="consideracoes-finais">
          <h2>✅ Considerações Finais</h2>
          <p>Este resumo didático foi elaborado seguindo as diretrizes da BNCC, visando proporcionar uma base sólida para o desenvolvimento das competências e habilidades necessárias para ${analise.series.join(' e ')} em ${analise.materia}.</p>
          <p>O conteúdo apresenta uma abordagem completa sobre ${assunto}, integrando teoria e prática de forma contextualizada e significativa para os estudantes.</p>
          ${contextoPedagogico ? `<p><strong>Contexto pedagógico adicional:</strong> ${contextoPedagogico}</p>` : ''}
        </section>
      </div>
    </div>`;
  };

  // Função para obter conteúdo específico baseado no assunto
  const obterConteudoEspecifico = (assunto: string, analise: any) => {
    const assuntoLower = assunto.toLowerCase();
    
    if (assuntoLower.includes('fotossíntese')) {
      return {
        competencias: `
          <ul>
            <li>Compreender a vida como um fenômeno natural e social, os problemas ambientais brasileiros e a importância da preservação do ambiente</li>
            <li>Identificar e explicar fenômenos envolvidos na manutenção da vida, diferenciando e classificando os seres vivos</li>
            <li>Analisar e explicar a importância da fotossíntese para a manutenção da vida na Terra</li>
          </ul>`,
        resumoAula: `
          <div class="resumo-materia-aula">
            <header style="background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="margin: 0; font-size: 22px; font-weight: bold;">RESUMO DA MATÉRIA: FOTOSSÍNTESE</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Material de preparação para aula | Ciências - 7º/8º ano EF</p>
            </header>

            <section style="margin-bottom: 30px;">
              <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">1. CONCEITO PRINCIPAL</h3>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af;">
                <p style="margin: 0; line-height: 1.6; font-size: 16px;"><strong>Fotossíntese</strong> é o processo biológico realizado por plantas, algas e cianobactérias no qual a energia luminosa do sol é convertida em energia química (glicose), utilizando gás carbônico e água como matérias-primas e liberando oxigênio como produto.</p>
              </div>
            </section>

            <section style="margin-bottom: 30px;">
              <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">2. EQUAÇÃO QUÍMICA</h3>
              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #bfdbfe;">
                <p style="font-size: 20px; font-weight: bold; margin: 0 0 10px 0; color: #1e40af;">6CO₂ + 6H₂O + luz solar → C₆H₁₂O₆ + 6O₂</p>
                <p style="margin: 0; font-style: italic; color: #64748b;">Gás carbônico + Água + Energia luminosa = Glicose + Oxigênio</p>
              </div>
            </section>

            <section style="margin-bottom: 30px;">
              <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">3. COMPONENTES ESSENCIAIS</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
                  <h4 style="color: #15803d; margin: 0 0 10px 0;">MATÉRIAS-PRIMAS</h4>
                  <ul style="margin: 0; padding-left: 15px; line-height: 1.6;">
                    <li>Gás carbônico (CO₂) - do ar</li>
                    <li>Água (H₂O) - pelas raízes</li>
                    <li>Luz solar - energia</li>
                  </ul>
                </div>
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fecaca;">
                  <h4 style="color: #dc2626; margin: 0 0 10px 0;">PRODUTOS</h4>
                  <ul style="margin: 0; padding-left: 15px; line-height: 1.6;">
                    <li>Glicose (C₆H₁₂O₆) - alimento</li>
                    <li>Oxigênio (O₂) - subproduto</li>
                  </ul>
                </div>
              </div>
            </section>

            <section style="margin-bottom: 30px;">
              <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">4. ESTRUTURAS ENVOLVIDAS</h3>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li><strong>Cloroplastos:</strong> Organelas onde ocorre a fotossíntese</li>
                  <li><strong>Clorofila:</strong> Pigmento verde que captura a luz solar</li>
                  <li><strong>Estômatos:</strong> Poros nas folhas para entrada de CO₂ e saída de O₂</li>
                  <li><strong>Folhas:</strong> Principal local onde ocorre o processo</li>
                  <li><strong>Raízes:</strong> Absorvem a água necessária</li>
                </ul>
              </div>
            </section>

            <section style="margin-bottom: 30px;">
              <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">5. ETAPAS DO PROCESSO</h3>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <div style="margin-bottom: 15px;">
                  <h4 style="color: #059669; margin: 0 0 8px 0;">Fase 1 - Reações Dependentes de Luz (Fotoquímica)</h4>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li>Clorofila absorve energia luminosa</li>
                    <li>Água é quebrada (fotólise)</li>
                    <li>Oxigênio é liberado</li>
                    <li>Energia é capturada em moléculas de ATP e NADPH</li>
                  </ul>
                </div>
                <div>
                  <h4 style="color: #059669; margin: 0 0 8px 0;">Fase 2 - Reações Independentes de Luz (Ciclo de Calvin)</h4>
                  <ul style="margin: 0; padding-left: 20px;">
                    <li>CO₂ é fixado em compostos orgânicos</li>
                    <li>ATP e NADPH fornecem energia</li>
                    <li>Glicose é produzida</li>
                  </ul>
                </div>
              </div>
            </section>

            <section style="margin-bottom: 30px;">
              <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">6. IMPORTÂNCIA BIOLÓGICA E AMBIENTAL</h3>
              <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border: 1px solid #fde047;">
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li><strong>Produção de oxigênio:</strong> Todo O₂ atmosférico vem da fotossíntese</li>
                  <li><strong>Base da cadeia alimentar:</strong> Produtores primários do ecossistema</li>
                  <li><strong>Remoção de CO₂:</strong> Controle do efeito estufa</li>
                  <li><strong>Fonte de energia:</strong> Origem de todos os combustíveis fósseis</li>
                  <li><strong>Ciclo do carbono:</strong> Fundamental para o equilíbrio ambiental</li>
                </ul>
              </div>
            </section>

            <section style="margin-bottom: 30px;">
              <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">7. FATORES QUE INFLUENCIAM</h3>
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li><strong>Intensidade luminosa:</strong> Maior luz = maior taxa fotossintética (até um limite)</li>
                  <li><strong>Concentração de CO₂:</strong> Mais CO₂ disponível aumenta a taxa</li>
                  <li><strong>Temperatura:</strong> Temperaturas moderadas favorecem o processo</li>
                  <li><strong>Disponibilidade de água:</strong> Água insuficiente limita o processo</li>
                  <li><strong>Quantidade de clorofila:</strong> Mais pigmento = maior eficiência</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">8. RELAÇÃO COM RESPIRAÇÃO CELULAR</h3>
              <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1;">
                <p style="margin: 0 0 15px 0; line-height: 1.6;"><strong>Processos complementares:</strong></p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <h4 style="color: #15803d; margin: 0 0 8px 0;">FOTOSSÍNTESE</h4>
                    <p style="margin: 0; font-size: 14px;">Produz glicose e O₂<br>Consome CO₂ e H₂O<br>Armazena energia</p>
                  </div>
                  <div>
                    <h4 style="color: #dc2626; margin: 0 0 8px 0;">RESPIRAÇÃO</h4>
                    <p style="margin: 0; font-size: 14px;">Consome glicose e O₂<br>Produz CO₂ e H₂O<br>Libera energia</p>
                  </div>
                </div>
              </div>
            </section>
          </div>`,
        conteudo: `
          <p><strong>Fotossíntese</strong> é o processo biológico realizado pelas plantas, algas e algumas bactérias, onde a energia luminosa é convertida em energia química na forma de glicose.</p>
          
          <h3>Processo da Fotossíntese:</h3>
          <p><strong>Equação geral:</strong> 6CO₂ + 6H₂O + energia luminosa → C₆H₁₂O₆ + 6O₂</p>
          
          <p>O processo ocorre principalmente nas folhas, especificamente nos cloroplastos, organelas que contêm clorofila - pigmento verde responsável pela absorção da luz.</p>
          
          <h3>Etapas da Fotossíntese:</h3>
          <ol>
            <li><strong>Fase Clara (Fotoquímica):</strong> Ocorre nos tilacoides, onde a luz é capturada e a água é quebrada, liberando oxigênio</li>
            <li><strong>Fase Escura (Ciclo de Calvin):</strong> Ocorre no estroma, onde o CO₂ é fixado para formar glicose</li>
          </ol>`,
        conceitos: `
          <ul>
            <li><strong>Clorofila:</strong> Pigmento verde que absorve a energia luminosa</li>
            <li><strong>Cloroplastos:</strong> Organelas onde ocorre a fotossíntese</li>
            <li><strong>Estômatos:</strong> Estruturas das folhas por onde entram CO₂ e sai O₂</li>
            <li><strong>Glicose:</strong> Açúcar produzido que serve como alimento para a planta</li>
            <li><strong>Respiração Celular:</strong> Processo complementar onde a glicose é quebrada para liberar energia</li>
          </ul>`,
        aplicacoes: `
          <ul>
            <li>Produção de oxigênio que respiramos</li>
            <li>Base da cadeia alimentar terrestre</li>
            <li>Absorção de CO₂ da atmosfera, ajudando no controle do efeito estufa</li>
            <li>Agricultura e jardinagem: compreender necessidades das plantas</li>
            <li>Biotecnologia: desenvolvimento de plantas mais eficientes</li>
          </ul>`,
        metodologia: {
          sensibilizacao: "Demonstração com plantas em diferentes condições de luz, questionando por que plantas precisam de luz",
          desenvolvimento: "Explicação do processo com esquemas e experimentos práticos observando produção de oxigênio",
          aplicacao: "Experimentos com plantas aquáticas, observação de estômatos no microscópio",
          avaliacao: "Análise de situações-problema envolvendo crescimento de plantas e produção de alimentos"
        },
        recursos: `
          <ul>
            <li>Experimento com Elodea para observar produção de oxigênio</li>
            <li>Microscópio para observação de cloroplastos e estômatos</li>
            <li>Plantas em diferentes condições para comparação</li>
            <li>Vídeos educacionais sobre o processo</li>
            <li>Esquemas e infográficos explicativos</li>
          </ul>`
      };
    }
    
    // Conteúdo genérico para outros assuntos
    return {
      competencias: `
        <ul>
          <li>Desenvolver conhecimentos fundamentais sobre ${assunto}</li>
          <li>Aplicar conceitos em situações práticas do cotidiano</li>
          <li>Estabelecer relações interdisciplinares</li>
          <li>Desenvolver pensamento crítico e científico</li>
        </ul>`,
      resumoAula: `
        <div class="resumo-materia-aula">
          <header style="background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin: 0; font-size: 22px; font-weight: bold;">RESUMO DA MATÉRIA: ${assunto.toUpperCase()}</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Material de preparação para aula | ${analise.materia} - ${analise.series.join(' e ')}</p>
          </header>

          <section style="margin-bottom: 30px;">
            <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">1. CONCEITO PRINCIPAL</h3>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #1e40af;">
              <p style="margin: 0; line-height: 1.6; font-size: 16px;">Este conteúdo aborda os aspectos fundamentais de <strong>${assunto}</strong>, proporcionando uma base sólida de conhecimento alinhada às diretrizes curriculares para ${analise.materia}.</p>
            </div>
          </section>

          <section style="margin-bottom: 30px;">
            <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">2. DEFINIÇÕES FUNDAMENTAIS</h3>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Conceitos básicos:</strong> Definições essenciais e terminologia específica</li>
                <li><strong>Princípios fundamentais:</strong> Bases teóricas que sustentam o tema</li>
                <li><strong>Relações conceituais:</strong> Como se conecta com outros conhecimentos</li>
                <li><strong>Aplicações práticas:</strong> Onde e como é utilizado no cotidiano</li>
              </ul>
            </div>
          </section>

          <section style="margin-bottom: 30px;">
            <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">3. DESENVOLVIMENTO DO CONTEÚDO</h3>
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe;">
              <p style="margin: 0 0 15px 0; line-height: 1.6;">O tema será desenvolvido de forma progressiva, partindo dos conceitos mais simples para os mais complexos, sempre mantendo a conexão com o cotidiano dos estudantes.</p>
              <h4 style="color: #1d4ed8; margin: 15px 0 10px 0;">Pontos principais a abordar:</h4>
              <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Introdução contextualizada ao tema</li>
                <li>Apresentação dos conceitos fundamentais</li>
                <li>Exemplificação com situações práticas</li>
                <li>Estabelecimento de relações interdisciplinares</li>
              </ul>
            </div>
          </section>

          <section style="margin-bottom: 30px;">
            <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">4. EXEMPLOS E APLICAÇÕES</h3>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #bbf7d0;">
              <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Situações cotidianas:</strong> Exemplos que os estudantes reconhecem em seu dia a dia</li>
                <li><strong>Aplicações tecnológicas:</strong> Como o conhecimento é usado na tecnologia moderna</li>
                <li><strong>Relevância social:</strong> Importância para a sociedade e meio ambiente</li>
                <li><strong>Conexões interdisciplinares:</strong> Relações com outras matérias</li>
              </ul>
            </div>
          </section>

          <section style="margin-bottom: 30px;">
            <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">5. METODOLOGIA SUGERIDA</h3>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <div style="margin-bottom: 15px;">
                <h4 style="color: #059669; margin: 0 0 8px 0;">Introdução (10 minutos)</h4>
                <p style="margin: 0; font-size: 14px;">Levantamento de conhecimentos prévios e contextualização do tema</p>
              </div>
              <div style="margin-bottom: 15px;">
                <h4 style="color: #059669; margin: 0 0 8px 0;">Desenvolvimento (25 minutos)</h4>
                <p style="margin: 0; font-size: 14px;">Apresentação dos conceitos com exemplos práticos e atividades interativas</p>
              </div>
              <div>
                <h4 style="color: #059669; margin: 0 0 8px 0;">Síntese (10 minutos)</h4>
                <p style="margin: 0; font-size: 14px;">Resumo dos pontos principais e verificação da aprendizagem</p>
              </div>
            </div>
          </section>

          <section style="margin-bottom: 30px;">
            <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">6. RECURSOS DIDÁTICOS</h3>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border: 1px solid #fde047;">
              <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li><strong>Material visual:</strong> Esquemas, gráficos e imagens explicativas</li>
                <li><strong>Atividades práticas:</strong> Experimentos simples e demonstrações</li>
                <li><strong>Recursos digitais:</strong> Vídeos educativos e simuladores</li>
                <li><strong>Exercícios:</strong> Atividades de fixação e aplicação</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 style="color: #1e40af; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #1e40af; padding-bottom: 5px;">7. PONTOS IMPORTANTES</h3>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca;">
              <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>Importância do tema para a formação integral dos estudantes</li>
                <li>Conexões com conhecimentos prévios e futuras aprendizagens</li>
                <li>Aplicabilidade prática na vida cotidiana e profissional</li>
                <li>Desenvolvimento de competências e habilidades essenciais</li>
                <li>Contribuição para o pensamento crítico e científico</li>
              </ul>
            </div>
          </section>
        </div>`,
      conteudo: `
        <p>Este tópico aborda os aspectos fundamentais de ${assunto}, proporcionando uma base sólida de conhecimento alinhada às diretrizes da BNCC.</p>
        <p>O conteúdo será desenvolvido de forma contextualizada, relacionando teoria e prática para facilitar a compreensão dos estudantes.</p>`,
      conceitos: `
        <ul>
          <li>Conceitos básicos e definições importantes</li>
          <li>Relações com conhecimentos prévios</li>
          <li>Conexões interdisciplinares</li>
          <li>Aplicações práticas no cotidiano</li>
        </ul>`,
      aplicacoes: `
        <ul>
          <li>Aplicações no cotidiano dos estudantes</li>
          <li>Conexões com outras disciplinas</li>
          <li>Relevância social e cultural</li>
          <li>Preparação para estudos futuros</li>
        </ul>`,
      metodologia: {
        sensibilizacao: "Apresentação do tema conectado ao cotidiano dos estudantes",
        desenvolvimento: "Explicação progressiva dos conceitos com exemplos práticos",
        aplicacao: "Atividades hands-on e resolução de problemas contextualizados",
        avaliacao: "Instrumentos variados que verifiquem a compreensão e aplicação"
      },
      recursos: `
        <ul>
          <li>Material didático diversificado</li>
          <li>Recursos audiovisuais</li>
          <li>Atividades práticas e experimentais</li>
          <li>Tecnologias educacionais</li>
          <li>Bibliografia complementar</li>
        </ul>`
    };
  };

  const copiarParaClipboard = () => {
    if (resumoSelecionado) {
      navigator.clipboard.writeText(resumoSelecionado.conteudo);
      toast({
        title: "Conteúdo copiado!",
        description: "O resumo foi copiado para a área de transferência.",
      });
    }
  };

  const toggleFavorito = (id: string) => {
    setResumosGerados(prev => prev.map(resumo => 
      resumo.id === id 
        ? { ...resumo, favorito: !resumo.favorito } 
        : resumo
    ));
    
    if (resumoSelecionado?.id === id) {
      setResumoSelecionado(prev => prev ? { ...prev, favorito: !prev.favorito } : null);
    }
  };

  const sugestoesAssuntos = [
    "Sistema Solar e Planetas",
    "Revolução Industrial", 
    "Figuras de Linguagem",
    "Equações do 2º Grau",
    "Biomas Brasileiros",
    "Fotossíntese",
    "Brasil Colônia",
    "Geometria Plana"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Helmet>
        <title>Resumos Didáticos IA - IAverse</title>
      </Helmet>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/professor/dashboard">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                <BookOpenCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Resumos Didáticos IA</h1>
                <p className="text-sm text-slate-600">Crie resumos profissionais alinhados com a BNCC</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Configuração */}
          <div className="space-y-6">
            <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Configurar Resumo
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Defina o conteúdo conforme diretrizes da BNCC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Assunto */}
                <div className="space-y-3">
                  <Label htmlFor="assunto" className="text-sm font-medium text-slate-700">
                    Assunto/Tema *
                  </Label>
                  <Textarea 
                    id="assunto"
                    placeholder="Ex: Fotossíntese e respiração celular"
                    className="min-h-[100px] resize-none border-slate-300 focus:border-blue-500"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                  />
                  
                  {/* Sugestões */}
                  <div className="flex flex-wrap gap-2">
                    {sugestoesAssuntos.map((sugestao, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="cursor-pointer hover:bg-blue-50 border-blue-200 text-blue-700"
                        onClick={() => setAssunto(sugestao)}
                      >
                        {sugestao}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Contexto Pedagógico */}
                <div className="space-y-3">
                  <Label htmlFor="contexto" className="text-sm font-medium text-slate-700">
                    Contexto Pedagógico Adicional
                  </Label>
                  <Textarea 
                    id="contexto"
                    placeholder="Ex: Enfoque em experimentos práticos, adaptação para alunos com dificuldades de aprendizagem..."
                    className="min-h-[80px] resize-none border-slate-300 focus:border-blue-500"
                    value={contextoPedagogico}
                    onChange={(e) => setContextoPedagogico(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Opcional: Orientações específicas sobre abordagem ou contexto pedagógico
                  </p>
                </div>

                {/* Botão Gerar */}
                <Button 
                  onClick={gerarResumo}
                  disabled={isLoading || !assunto.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando Resumo...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Resumo Didático
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resumos Recentes */}
            {resumosGerados.length > 0 && (
              <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Resumos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resumosGerados.slice(0, 3).map((resumo) => (
                    <div 
                      key={resumo.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setResumoSelecionado(resumo)}
                    >
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpenCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{resumo.titulo}</p>
                        <p className="text-xs text-slate-500">
                          {resumo.materia} • {resumo.serie}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={resumo.favorito ? "text-red-500" : "text-slate-400"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(resumo.id);
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Visualização */}
          <div className="space-y-6">
            {resumoSelecionado ? (
              <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-800">
                          {resumoSelecionado.titulo}
                        </CardTitle>
                        <CardDescription className="text-slate-600">
                          {resumoSelecionado.materia} • {resumoSelecionado.serie}
                        </CardDescription>
                        <Badge variant="outline" className="mt-1 text-xs">
                          Alinhado com BNCC
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={resumoSelecionado.favorito ? "text-red-500" : "text-slate-400"}
                        onClick={() => toggleFavorito(resumoSelecionado.id)}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copiarParaClipboard}
                        className="text-slate-600 hover:text-blue-600"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg p-6 border border-slate-200 max-h-[600px] overflow-y-auto">
                    <div
                      className="prose prose-sm max-w-none text-slate-700"
                      dangerouslySetInnerHTML={{ __html: resumoSelecionado.conteudo }}
                    />
                  </div>
                  
                  {/* Ações */}
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-4">
                    <GraduationCap className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    Nenhum resumo selecionado
                  </h3>
                  <p className="text-slate-600 max-w-md">
                    Configure o assunto, matéria e série, depois clique em "Gerar Resumo Didático" para criar seu material educacional alinhado com a BNCC.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}