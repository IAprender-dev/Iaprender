#!/bin/bash
echo "🔥 Iniciando servidor LiteLLM..."
echo "🌐 Dashboard disponível em: http://localhost:4000/ui"
echo "🔑 Master Key: litellm-master-key-2025"
echo ""

# Exportar variáveis de ambiente necessárias
export LITELLM_LOG=INFO

# Iniciar o servidor
litellm --config config.yaml --port 4000 --host 0.0.0.0
