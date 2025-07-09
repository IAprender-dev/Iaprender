/**
 * TESTE SIMPLES - VERIFICAÇÃO BÁSICA DO SISTEMA
 */

import app from '../src/app.js';

describe('🔧 Testes Básicos do Sistema', () => {
  test('App deve estar definido', () => {
    expect(app).toBeDefined();
  });

  test('Variáveis de ambiente devem estar configuradas', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('Deve ter configurações básicas', () => {
    expect(app._router).toBeDefined();
  });
});

console.log('✅ Teste simples carregado - verificando estrutura básica');