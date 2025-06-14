/**
 * Sistema Avançado de Correção de Acentuação Portuguesa
 * Garante renderização perfeita de caracteres especiais em PDFs
 */

export interface AccentCorrection {
  original: string;
  corrected: string;
  context: 'educational' | 'general' | 'technical';
}

export class PortugueseAccentCorrector {
  // Dicionário abrangente de termos educacionais com acentuação correta
  private static readonly EDUCATIONAL_TERMS: Record<string, string> = {
    // Termos pedagógicos básicos
    'educacao': 'Educação',
    'avaliacao': 'Avaliação', 
    'metodologia': 'Metodologia',
    'sequencia': 'Sequência',
    'didatica': 'Didática',
    'pedagogica': 'Pedagógica',
    'estrategias': 'Estratégias',
    'atividades': 'Atividades',
    'objetivos': 'Objetivos',
    'competencias': 'Competências',
    'habilidades': 'Habilidades',
    'conteudos': 'Conteúdos',
    'recursos': 'Recursos',
    'materiais': 'Materiais',
    'referencias': 'Referências',
    'bibliograficas': 'Bibliográficas',
    'inclusao': 'Inclusão',
    'acessibilidade': 'Acessibilidade',
    'adaptacoes': 'Adaptações',
    'especificos': 'Específicos',
    'especificas': 'Específicas',
    'tematica': 'Temática',
    'tematicos': 'Temáticos',
    'contextualizacao': 'Contextualização',
    'aplicacoes': 'Aplicações',
    'praticas': 'Práticas',
    'teoricas': 'Teóricas',
    'reflexao': 'Reflexão',
    'atencao': 'Atenção',
    'possivel': 'Possível',
    'possiveis': 'Possíveis',
    'necessarios': 'Necessários',
    'necessarias': 'Necessárias',
    'fisicos': 'Físicos',
    'espacos': 'Espaços',
    'criterios': 'Critérios',
    'diagnostica': 'Diagnóstica',
    'formativa': 'Formativa',
    'somativa': 'Somativa',
    'interdisciplinaridade': 'Interdisciplinaridade',
    'conexoes': 'Conexões',
    'integracao': 'Integração',
    'areas': 'Áreas',
    'pratico': 'Prático',
    'teorico': 'Teórico',
    'ciencias': 'Ciências',
    'matematica': 'Matemática',
    'historia': 'História',
    'geografia': 'Geografia',
    'portugues': 'Português',
    'ingles': 'Inglês',
    'educacao fisica': 'Educação Física',
    'artes': 'Artes',
    'musica': 'Música',
    'filosofia': 'Filosofia',
    'sociologia': 'Sociologia',
    'quimica': 'Química',
    'fisica': 'Física',
    'biologia': 'Biologia',
    
    // Termos específicos da BNCC
    'unidade tematica': 'Unidade Temática',
    'objeto conhecimento': 'Objeto de Conhecimento',
    'competencias gerais': 'Competências Gerais',
    'competencias especificas': 'Competências Específicas',
    'anos iniciais': 'Anos Iniciais',
    'anos finais': 'Anos Finais',
    'ensino medio': 'Ensino Médio',
    'educacao infantil': 'Educação Infantil',
    'serie': 'Série',
    'duracao': 'Duração',
    'identificacao': 'Identificação',
    'alinhamento': 'Alinhamento',
    
    // Termos de metodologias ativas
    'problematizacao': 'Problematização',
    'organizacao': 'Organização',
    'sistematizacao': 'Sistematização',
    'aplicacao': 'Aplicação',
    'colaborativo': 'Colaborativo',
    'colaborativa': 'Colaborativa',
    'investigacao': 'Investigação',
    'experimentacao': 'Experimentação',
    'observacao': 'Observação',
    'analise': 'Análise',
    'sintese': 'Síntese',
    
    // Termos de avaliação
    'instrumentos': 'Instrumentos',
    'momentos': 'Momentos',
    'continua': 'Contínua',
    'processual': 'Processual',
    'participacao': 'Participação',
    'desempenho': 'Desempenho',
    'progresso': 'Progresso',
    'dificuldades': 'Dificuldades',
    'potencialidades': 'Potencialidades',
    
    // Termos científicos e de biologia
    'celulas': 'Células',
    'celular': 'Celular',
    'organicos': 'Orgânicos',
    'organicas': 'Orgânicas',
    'microscopio': 'Microscópio',
    'microscopica': 'Microscópica',
    'microscopicas': 'Microscópicas',
    'bacterias': 'Bactérias',
    'protozoarios': 'Protozoários',
    'ecossistemas': 'Ecossistemas',
    'biodiversidade': 'Biodiversidade',
    'genetica': 'Genética',
    'evolucao': 'Evolução',
    'classificacao': 'Classificação',
    'caracteristicas': 'Características',
    'reproducao': 'Reprodução',
    'nutricao': 'Nutrição',
    'respiracao': 'Respiração',
    'fotossintese': 'Fotossíntese',
    'metabolismo': 'Metabolismo',
    'homeostase': 'Homeostase',
    
    // Termos gerais acadêmicos
    'academico': 'Acadêmico',
    'academica': 'Acadêmica',
    'cientifico': 'Científico',
    'cientifica': 'Científica',
    'tecnologico': 'Tecnológico',
    'tecnologica': 'Tecnológica',
    'pedagogico': 'Pedagógico',
    'didatico': 'Didático',
    'metodologico': 'Metodológico',
    'epistemologico': 'Epistemológico',
    'ontologico': 'Ontológico',
    'axiologico': 'Axiológico',
    'etico': 'Ético',
    'etica': 'Ética',
    'estetico': 'Estético',
    'estetica': 'Estética',
    'logico': 'Lógico',
    'logica': 'Lógica',
    'critico': 'Crítico',
    'critica': 'Crítica',
    'analitico': 'Analítico',
    'analitica': 'Analítica',
    'sintetico': 'Sintético',
    'sintetica': 'Sintética',
    
    // Palavras comuns com acentos
    'voce': 'Você',
    'tambem': 'Também',
    'atraves': 'Através',
    'apos': 'Após',
    'nao': 'Não',
    'sao': 'São',
    'sera': 'Será',
    'serao': 'Serão',
    'esta': 'Está',
    'estao': 'Estão',
    'ate': 'Até',
    'pos': 'Pós',
    'pre': 'Pré',
    'pro': 'Pró',
    'anti': 'Anti',
    'auto': 'Auto',
    'co': 'Co',
    'contra': 'Contra',
    'entre': 'Entre',
    'extra': 'Extra',
    'inter': 'Inter',
    'intra': 'Intra',
    'multi': 'Multi',
    'neo': 'Neo',
    'para': 'Para',
    'per': 'Per',
    'semi': 'Semi',
    'sub': 'Sub',
    'super': 'Super',
    'supra': 'Supra',
    'trans': 'Trans',
    'ultra': 'Ultra'
  };

  // Correções de encoding UTF-8 mal formado
  private static readonly UTF8_CORRECTIONS: Record<string, string> = {
    'Ã¡': 'á', 'Ã ': 'à', 'Ã¢': 'â', 'Ã£': 'ã', 'Ã¤': 'ä',
    'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
    'Ã­': 'í', 'Ã¬': 'ì', 'Ã®': 'î', 'Ã¯': 'ï',
    'Ã³': 'ó', 'Ã²': 'ò', 'Ã´': 'ô', 'Ãµ': 'õ', 'Ã¶': 'ö',
    'Ãº': 'ú', 'Ã¹': 'ù', 'Ã»': 'û', 'Ã¼': 'ü',
    'Ã§': 'ç', 'Ã±': 'ñ',
    'Ã\u0081': 'Á', 'Ã€': 'À', 'Ã‚': 'Â', 'Ãƒ': 'Ã', 'Ã„': 'Ä',
    'Ã‰': 'É', 'Ãˆ': 'È', 'ÃŠ': 'Ê', 'Ã‹': 'Ë',
    'Ã\u008D': 'Í', 'ÃŒ': 'Ì', 'ÃŽ': 'Î', 'Ã\u008F': 'Ï',
    'Ã"': 'Ó', 'Ã\u0091': 'Ò', 'Ã"': 'Ô', 'Ã•': 'Õ', 'Ã–': 'Ö',
    'Ãš': 'Ú', 'Ã™': 'Ù', 'Ã›': 'Û', 'Ãœ': 'Ü',
    'Ã‡': 'Ç', 'Ã\u0091': 'Ñ'
  };

  // Entidades HTML comuns
  private static readonly HTML_ENTITIES: Record<string, string> = {
    '&aacute;': 'á', '&agrave;': 'à', '&acirc;': 'â', '&atilde;': 'ã', '&auml;': 'ä',
    '&eacute;': 'é', '&egrave;': 'è', '&ecirc;': 'ê', '&euml;': 'ë',
    '&iacute;': 'í', '&igrave;': 'ì', '&icirc;': 'î', '&iuml;': 'ï',
    '&oacute;': 'ó', '&ograve;': 'ò', '&ocirc;': 'ô', '&otilde;': 'õ', '&ouml;': 'ö',
    '&uacute;': 'ú', '&ugrave;': 'ù', '&ucirc;': 'û', '&uuml;': 'ü',
    '&ccedil;': 'ç', '&ntilde;': 'ñ',
    '&Aacute;': 'Á', '&Agrave;': 'À', '&Acirc;': 'Â', '&Atilde;': 'Ã', '&Auml;': 'Ä',
    '&Eacute;': 'É', '&Egrave;': 'È', '&Ecirc;': 'Ê', '&Euml;': 'Ë',
    '&Iacute;': 'Í', '&Igrave;': 'Ì', '&Icirc;': 'Î', '&Iuml;': 'Ï',
    '&Oacute;': 'Ó', '&Ograve;': 'Ò', '&Ocirc;': 'Ô', '&Otilde;': 'Õ', '&Ouml;': 'Ö',
    '&Uacute;': 'Ú', '&Ugrave;': 'Ù', '&Ucirc;': 'Û', '&Uuml;': 'Ü',
    '&Ccedil;': 'Ç', '&Ntilde;': 'Ñ',
    '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"'
  };

  /**
   * Corrige texto com problemas de encoding e acentuação
   */
  static correctText(text: string, context: 'educational' | 'general' = 'educational'): string {
    if (!text || typeof text !== 'string') return '';

    let correctedText = text;

    // 1. Corrigir encoding UTF-8 mal formado
    for (const [malformed, correct] of Object.entries(this.UTF8_CORRECTIONS)) {
      correctedText = correctedText.replace(new RegExp(malformed, 'g'), correct);
    }

    // 2. Corrigir entidades HTML
    for (const [entity, correct] of Object.entries(this.HTML_ENTITIES)) {
      correctedText = correctedText.replace(new RegExp(entity, 'g'), correct);
    }

    // 3. Corrigir termos educacionais específicos
    if (context === 'educational') {
      for (const [incorrect, correct] of Object.entries(this.EDUCATIONAL_TERMS)) {
        // Correção case-insensitive preservando capitalização
        const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
        correctedText = correctedText.replace(regex, (match) => {
          if (match === match.toUpperCase()) return correct.toUpperCase();
          if (match[0] === match[0].toUpperCase()) return correct;
          return correct.toLowerCase();
        });
      }
    }

    // 4. Normalizar espaços e quebras de linha
    correctedText = correctedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return correctedText;
  }

  /**
   * Analisa texto e retorna sugestões de correção
   */
  static analyzeText(text: string): AccentCorrection[] {
    if (!text || typeof text !== 'string') return [];

    const corrections: AccentCorrection[] = [];
    const words = text.toLowerCase().split(/\s+/);

    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (this.EDUCATIONAL_TERMS[cleanWord]) {
        corrections.push({
          original: word,
          corrected: this.EDUCATIONAL_TERMS[cleanWord],
          context: 'educational'
        });
      }
    });

    return corrections;
  }

  /**
   * Valida se o texto tem problemas de encoding
   */
  static hasEncodingIssues(text: string): boolean {
    if (!text || typeof text !== 'string') return false;

    // Verifica padrões de encoding mal formado
    const malformedPatterns = [
      /Ã[¡-¿]/g,
      /Ã[€-]/g,
      /&[a-zA-Z]+;/g,
      /[^\x00-\x7F\u00C0-\u017F\u0100-\u024F]/g
    ];

    return malformedPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Converte texto para formato seguro para PDF
   */
  static toPDFSafeText(text: string): string {
    if (!text || typeof text !== 'string') return '';

    // Primeiro corrige o texto
    let safeText = this.correctText(text, 'educational');

    // Remove caracteres problemáticos para PDF
    safeText = safeText
      .replace(/[\u2018\u2019]/g, "'") // Aspas curvas simples
      .replace(/[\u201C\u201D]/g, '"') // Aspas curvas duplas
      .replace(/[\u2013\u2014]/g, '-') // Em dash e em dash
      .replace(/[\u2026]/g, '...') // Reticências
      .replace(/[\u00A0]/g, ' ') // Espaço não-quebrável
      .replace(/[^\x20-\x7E\u00C0-\u017F\u0100-\u024F]/g, ''); // Remove caracteres exóticos

    return safeText;
  }

  /**
   * Retorna versão com acentos corrigidos especificamente para títulos de seções
   */
  static correctSectionTitle(title: string): string {
    const sectionTitles: Record<string, string> = {
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
    return sectionTitles[lowerTitle] || this.correctText(title, 'educational');
  }
}

export default PortugueseAccentCorrector;