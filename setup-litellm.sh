#!/bin/bash

echo "🚀 Configurando LiteLLM para IAverse..."

# 1. Instalar Python se necessário
if ! command -v python3 &> /dev/null; then
    echo "📦 Instalando Python..."
    apt update
    apt install -y python3 python3-pip
fi

# 2. Instalar LiteLLM
echo "📦 Instalando LiteLLM..."
pip3 install 'litellm[proxy]' --upgrade

# 3. Criar diretório de configuração
mkdir -p litellm-config
cd litellm-config

# 4. Criar arquivo de configuração base
cat > config.yaml << 'EOF'
model_list:
  # OpenAI Models (configure com sua chave)
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: os.environ/OPENAI_API_KEY
  
  - model_name: gpt-3.5-turbo
    litellm_params:
      model: openai/gpt-3.5-turbo
      api_key: os.environ/OPENAI_API_KEY

  # Anthropic Models (configure com sua chave)
  - model_name: claude-3-sonnet
    litellm_params:
      model: anthropic/claude-3-sonnet-20240229
      api_key: os.environ/ANTHROPIC_API_KEY

  # Adicione outros modelos conforme necessário

litellm_settings:
  # Configurações gerais
  set_verbose: true
  json_logs: true

general_settings:
  # Chave mestra para acessar o proxy
  master_key: "litellm-master-key-2025"
  
  # Configuração do banco de dados (opcional)
  # database_url: "sqlite:///litellm.db"
  
  # Interface UI habilitada
  ui_access_mode: "admin_only"
EOF

# 5. Criar script de inicialização
cat > start-litellm.sh << 'EOF'
#!/bin/bash
echo "🔥 Iniciando servidor LiteLLM..."
echo "🌐 Dashboard disponível em: http://localhost:4000/ui"
echo "🔑 Master Key: litellm-master-key-2025"
echo ""

# Exportar variáveis de ambiente necessárias
export LITELLM_LOG=INFO

# Iniciar o servidor
litellm --config config.yaml --port 4000 --host 0.0.0.0
EOF

chmod +x start-litellm.sh

# 6. Criar arquivo com instruções
cat > README.md << 'EOF'
# Configuração LiteLLM para IAverse

## Passos para configurar:

1. **Configure suas chaves de API** (opcional, mas recomendado):
   ```bash
   export OPENAI_API_KEY="sua_chave_openai"
   export ANTHROPIC_API_KEY="sua_chave_anthropic"
   ```

2. **Inicie o servidor LiteLLM**:
   ```bash
   ./start-litellm.sh
   ```

3. **Configure no IAverse**:
   - LITELLM_URL: http://localhost:4000
   - LITELLM_API_KEY: litellm-master-key-2025

## Acesso ao Dashboard:
- URL: http://localhost:4000/ui
- Master Key: litellm-master-key-2025

## Testando a instalação:
```bash
curl -X GET "http://localhost:4000/health" \
     -H "Authorization: Bearer litellm-master-key-2025"
```
EOF

echo ""
echo "✅ LiteLLM configurado com sucesso!"
echo "📁 Arquivos criados em: ./litellm-config/"
echo ""
echo "🔄 Próximos passos:"
echo "1. cd litellm-config"
echo "2. ./start-litellm.sh"
echo "3. Configure no IAverse:"
echo "   - LITELLM_URL: http://localhost:4000"
echo "   - LITELLM_API_KEY: litellm-master-key-2025"
echo ""