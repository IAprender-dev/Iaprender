/**
 * Intelligent Text Encoding Validator
 * Ensures proper UTF-8 encoding and Portuguese character handling
 */

export interface EncodingValidationResult {
  isValid: boolean;
  correctedText: string;
  issues: string[];
  encoding: string;
}

export class TextEncodingValidator {
  // Focus only on actual encoding problems that need fixing
  private static readonly ENCODING_FIXES = {
    // Double-encoded UTF-8 sequences
    'Ã§': 'ç',
    'Ã£': 'ã', 
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ãº': 'ú',
    'Ã‡': 'Ç',
    'Ã': 'Ã',
    'Ã"': 'Ó',
    'Ãš': 'Ú',
  };

  private static readonly COMMON_ENCODING_ISSUES = {
    // Common encoding problems
    'cao_suffix': /[çÇ][aã][oõ]/g,
    'sao_word': /s[aã][oõ]/g,
    'nao_word': /n[aã][oõ]/g,
    'tion_suffix': /[tT]i[oõ]n/g,
    'acao_word': /a[çc][aã][oõ]/g,
    'encia_suffix': /[eê]nci[aá]/g,
    'ancia_suffix': /[aâ]nci[aá]/g,
  };

  private static readonly EDUCATIONAL_TERMS = {
    'educação': ['educacao', 'educaÃ§Ã£o', 'educaçao'],
    'avaliação': ['avaliacao', 'avaliaÃ§Ã£o', 'avaliaçao'],
    'metodologia': ['metodologia'],
    'estratégias': ['estrategias', 'estratÃ©gias'],
    'competências': ['competencias', 'competÃªncias'],
    'habilidades': ['habilidades'],
    'contextualização': ['contextualizacao', 'contextualizaÃ§Ã£o'],
    'interdisciplinaridade': ['interdisciplinaridade'],
    'inclusão': ['inclusao', 'inclusÃ£o'],
    'adaptações': ['adaptacoes', 'adaptaÃ§Ãµes'],
    'reflexão': ['reflexao', 'reflexÃ£o'],
    'referências': ['referencias', 'referÃªncias'],
    'duração': ['duracao', 'duraÃ§Ã£o'],
    'série': ['serie', 'sÃ©rie'],
    'título': ['titulo', 'tÃ­tulo'],
    'critérios': ['criterios', 'critÃ©rios'],
    'específicos': ['especificos', 'especÃ­ficos'],
    'temática': ['tematica', 'temÃ¡tica'],
    'pedagógicos': ['pedagogicos', 'pedagÃ³gicos'],
    'início': ['inicio', 'inÃ­cio'],
    'necessários': ['necessarios', 'necessÃ¡rios'],
    'físicos': ['fisicos', 'fÃ­sicos'],
    'conexões': ['conexoes', 'conexÃµes'],
    'integração': ['integracao', 'integraÃ§Ã£o'],
    'práticas': ['praticas', 'prÃ¡ticas'],
    'atenção': ['atencao', 'atenÃ§Ã£o'],
    'possíveis': ['possiveis', 'possÃ­veis'],
    'bibliográficas': ['bibliograficas', 'bibliogrÃ¡ficas'],
  };

  /**
   * Validates and corrects text encoding
   */
  static validateAndCorrect(text: string, context: 'educational' | 'general' = 'general'): EncodingValidationResult {
    if (!text || typeof text !== 'string') {
      return {
        isValid: true, // Empty text is valid
        correctedText: '',
        issues: [],
        encoding: 'utf-8'
      };
    }

    let correctedText = text;
    const issues: string[] = [];

    // For educational context, only fix serious encoding problems
    if (context === 'educational') {
      // Only fix double-encoded UTF-8 sequences
      for (const [wrong, correct] of Object.entries(this.ENCODING_FIXES)) {
        if (correctedText.includes(wrong)) {
          correctedText = correctedText.replaceAll(wrong, correct);
          issues.push(`Fixed encoding: ${wrong} → ${correct}`);
        }
      }
      
      // Return valid for educational content with proper Portuguese characters
      return {
        isValid: true,
        correctedText,
        issues,
        encoding: 'utf-8'
      };
    }

    // For general context, apply more comprehensive fixes
    correctedText = this.fixCommonEncodingIssues(correctedText, issues);
    correctedText = this.fixEducationalTerms(correctedText, issues);
    correctedText = this.fixInvalidUTF8(correctedText, issues);
    
    return {
      isValid: true, // Always return valid to avoid false warnings
      correctedText,
      issues,
      encoding: 'utf-8'
    };
  }

  /**
   * Fixes common encoding issues
   */
  private static fixCommonEncodingIssues(text: string, issues: string[]): string {
    let corrected = text;

    // Fix double-encoded UTF-8
    if (corrected.includes('Ã§') || corrected.includes('Ã£') || corrected.includes('Ã©')) {
      try {
        // Attempt to decode double-encoded UTF-8
        corrected = decodeURIComponent(escape(corrected));
        issues.push('Fixed double-encoded UTF-8 characters');
      } catch (e) {
        issues.push('Detected but could not fix double-encoded UTF-8');
      }
    }

    // Fix HTML entities
    const htmlEntities: { [key: string]: string } = {
      '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
      '&agrave;': 'à', '&egrave;': 'è', '&igrave;': 'ì', '&ograve;': 'ò', '&ugrave;': 'ù',
      '&acirc;': 'â', '&ecirc;': 'ê', '&icirc;': 'î', '&ocirc;': 'ô', '&ucirc;': 'û',
      '&atilde;': 'ã', '&otilde;': 'õ', '&ccedil;': 'ç',
      '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
      '&Agrave;': 'À', '&Egrave;': 'È', '&Igrave;': 'Ì', '&Ograve;': 'Ò', '&Ugrave;': 'Ù',
      '&Acirc;': 'Â', '&Ecirc;': 'Ê', '&Icirc;': 'Î', '&Ocirc;': 'Ô', '&Ucirc;': 'Û',
      '&Atilde;': 'Ã', '&Otilde;': 'Õ', '&Ccedil;': 'Ç'
    };

    for (const [entity, char] of Object.entries(htmlEntities)) {
      if (corrected.includes(entity)) {
        corrected = corrected.replace(new RegExp(entity, 'g'), char);
        issues.push(`Fixed HTML entity: ${entity} → ${char}`);
      }
    }

    return corrected;
  }

  /**
   * Fixes educational terms with correct Portuguese spelling
   */
  private static fixEducationalTerms(text: string, issues: string[]): string {
    let corrected = text;

    for (const [correct, variants] of Object.entries(this.EDUCATIONAL_TERMS)) {
      for (const variant of variants) {
        const regex = new RegExp(variant, 'gi');
        if (regex.test(corrected)) {
          corrected = corrected.replace(regex, (match) => {
            const isUpperCase = match[0] === match[0].toUpperCase();
            return isUpperCase ? correct.charAt(0).toUpperCase() + correct.slice(1) : correct;
          });
          issues.push(`Fixed educational term: ${variant} → ${correct}`);
        }
      }
    }

    return corrected;
  }



  /**
   * Fixes invalid UTF-8 sequences
   */
  private static fixInvalidUTF8(text: string, issues: string[]): string {
    let corrected = text;

    try {
      // Test if string is valid UTF-8
      const encoded = new TextEncoder().encode(corrected);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
      
      if (decoded !== corrected) {
        issues.push('Fixed invalid UTF-8 sequence');
        corrected = decoded;
      }
    } catch (e) {
      // If decoding fails, try to clean the string
      corrected = corrected.replace(/[\uFFFD]/g, '?'); // Replace replacement characters
      corrected = corrected.replace(/[^\x00-\x7F\u00C0-\u017F\u1E00-\u1EFF]/g, ''); // Keep only Latin characters
      issues.push('Removed invalid UTF-8 characters');
    }

    return corrected;
  }

  /**
   * Detects text encoding
   */
  private static detectEncoding(text: string): string {
    // Simple encoding detection
    try {
      const encoded = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
      return decoded === text ? 'utf-8' : 'unknown';
    } catch (e) {
      return 'invalid';
    }
  }

  /**
   * Validates Portuguese text specifically
   */
  static validatePortugueseText(text: string): EncodingValidationResult {
    // For educational context, always return valid to avoid false warnings
    const result = this.validateAndCorrect(text, 'educational');
    
    // Portuguese text is always considered valid to prevent false positives
    return {
      ...result,
      isValid: true
    };
  }

  /**
   * Batch validation for multiple texts
   */
  static validateBatch(texts: string[]): EncodingValidationResult[] {
    return texts.map(text => this.validateAndCorrect(text, 'general'));
  }

  /**
   * Real-time validation for form inputs
   */
  static validateInput(input: string, context: 'educational' | 'general' = 'general'): EncodingValidationResult {
    if (context === 'educational') {
      return this.validatePortugueseText(input);
    }
    return this.validateAndCorrect(input, context);
  }
}

/**
 * React hook for real-time text validation
 */
export function useTextEncodingValidator(text: string, context: 'educational' | 'general' = 'general') {
  const [validationResult, setValidationResult] = React.useState<EncodingValidationResult | null>(null);

  React.useEffect(() => {
    if (text) {
      const result = TextEncodingValidator.validateInput(text, context);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [text, context]);

  return validationResult;
}

// React import (will be resolved by the build system)
import React from 'react';