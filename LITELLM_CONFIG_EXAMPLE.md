# Configuração do LiteLLM para Dados Reais

## Variáveis de Ambiente Necessárias

Para acessar dados reais do LiteLLM, adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
# LiteLLM Configuration
LITELLM_URL=http://localhost:4000
LITELLM_API_KEY=your_litellm_api_key_here
```

## Configuração do LiteLLM

### 1. Instalação e Configuração do LiteLLM

```bash
# Instalar LiteLLM
pip install litellm[proxy]

# Criar arquivo de configuração
cat > litellm_config.yaml << EOF
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: your_openai_api_key
  - model_name: claude-3-sonnet
    litellm_params:
      model: anthropic/claude-3-sonnet-20240229
      api_key: your_anthropic_api_key
  - model_name: llama-2-70b
    litellm_params:
      model: replicate/meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3
      api_key: your_replicate_api_key

general_settings:
  master_key: your_master_key_here
  database_url: "postgresql://user:password@localhost:5432/litellm"
EOF
```

### 2. Iniciar o LiteLLM Proxy

```bash
# Iniciar servidor LiteLLM
litellm --config litellm_config.yaml --port 4000
```

### 3. Testar Conexão

```bash
# Testar se o LiteLLM está funcionando
curl -X GET "http://localhost:4000/health" \
     -H "Authorization: Bearer your_master_key_here"
```

## Endpoints do LiteLLM Disponíveis

O dashboard IAverse se conecta aos seguintes endpoints do LiteLLM:

- `GET /health` - Status do sistema
- `GET /metrics` - Métricas de uso
- `GET /models` - Lista de modelos disponíveis
- `GET /keys` - Chaves de API configuradas
- `GET /usage` - Estatísticas de uso
- `GET /ui` - Dashboard nativo do LiteLLM

## Dashboard Nativo do LiteLLM

Quando configurado corretamente, você pode acessar o dashboard nativo do LiteLLM em:
`http://localhost:4000/ui`

Este dashboard oferece:
- Visualização de logs em tempo real
- Métricas de performance
- Gerenciamento de modelos
- Controle de chaves API
- Analytics detalhados

## Integração com IAverse

1. **Configuração Automática**: O IAverse detecta automaticamente se o LiteLLM está configurado
2. **Dados Reais**: Quando conectado, todos os dados exibidos são reais do LiteLLM
3. **Dashboard Nativo**: Botão para acessar o dashboard nativo quando disponível
4. **Fallback**: Mostra status de configuração quando não conectado

## Solução de Problemas

### LiteLLM não configurado
- Verifique se as variáveis `LITELLM_URL` e `LITELLM_API_KEY` estão definidas
- Confirme se o servidor LiteLLM está executando na URL especificada

### Erro de conexão
- Teste a conexão manual com curl
- Verifique se a API key está correta
- Confirme se as portas estão abertas

### Dados não aparecem
- Verifique os logs do servidor IAverse
- Teste os endpoints do LiteLLM diretamente
- Confirme se há dados suficientes para exibir