/**
 * Sistema de Correção de Acentuação para PDFs
 * Garantia de renderização perfeita de caracteres portugueses
 */

export class PDFAccentCorrector {
  // Termos educacionais com acentuação correta
  private static readonly EDUCATIONAL_TERMS: Record<string, string> = {
    'identificacao': 'Identificação',
    'duracao': 'Duração', 
    'serie': 'Série',
    'unidade tematica': 'Unidade Temática',
    'objeto conhecimento': 'Objeto de Conhecimento',
    'competencias': 'Competências',
    'competencias gerais': 'Competências Gerais',
    'competencias especificas': 'Competências Específicas',
    'habilidades': 'Habilidades',
    'contextualizacao': 'Contextualização',
    'relevancia': 'Relevância',
    'objetivos especificos': 'Objetivos Específicos',
    'conteudos': 'Conteúdos',
    'conceituais': 'Conceituais',
    'procedimentais': 'Procedimentais',
    'atitudinais': 'Atitudinais',
    'metodologia': 'Metodologia',
    'metodologias ativas': 'Metodologias Ativas',
    'estrategias ensino': 'Estratégias de Ensino',
    'momentos pedagogicos': 'Momentos Pedagógicos',
    'sequencia didatica': 'Sequência Didática',
    'inicio': 'Início',
    'desenvolvimento': 'Desenvolvimento',
    'fechamento': 'Fechamento',
    'recursos didaticos': 'Recursos Didáticos',
    'materiais necessarios': 'Materiais Necessários',
    'recursos digitais': 'Recursos Digitais',
    'espacos fisicos': 'Espaços Físicos',
    'avaliacao': 'Avaliação',
    'instrumentos': 'Instrumentos',
    'criterios': 'Critérios',
    'momentos': 'Momentos',
    'diagnostica': 'Diagnóstica',
    'formativa': 'Formativa',
    'somativa': 'Somativa',
    'inclusao acessibilidade': 'Inclusão e Acessibilidade',
    'adaptacoes': 'Adaptações',
    'estrategias inclusivas': 'Estratégias Inclusivas',
    'interdisciplinaridade': 'Interdisciplinaridade',
    'conexoes': 'Conexões',
    'integracao areas': 'Integração de Áreas',
    'realidade local': 'Realidade Local',
    'aplicacoes praticas': 'Aplicações Práticas',
    'extensao aprofundamento': 'Extensão e Aprofundamento',
    'atividades complementares': 'Atividades Complementares',
    'pesquisas extras': 'Pesquisas Extras',
    'reflexao docente': 'Reflexão Docente',
    'pontos atencao': 'Pontos de Atenção',
    'adaptacoes possivel': 'Adaptações Possíveis',
    'referencias': 'Referências',
    'bibliograficas': 'Bibliográficas',
    'digitais': 'Digitais',
    'ciencias': 'Ciências',
    'matematica': 'Matemática',
    'historia': 'História',
    'geografia': 'Geografia',
    'fisica': 'Física',
    'quimica': 'Química',
    'biologia': 'Biologia',
    'portugues': 'Português',
    'educacao fisica': 'Educação Física'
  };

  // Correções específicas comuns
  private static readonly COMMON_CORRECTIONS: Record<string, string> = {
    'nao': 'não',
    'sao': 'são',
    'sera': 'será',
    'serao': 'serão',
    'esta': 'está',
    'estao': 'estão',
    'voce': 'você',
    'tambem': 'também',
    'atraves': 'através',
    'apos': 'após',
    'ate': 'até',
    'pos': 'pós',
    'pre': 'pré',
    'maos': 'mãos',
    'orgaos': 'órgãos',
    'coracoes': 'corações',
    'pulmoes': 'pulmões',
    'questoes': 'questões',
    'licoes': 'lições',
    'nacoes': 'nações',
    'populacoes': 'populações',
    'situacoes': 'situações',
    'operacoes': 'operações',
    'relacoes': 'relações',
    'proporcoes': 'proporções',
    'solucoes': 'soluções'
  };

  /**
   * Corrige texto aplicando todas as regras de acentuação
   */
  static correctText(text: string): string {
    if (!text || typeof text !== 'string') return '';

    let correctedText = text;

    // Aplicar correções educacionais
    for (const [incorrect, correct] of Object.entries(this.EDUCATIONAL_TERMS)) {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      correctedText = correctedText.replace(regex, (match) => {
        if (match === match.toUpperCase()) return correct.toUpperCase();
        if (match[0] === match[0].toUpperCase()) return correct;
        return correct.toLowerCase();
      });
    }

    // Aplicar correções comuns
    for (const [incorrect, correct] of Object.entries(this.COMMON_CORRECTIONS)) {
      const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
      correctedText = correctedText.replace(regex, (match) => {
        if (match === match.toUpperCase()) return correct.toUpperCase();
        if (match[0] === match[0].toUpperCase()) return correct;
        return correct.toLowerCase();
      });
    }

    // Correções específicas para problemas detectados no PDF
    correctedText = correctedText
      .replace(/\bTitulo\b/g, 'Título')
      .replace(/\btitulo\b/g, 'título')
      .replace(/\bEspecificos\b/g, 'Específicos')
      .replace(/\bespecificos\b/g, 'específicos')
      .replace(/\bEspecificas\b/g, 'Específicas')
      .replace(/\bespecificas\b/g, 'específicas')
      .replace(/\bContextualizacao\b/g, 'Contextualização')
      .replace(/\bcontextualizacao\b/g, 'contextualização')
      .replace(/\bRelevancia\b/g, 'Relevância')
      .replace(/\brelevancia\b/g, 'relevância')
      .replace(/\bNecessarios\b/g, 'Necessários')
      .replace(/\bnecessarios\b/g, 'necessários')
      .replace(/\bNecessarias\b/g, 'Necessárias')
      .replace(/\bnecessarias\b/g, 'necessárias')
      .replace(/\bFisicos\b/g, 'Físicos')
      .replace(/\bfisicos\b/g, 'físicos')
      .replace(/\bPossivel\b/g, 'Possível')
      .replace(/\bpossivel\b/g, 'possível')
      .replace(/\bTemática\b/g, 'Temática')
      .replace(/\btematica\b/g, 'temática')
      .replace(/\bPedagógicos\b/g, 'Pedagógicos')
      .replace(/\bpedagogicos\b/g, 'pedagógicos')
      .replace(/\bInclusivas\b/g, 'Inclusivas')
      .replace(/\binclusivas\b/g, 'inclusivas');

    // Normalizar espaços
    correctedText = correctedText.replace(/\s+/g, ' ').trim();

    return correctedText;
  }

  /**
   * Prepara texto para uso seguro em PDF
   */
  static toPDFSafeText(text: string): string {
    if (!text || typeof text !== 'string') return '';

    // Primeiro corrige acentos
    let safeText = this.correctText(text);

    // Remove caracteres problemáticos para PDF
    safeText = safeText
      .replace(/[\u2018\u2019]/g, "'") // Aspas curvas simples
      .replace(/[\u201C\u201D]/g, '"') // Aspas curvas duplas
      .replace(/[\u2013\u2014]/g, '-') // Em dash e em dash
      .replace(/[\u2026]/g, '...') // Reticências
      .replace(/[\u00A0]/g, ' ') // Espaço não-quebrável
      .replace(/\r\n/g, '\n') // Normaliza quebras de linha
      .replace(/\r/g, '\n');

    return safeText;
  }

  /**
   * Corrige títulos de seção específicos
   */
  static correctSectionTitle(title: string): string {
    const titleMap: Record<string, string> = {
      'identificacao': 'Identificação',
      'alinhamento bncc': 'Alinhamento BNCC',
      'tema da aula': 'Tema da Aula',
      'objetivos de aprendizagem': 'Objetivos de Aprendizagem',
      'conteudos': 'Conteúdos',
      'metodologia': 'Metodologia',
      'sequencia didatica': 'Sequência Didática',
      'recursos didaticos': 'Recursos Didáticos',
      'avaliacao': 'Avaliação',
      'inclusao acessibilidade': 'Inclusão e Acessibilidade',
      'interdisciplinaridade': 'Interdisciplinaridade',
      'contextualizacao': 'Contextualização',
      'extensao aprofundamento': 'Extensão e Aprofundamento',
      'reflexao docente': 'Reflexão Docente',
      'referencias': 'Referências'
    };

    const lowerTitle = title.toLowerCase().trim();
    return titleMap[lowerTitle] || this.correctText(title);
  }
}

export default PDFAccentCorrector;