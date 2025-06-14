import React from 'react';
import { Alert, AlertDescription } from './alert';
import { Badge } from './badge';
import { TextEncodingValidator, EncodingValidationResult } from '@/lib/textEncodingValidator';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface TextEncodingValidatorProps {
  text: string;
  context?: 'educational' | 'general';
  showDetails?: boolean;
  autoCorrect?: boolean;
  onCorrected?: (correctedText: string) => void;
  className?: string;
}

export function TextEncodingValidatorComponent({
  text,
  context = 'general',
  showDetails = false,
  autoCorrect = false,
  onCorrected,
  className = ''
}: TextEncodingValidatorProps) {
  const [validationResult, setValidationResult] = React.useState<EncodingValidationResult | null>(null);

  React.useEffect(() => {
    if (text && text.length > 0) {
      const result = TextEncodingValidator.validateInput(text, context);
      setValidationResult(result);

      // Auto-correct if enabled and there are issues
      if (autoCorrect && !result.isValid && result.correctedText !== text && onCorrected) {
        onCorrected(result.correctedText);
      }
    } else {
      setValidationResult(null);
    }
  }, [text, context, autoCorrect, onCorrected]);

  if (!validationResult || text.length === 0) {
    return null;
  }

  const getStatusIcon = () => {
    if (validationResult.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (validationResult.issues.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (validationResult.isValid) {
      return 'Codificação válida';
    }
    if (validationResult.issues.length > 0) {
      return `${validationResult.issues.length} problema(s) detectado(s)`;
    }
    return 'Codificação inválida';
  };

  const getVariant = () => {
    if (validationResult.isValid) return 'default';
    if (validationResult.issues.length > 0) return 'secondary';
    return 'destructive';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant={getVariant()} className="text-xs">
          {getStatusText()}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {validationResult.encoding.toUpperCase()}
        </Badge>
      </div>

      {/* Issues Alert */}
      {validationResult.issues.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Problemas de codificação detectados:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {validationResult.issues.map((issue, index) => (
                  <li key={index} className="text-muted-foreground">{issue}</li>
                ))}
              </ul>
              {!autoCorrect && validationResult.correctedText !== text && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <p className="font-medium">Texto corrigido:</p>
                  <p className="text-foreground">{validationResult.correctedText}</p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Details */}
      {showDetails && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Tamanho: {text.length} caracteres</p>
          <p>Codificação: {validationResult.encoding}</p>
          <p>Contexto: {context === 'educational' ? 'Educacional' : 'Geral'}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for text encoding validation with real-time feedback
 */
export function useTextEncodingValidation(
  text: string,
  context: 'educational' | 'general' = 'general'
) {
  const [validationResult, setValidationResult] = React.useState<EncodingValidationResult | null>(null);
  const [correctedText, setCorrectedText] = React.useState(text);

  React.useEffect(() => {
    if (text && text.length > 0) {
      const result = TextEncodingValidator.validateInput(text, context);
      setValidationResult(result);
      
      if (!result.isValid && result.correctedText !== text) {
        setCorrectedText(result.correctedText);
      } else {
        setCorrectedText(text);
      }
    } else {
      setValidationResult(null);
      setCorrectedText(text);
    }
  }, [text, context]);

  const applyCorrectedText = React.useCallback(() => {
    if (validationResult && !validationResult.isValid) {
      return validationResult.correctedText;
    }
    return text;
  }, [text, validationResult]);

  return {
    validationResult,
    correctedText,
    isValid: validationResult?.isValid ?? true,
    hasIssues: (validationResult?.issues.length ?? 0) > 0,
    applyCorrectedText
  };
}

/**
 * Enhanced Input component with built-in encoding validation
 */
interface ValidatedInputProps {
  validationContext?: 'educational' | 'general';
  showValidation?: boolean;
  autoCorrect?: boolean;
  onValidationChange?: (result: EncodingValidationResult | null) => void;
  value?: string | ReadonlyArray<string> | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
}

export function ValidatedInput({
  validationContext = 'general',
  showValidation = true,
  autoCorrect = false,
  onValidationChange,
  value,
  onChange,
  className = '',
  placeholder,
  type,
  disabled,
  required,
  id,
  name
}: ValidatedInputProps) {
  const stringValue = typeof value === 'string' ? value : '';
  const { validationResult, applyCorrectedText } = useTextEncodingValidation(
    stringValue,
    validationContext
  );

  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validationResult);
    }
  }, [validationResult, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    if (autoCorrect && validationResult && !validationResult.isValid) {
      const corrected = applyCorrectedText();
      if (corrected !== newValue) {
        newValue = corrected;
      }
    }
    
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: newValue }
      };
      onChange(syntheticEvent);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className} ${
          validationResult && !validationResult.isValid 
            ? 'border-yellow-500 focus:border-yellow-600' 
            : validationResult?.isValid 
            ? 'border-green-500 focus:border-green-600' 
            : 'border-gray-300'
        }`}
      />
      
      {showValidation && stringValue.length > 0 && (
        <TextEncodingValidatorComponent
          text={stringValue}
          context={validationContext}
          autoCorrect={autoCorrect}
          onCorrected={(corrected) => {
            if (autoCorrect && onChange) {
              const syntheticEvent = {
                target: { value: corrected }
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(syntheticEvent);
            }
          }}
        />
      )}
    </div>
  );
}

/**
 * Enhanced Textarea component with built-in encoding validation
 */
interface ValidatedTextareaProps {
  validationContext?: 'educational' | 'general';
  showValidation?: boolean;
  autoCorrect?: boolean;
  onValidationChange?: (result: EncodingValidationResult | null) => void;
  value?: string | ReadonlyArray<string> | number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  rows?: number;
  cols?: number;
}

export function ValidatedTextarea({
  validationContext = 'educational',
  showValidation = true,
  autoCorrect = false,
  onValidationChange,
  value,
  onChange,
  className = '',
  ...props
}: ValidatedTextareaProps) {
  const stringValue = typeof value === 'string' ? value : '';
  const { validationResult, applyCorrectedText } = useTextEncodingValidation(
    stringValue,
    validationContext
  );

  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validationResult);
    }
  }, [validationResult, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    
    if (autoCorrect && validationResult && !validationResult.isValid) {
      const corrected = applyCorrectedText();
      if (corrected !== newValue) {
        newValue = corrected;
      }
    }
    
    if (onChange) {
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: newValue }
      };
      onChange(syntheticEvent);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        {...props}
        value={value}
        onChange={handleChange}
        className={`${className} ${
          validationResult && !validationResult.isValid 
            ? 'border-yellow-500 focus:border-yellow-600' 
            : validationResult?.isValid 
            ? 'border-green-500 focus:border-green-600' 
            : ''
        }`}
      />
      
      {showValidation && stringValue.length > 0 && (
        <TextEncodingValidatorComponent
          text={stringValue}
          context={validationContext}
          autoCorrect={autoCorrect}
          onCorrected={(corrected) => {
            if (autoCorrect && onChange) {
              const syntheticEvent = {
                target: { value: corrected }
              } as React.ChangeEvent<HTMLTextAreaElement>;
              onChange(syntheticEvent);
            }
          }}
        />
      )}
    </div>
  );
}