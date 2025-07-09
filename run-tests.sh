#!/bin/bash

# SCRIPT DE EXECUÇÃO DE TESTES - IAPRENDER
# 
# Este script executa os testes de autenticação e controle de acesso

echo "🧪 INICIANDO TESTES DO SISTEMA IAPRENDER"
echo "======================================="

# Configurar variáveis de ambiente para testes
export NODE_ENV=test
export JWT_SECRET=test_secret_key_iaprender_2025_jest

# Verificar se Jest está instalado
if ! command -v npx jest &> /dev/null; then
    echo "❌ Jest não encontrado. Instalando..."
    npm install jest supertest @types/jest @types/supertest
fi

echo "📋 Executando testes de autenticação..."
npx jest test/auth.test.js --verbose

echo ""
echo "📊 Executando todos os testes com cobertura..."
npx jest --coverage

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📝 Relatórios disponíveis:"
echo "   - Cobertura: coverage/lcov-report/index.html"
echo "   - Terminal: saída acima"

# Verificar se existem falhas
if [ $? -eq 0 ]; then
    echo "🎉 TODOS OS TESTES PASSARAM!"
else
    echo "❌ ALGUNS TESTES FALHARAM - verifique os logs acima"
    exit 1
fi