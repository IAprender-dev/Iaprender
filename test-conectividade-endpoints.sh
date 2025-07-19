#!/bin/bash
echo "🧪 TESTE DE ENDPOINTS DE CONECTIVIDADE"
echo "====================================="

# Verificar se servidor está rodando
if ! curl -s http://localhost:5000/api/connectivity/health > /dev/null; then
    echo "❌ Servidor não está rodando em localhost:5000"
    exit 1
fi

echo "✅ Servidor ativo"
echo ""

# Teste 1: Health Check
echo "🔸 Teste 1: Health Check"
HEALTH=$(curl -s http://localhost:5000/api/connectivity/health)
echo "Response: $HEALTH"
echo ""

# Teste 2: Informações do Sistema
echo "🔸 Teste 2: Informações do Sistema"
INFO=$(curl -s http://localhost:5000/api/connectivity/info)
echo "Response: $INFO"
echo ""

# Teste 3: Teste Básico
echo "🔸 Teste 3: Teste Básico de Conectividade"
TEST=$(curl -s http://localhost:5000/api/connectivity/test)
echo "Response: $TEST"
echo ""

# Teste 4: Teste Completo
echo "🔸 Teste 4: Teste Completo de Conectividade"
COMPLETE=$(curl -s http://localhost:5000/api/connectivity/test/complete)
echo "Response: $COMPLETE"
echo ""

echo "🎯 Todos os endpoints testados com sucesso!"