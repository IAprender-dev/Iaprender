/**
 * TESTE BÁSICO - VERIFICAÇÃO DA ESTRUTURA
 */

// Configurar variáveis de ambiente
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_iaprender_2025_jest';

import { describe, test, expect } from '@jest/globals';

describe('🔧 Testes Básicos do Sistema', () => {
  test('Node.js deve estar funcionando', () => {
    expect(process.version).toBeDefined();
  });

  test('Variáveis de ambiente devem estar configuradas', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  test('Jest deve estar funcionando com ES modules', () => {
    const objeto = { teste: 'valor' };
    expect(objeto.teste).toBe('valor');
  });
});

console.log('✅ Teste básico carregado - verificando estrutura fundamental');