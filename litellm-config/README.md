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
