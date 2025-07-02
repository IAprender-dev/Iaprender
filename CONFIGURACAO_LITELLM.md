# Configuração LiteLLM - Guia Completo

## Situação Atual

O LiteLLM foi instalado com sucesso, mas precisa de configuração manual para funcionar no ambiente Replit.

## Opções de Configuração

### Opção 1: Simular LiteLLM para Testes (Recomendado)

Para testar o dashboard imediatamente, você pode usar estas configurações:

```bash
# Adicione ao arquivo .env ou configure nas variáveis de ambiente do Replit:
LITELLM_URL=http://localhost:4000
LITELLM_API_KEY=litellm-master-key-2025
```

Com essas configurações, o dashboard exibirá:
- Status de "não configurado" com instruções
- Opção para configurar LiteLLM real
- Interface completa para quando o LiteLLM estiver funcionando

### Opção 2: Configurar LiteLLM Real

#### 2.1. Servidor Local (Desenvolvimento)

```bash
# 1. Instalar LiteLLM em uma máquina local
pip install 'litellm[proxy]'

# 2. Criar arquivo config.yaml
cat > config.yaml << EOF
model_list:
  - model_name: gpt-4
    litellm_params:
      model: openai/gpt-4
      api_key: YOUR_OPENAI_KEY
  - model_name: claude-3-sonnet
    litellm_params:
      model: anthropic/claude-3-sonnet-20240229
      api_key: YOUR_ANTHROPIC_KEY

general_settings:
  master_key: "seu-master-key-aqui"
  ui_access_mode: "admin_only"
EOF

# 3. Iniciar servidor
litellm --config config.yaml --port 4000 --host 0.0.0.0

# 4. Configurar no IAverse
LITELLM_URL=http://your-server:4000
LITELLM_API_KEY=seu-master-key-aqui
```

#### 2.2. Servidor na Nuvem

Você pode usar serviços como:
- Heroku
- Railway
- Render
- AWS/Google Cloud

### Opção 3: Dashboard Personalizado Sem LiteLLM

O dashboard já funciona perfeitamente sem LiteLLM real, mostrando:
- Interface completa de gestão
- Status de configuração
- Instruções para setup
- Simulação de dados quando necessário

## Funcionalidades Disponíveis

### Com LiteLLM Configurado:
✅ Dados reais de uso e custos
✅ Dashboard nativo do LiteLLM
✅ Gestão real de chaves API
✅ Monitoramento em tempo real

### Sem LiteLLM (Modo Demo):
✅ Interface completa funcional
✅ Status de configuração claro
✅ Instruções de setup
✅ Pronto para conectar quando LiteLLM estiver disponível

## Recomendação

Para uso imediato, configure as variáveis de ambiente:
```
LITELLM_URL=http://localhost:4000
LITELLM_API_KEY=litellm-master-key-2025
```

O dashboard detectará que não há conexão real e exibirá o status apropriado com instruções para configuração completa.

## Próximos Passos

1. **Agora**: Configure as variáveis de ambiente para ver o dashboard funcionando
2. **Depois**: Configure um servidor LiteLLM real quando necessário
3. **Futuro**: Adicione suas chaves de API reais para dados autênticos