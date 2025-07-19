
#!/bin/bash

# Nome do arquivo zip
ZIP_NAME="iaprender-sistema-completo-$(date +%Y%m%d_%H%M%S).tar.gz"

echo "🚀 Criando arquivo comprimido do sistema completo..."
echo "📦 Nome do arquivo: $ZIP_NAME"

# Criar diretório temporário para preparar os arquivos
TEMP_DIR="/tmp/iaprender-backup"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR/iaprender-sistema

echo "📂 Copiando arquivos do sistema..."

# Copiar arquivos essenciais do sistema
cp -r client/ $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ Diretório client não encontrado"
cp -r server/ $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ Diretório server não encontrado"
cp -r src/ $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ Diretório src não encontrado"
cp -r shared/ $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ Diretório shared não encontrado"
cp -r scripts/ $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ Diretório scripts não encontrado"

# Copiar arquivos de configuração importantes
cp package.json $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ package.json não encontrado"
cp .replit $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ .replit não encontrado"
cp vite.config.ts $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ vite.config.ts não encontrado"
cp tsconfig.json $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ tsconfig.json não encontrado"
cp tailwind.config.ts $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ tailwind.config.ts não encontrado"
cp drizzle.config.ts $TEMP_DIR/iaprender-sistema/ 2>/dev/null || echo "⚠️ drizzle.config.ts não encontrado"

# Copiar documentação
cp *.md $TEMP_DIR/iaprender-sistema/ 2>/dev/null
cp *.sql $TEMP_DIR/iaprender-sistema/ 2>/dev/null

# Remover arquivos desnecessários
find $TEMP_DIR/iaprender-sistema -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null
find $TEMP_DIR/iaprender-sistema -name ".git" -type d -exec rm -rf {} + 2>/dev/null
find $TEMP_DIR/iaprender-sistema -name "*.log" -type f -delete 2>/dev/null
find $TEMP_DIR/iaprender-sistema -name ".DS_Store" -type f -delete 2>/dev/null
find $TEMP_DIR/iaprender-sistema -name "*.tmp" -type f -delete 2>/dev/null

# Criar arquivo README para o sistema
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
```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your_jwt_secret_key
```

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

## 🔗 Links Úteis
- Documentação AWS: https://docs.aws.amazon.com/
- Replit: https://replit.com/
- GitHub: Configure seu repositório Git
EOF

# Criar arquivo de informações do sistema
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
- package.json - Dependências
- .replit - Configuração Replit

CONFIGURAÇÕES NECESSÁRIAS:
1. AWS Credentials (Access Key + Secret)
2. Cognito User Pool configurado
3. Aurora Database ou PostgreSQL
4. S3 Bucket para uploads
5. Bedrock Access habilitado

COMANDOS IMPORTANTES:
- npm install (instalar dependências)
- npm run dev (executar em desenvolvimento)
- npm run build (build para produção)

Para mais detalhes, consulte README_SISTEMA.md
EOF

# Criar arquivo de instruções de instalação
cat > $TEMP_DIR/iaprender-sistema/INSTALACAO.md << 'EOF'
# 🚀 Guia de Instalação - IAprender

## Pré-requisitos
- Node.js 18+ instalado
- Conta AWS ativa
- PostgreSQL ou Aurora Serverless configurado

## Passo a Passo

### 1️⃣ Extrair arquivos
```bash
tar -xzf iaprender-sistema-completo-*.tar.gz
cd iaprender-sistema/
```

### 2️⃣ Instalar dependências
```bash
npm install
```

### 3️⃣ Configurar ambiente
Crie arquivo `.env` na raiz:
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

### 4️⃣ Configurar AWS
- Configure suas credenciais AWS
- Crie User Pool no Cognito
- Configure S3 bucket
- Habilite Bedrock access

### 5️⃣ Executar sistema
```bash
npm run dev
```

### 6️⃣ Acessar aplicação
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

## ⚠️ Importante
- Configure todas as variáveis de ambiente
- Verifique permissões AWS
- Teste conectividade com banco de dados
EOF

# Criar o arquivo comprimido usando tar (disponível no Replit)
cd $TEMP_DIR
echo "🗜️ Compactando arquivos..."
tar -czf "$ZIP_NAME" iaprender-sistema/

# Mover para diretório do projeto
mv "$ZIP_NAME" "/home/runner/workspace/"

# Limpar arquivos temporários
rm -rf $TEMP_DIR

echo "✅ Sistema empacotado com sucesso!"
echo "📍 Arquivo criado: $ZIP_NAME"
echo "📊 Tamanho do arquivo:"
ls -lh "/home/runner/workspace/$ZIP_NAME" | awk '{print $5 " " $9}'

echo ""
echo "🎯 O arquivo comprimido contém:"
echo "   • Todo o código fonte (frontend + backend)"
echo "   • Configurações e scripts"
echo "   • Documentação completa"
echo "   • Guias de instalação detalhados"
echo "   • Estrutura de banco de dados"
echo "   • Exemplos de configuração"

echo ""
echo "📥 Para fazer download:"
echo "   1. Vá para a aba 'Files' no Replit"
echo "   2. Localize o arquivo: $ZIP_NAME"
echo "   3. Clique com botão direito > Download"

echo ""
echo "⚠️  IMPORTANTE:"
echo "   • Configure as variáveis de ambiente antes de executar"
echo "   • Verifique suas credenciais AWS"
echo "   • Teste a conectividade com o banco de dados"
