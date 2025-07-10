#!/bin/bash

# SCRIPT DE EXECUÇÃO DE TESTES - IAPRENDER
# 
# Script para executar diferentes tipos de testes com configurações específicas

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_color() {
    printf "${1}${2}${NC}\n"
}

# Função para verificar se o servidor está rodando
check_server() {
    print_color $BLUE "🔍 Verificando se o servidor está rodando..."
    
    max_attempts=10
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:5000/api/dashboard/health > /dev/null 2>&1; then
            print_color $GREEN "✅ Servidor está rodando"
            return 0
        fi
        
        print_color $YELLOW "⏳ Tentativa $attempt/$max_attempts - Aguardando servidor..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_color $RED "❌ Servidor não está respondendo após $max_attempts tentativas"
    print_color $YELLOW "💡 Certifique-se de que o servidor está rodando com: npm run dev"
    return 1
}

# Função para executar testes de formulários
run_forms_tests() {
    print_color $BLUE "📝 Executando testes de formulários..."
    npx jest test/forms.test.js --verbose --detectOpenHandles --forceExit
}

# Função para executar testes de performance
run_performance_tests() {
    print_color $BLUE "⚡ Executando testes de performance..."
    npx jest test/performance.test.js --verbose --detectOpenHandles --forceExit
}

# Função para executar testes de integração
run_integration_tests() {
    print_color $BLUE "🔗 Executando testes de integração..."
    
    if ! check_server; then
        print_color $RED "❌ Testes de integração cancelados - servidor não está rodando"
        return 1
    fi
    
    npx jest test/integration.test.js --verbose --detectOpenHandles --forceExit
}

# Função para executar todos os testes
run_all_tests() {
    print_color $BLUE "🚀 Executando todos os testes..."
    
    print_color $YELLOW "═══════════════════════════════════════"
    print_color $YELLOW "          TESTE DE FORMULÁRIOS"
    print_color $YELLOW "═══════════════════════════════════════"
    run_forms_tests
    
    print_color $YELLOW "═══════════════════════════════════════"
    print_color $YELLOW "         TESTE DE PERFORMANCE"
    print_color $YELLOW "═══════════════════════════════════════"
    run_performance_tests
    
    print_color $YELLOW "═══════════════════════════════════════"
    print_color $YELLOW "         TESTE DE INTEGRAÇÃO"
    print_color $YELLOW "═══════════════════════════════════════"
    run_integration_tests
}

# Função para executar testes com cobertura
run_with_coverage() {
    print_color $BLUE "📊 Executando testes com relatório de cobertura..."
    npx jest --coverage --verbose --detectOpenHandles --forceExit
}

# Função para executar testes em modo watch
run_watch_mode() {
    print_color $BLUE "👀 Executando testes em modo watch..."
    npx jest --watch --verbose
}

# Função para executar testes específicos
run_specific_test() {
    local test_file=$1
    if [ -z "$test_file" ]; then
        print_color $RED "❌ Especifique o arquivo de teste"
        print_color $YELLOW "Exemplo: ./run-tests.sh specific test/forms.test.js"
        return 1
    fi
    
    print_color $BLUE "🎯 Executando teste específico: $test_file"
    npx jest "$test_file" --verbose --detectOpenHandles --forceExit
}

# Função para validar ambiente
validate_environment() {
    print_color $BLUE "🔍 Validando ambiente de testes..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_color $RED "❌ Node.js não encontrado"
        return 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        print_color $RED "❌ npm não encontrado"
        return 1
    fi
    
    # Verificar Jest
    if ! npm list jest &> /dev/null; then
        print_color $RED "❌ Jest não está instalado"
        print_color $YELLOW "Execute: npm install --save-dev jest"
        return 1
    fi
    
    # Verificar dependências de teste
    if ! npm list jsdom &> /dev/null; then
        print_color $YELLOW "⚠️  jsdom não encontrado - instalando..."
        npm install --save-dev jsdom
    fi
    
    if ! npm list node-fetch &> /dev/null; then
        print_color $YELLOW "⚠️  node-fetch não encontrado - instalando..."
        npm install node-fetch
    fi
    
    print_color $GREEN "✅ Ambiente validado"
}

# Função para limpar cache e arquivos temporários
clean_test_environment() {
    print_color $BLUE "🧹 Limpando ambiente de testes..."
    
    # Limpar cache do Jest
    if command -v npx &> /dev/null; then
        npx jest --clearCache
    fi
    
    # Remover cobertura anterior
    if [ -d "coverage" ]; then
        rm -rf coverage
        print_color $GREEN "✅ Diretório de cobertura removido"
    fi
    
    # Remover node_modules/.cache se existir
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        print_color $GREEN "✅ Cache do node_modules removido"
    fi
    
    print_color $GREEN "✅ Ambiente limpo"
}

# Função para mostrar ajuda
show_help() {
    print_color $BLUE "📖 SISTEMA DE TESTES - IAPRENDER"
    echo ""
    print_color $YELLOW "Uso: $0 [comando] [opções]"
    echo ""
    print_color $BLUE "Comandos disponíveis:"
    echo "  forms         - Executar apenas testes de formulários"
    echo "  performance   - Executar apenas testes de performance"
    echo "  integration   - Executar apenas testes de integração"
    echo "  all           - Executar todos os testes (padrão)"
    echo "  coverage      - Executar testes com relatório de cobertura"
    echo "  watch         - Executar testes em modo watch"
    echo "  specific      - Executar teste específico (ex: specific test/forms.test.js)"
    echo "  validate      - Validar ambiente de testes"
    echo "  clean         - Limpar cache e arquivos temporários"
    echo "  help          - Mostrar esta ajuda"
    echo ""
    print_color $BLUE "Exemplos:"
    echo "  $0 all                      # Executar todos os testes"
    echo "  $0 forms                    # Apenas testes de formulários"
    echo "  $0 coverage                 # Testes com cobertura"
    echo "  $0 specific test/forms.test.js  # Teste específico"
    echo ""
    print_color $YELLOW "Pré-requisitos:"
    echo "  - Node.js instalado"
    echo "  - Dependências instaladas (npm install)"
    echo "  - Servidor rodando (npm run dev) para testes de integração"
}

# Função principal
main() {
    print_color $BLUE "🎯 SISTEMA DE TESTES - IAPRENDER"
    print_color $BLUE "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    case "${1:-all}" in
        "forms")
            validate_environment && run_forms_tests
            ;;
        "performance")
            validate_environment && run_performance_tests
            ;;
        "integration")
            validate_environment && run_integration_tests
            ;;
        "all")
            validate_environment && run_all_tests
            ;;
        "coverage")
            validate_environment && run_with_coverage
            ;;
        "watch")
            validate_environment && run_watch_mode
            ;;
        "specific")
            validate_environment && run_specific_test "$2"
            ;;
        "validate")
            validate_environment
            ;;
        "clean")
            clean_test_environment
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_color $RED "❌ Comando não reconhecido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal com todos os argumentos
main "$@"