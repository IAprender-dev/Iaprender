
#!/bin/bash

# Nome do arquivo zip
ZIP_NAME="iaprender-sistema-completo-$(date +%Y%m%d_%H%M%S).zip"

echo "🚀 Criando arquivo zip do sistema completo..."
echo "📦 Nome do arquivo: $ZIP_NAME"

# Criar diretório temporário para preparar os arquivos
TEMP_DIR="/tmp/iaprender-backup"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copiar arquivos do projeto, excluindo diretórios desnecessários
echo "📂 Copiando arquivos do sistema..."

# Lista de arquivos/diretórios para excluir
EXCLUDE_PATTERNS=(
    "node_modules"
    ".git"
    "coverage"
    "dist"
    "build"
    ".next"
    ".nuxt"
    ".svelte-kit"
    ".cache"
    ".parcel-cache"
    "*.log"
    "*.tmp"
    ".DS_Store"
    "Thumbs.db"
    ".env.local"
    ".env.development"
    ".env.production"
    "uploads/*"
    ".config/npm"
    ".config/pulse"
    "generated-logos/*"
    "attached_assets/*.txt"
    "*.zip"
    "*.tar.gz"
)

# Construir comando rsync com exclusões
EXCLUDE_ARGS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$pattern"
done

# Copiar arquivos
rsync -av $EXCLUDE_ARGS . $TEMP_DIR/iaprender-sistema/

# Criar arquivo README para o zip
cat > $TEMP_DIR/iaprender-sistema/README_SISTEMA.md << 'EOF'
# IAprender - Sistema Educacional Completo

## 📋 Descrição
Sistema educacional completo com integração AWS Cognito, Bedrock, S3, Aurora Serverless e LiteLLM.

## 🚀 Como executar

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- COGNITO_USER_POOL_ID
- COGNITO_CLIENT_ID
- DATABASE_URL (Aurora Serverless)

### 3. Executar o sistema
```bash
npm run dev
```

## 📁 Estrutura do Projeto

### Backend (server/)
- `server/index.ts` - Servidor principal Express
- `server/routes/` - Rotas da API
- `server/services/` - Serviços AWS e integração
- `server/middleware/` - Middlewares de autenticação

### Frontend (client/)
- `client/src/pages/` - Páginas da aplicação
- `client/src/components/` - Componentes React reutilizáveis
- `client/src/hooks/` - Hooks customizados

### Banco de Dados (src/models/)
- Modelos PostgreSQL com Aurora Serverless
- Sistema hierárquico: Admin > Gestor > Diretor > Professor > Aluno

## 🔧 Principais Funcionalidades

### Administração
- Dashboard administrativo completo
- Gestão de usuários via AWS Cognito
- Monitoramento de custos AWS
- Gestão de contratos e empresas

### Educacional
- Sistema de planejamento de aulas
- Gerador de atividades com IA
- Chat educacional com multiple LLMs
- Sistema de notificações

### Segurança
- Autenticação JWT com Cognito
- Sistema de permissões hierárquico
- Monitoramento de tokens
- Rate limiting por usuário

## 🏗️ Tecnologias Utilizadas
- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Banco**: PostgreSQL (Aurora Serverless)
- **AWS**: Cognito, Bedrock, S3, Lambda
- **IA**: OpenAI, Anthropic, Perplexity via LiteLLM

## 📞 Suporte
Sistema desenvolvido para plataforma educacional brasileira com foco em BNCC.
EOF

# Criar informações do sistema
cat > $TEMP_DIR/iaprender-sistema/INFORMACOES_SISTEMA.txt << EOF
========================================
IAPRENDER - SISTEMA EDUCACIONAL COMPLETO
========================================

Data de criação do backup: $(date)
Versão do Node.js: $(node --version 2>/dev/null || echo "Não detectado")
Sistema Operacional: $(uname -s)

COMPONENTES PRINCIPAIS:
- Frontend React + TypeScript
- Backend Express + TypeScript  
- Banco PostgreSQL Aurora Serverless
- Integração AWS Cognito
- Sistema de IA com LiteLLM
- Dashboard administrativo
- Sistema hierárquico de permissões

ARQUIVOS IMPORTANTES:
- server/index.ts - Servidor principal
- client/src/App.tsx - Aplicação principal
- server/db.ts - Configuração do banco
- server/routes/ - APIs do sistema

CONFIGURAÇÕES NECESSÁRIAS:
1. AWS Credentials
2. Cognito User Pool
3. Aurora Database
4. S3 Bucket
5. Bedrock Access

Para mais detalhes, consulte README_SISTEMA.md
EOF

# Criar o arquivo zip
cd $TEMP_DIR
echo "🗜️ Compactando arquivos..."
zip -r "/home/runner/workspace/$ZIP_NAME" iaprender-sistema/ -q

# Mover para diretório do projeto
mv "/home/runner/workspace/$ZIP_NAME" "/home/runner/workspace/"

# Limpar arquivos temporários
rm -rf $TEMP_DIR

echo "✅ Sistema empacotado com sucesso!"
echo "📍 Arquivo criado: $ZIP_NAME"
echo "📊 Tamanho do arquivo:"
ls -lh "/home/runner/workspace/$ZIP_NAME" | awk '{print $5}'

echo ""
echo "🎯 O arquivo zip contém:"
echo "   • Todo o código fonte (frontend + backend)"
echo "   • Configurações e scripts"
echo "   • Documentação completa"
echo "   • Estrutura de banco de dados"
echo "   • Guias de instalação"

echo ""
echo "⚠️  IMPORTANTE: Configure as variáveis de ambiente antes de executar!"
