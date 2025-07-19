# 🎓 IAprender - Plataforma Educacional com IA

> Sistema completo de gestão educacional integrado com inteligência artificial, desenvolvido com arquitetura AWS nativa e tecnologias modernas.

![IAprender Logo](./assets/iaprender-logo.png)

## 🚀 **Visão Geral**

O IAprender é uma plataforma educacional de excelência que revoluciona o ensino através da integração de IA, oferecendo ferramentas avançadas para gestores, diretores, professores e alunos.

### **🏆 Características Principais**

- **🤖 IA Multi-Modelo**: Claude 3.5 Sonnet, GPT-4, Perplexity Pro
- **📊 Analytics Avançados**: Dashboards em tempo real com métricas CloudWatch
- **📚 Gestão Educacional**: Hierarquia completa com permissões
- **📄 Processamento de Documentos**: Upload, análise e geração automática
- **🔐 Segurança Empresarial**: AWS Cognito com MFA, permissões hierárquicas
- **⚡ Performance**: Cache Redis, Circuit Breaker, Retry Strategy
- **📈 Observabilidade**: Logs estruturados, métricas, alertas

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL 13+
- Conta AWS com Cognito configurado
- Git

### 1. Clonando o Repositório

```bash
git clone https://github.com/seu-usuario/iaprender.git
cd iaprender
```

### 2. Instalação de Dependências

```bash
npm install
```

### 3. Configuração do Banco de Dados

```bash
# Criar banco de dados
createdb iaprender

# Executar migrações
npm run db:push
```

### 4. Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL=postgresql://username:password@localhost:5432/iaprender

# AWS Cognito
AWS_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
AWS_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxx
AWS_COGNITO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxx
COGNITO_DOMAIN=https://your-domain.auth.us-east-1.amazoncognito.com

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura

# APIs de IA (opcional)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxx
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxx

# Configurações da Aplicação
NODE_ENV=development
PORT=5000
```

### 5. Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start

# Testes
npm run test
```

## 🔐 Configuração do AWS Cognito

### Passo 1: Criar User Pool

```bash
# Via AWS CLI
aws cognito-idp create-user-pool \
    --pool-name "IAprender-UserPool" \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": false
        }
    }'
```

### Passo 2: Configurar App Client

```bash
aws cognito-idp create-user-pool-client \
    --user-pool-id us-east-1_xxxxxxxx \
    --client-name "IAprender-Client" \
    --generate-secret \
    --explicit-auth-flows "ADMIN_NO_SRP_AUTH" "USER_PASSWORD_AUTH"
```

### Passo 3: Criar Grupos de Usuários

```bash
# Grupo Admin
aws cognito-idp create-group \
    --group-name "Admin" \
    --user-pool-id us-east-1_xxxxxxxx \
    --description "Administradores do sistema"

# Grupo Gestores
aws cognito-idp create-group \
    --group-name "Gestores" \
    --user-pool-id us-east-1_xxxxxxxx \
    --description "Gestores municipais"

# Grupo Diretores
aws cognito-idp create-group \
    --group-name "Diretores" \
    --user-pool-id us-east-1_xxxxxxxx \
    --description "Diretores escolares"

# Grupo Professores
aws cognito-idp create-group \
    --group-name "Professores" \
    --user-pool-id us-east-1_xxxxxxxx \
    --description "Professores"

# Grupo Alunos
aws cognito-idp create-group \
    --group-name "Alunos" \
    --user-pool-id us-east-1_xxxxxxxx \
    --description "Alunos"
```

### Passo 4: Configurar Atributos Customizados

```bash
aws cognito-idp add-custom-attributes \
    --user-pool-id us-east-1_xxxxxxxx \
    --custom-attributes '[
        {
            "Name": "empresa_id",
            "AttributeDataType": "Number",
            "Required": false,
            "Mutable": true
        }
    ]'
```

## 📚 Documentação da API

### Base URL

```
http://localhost:5000/api
```

### Autenticação

Todas as rotas protegidas requerem token JWT no header:

```bash
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Rate Limiting

- **Consultas**: 60 requests/min
- **Escritas**: 20 requests/min  
- **Transferências**: 10 requests/5min

## 🔑 Endpoints de Autenticação

### POST /auth/login

Realiza login no sistema.

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@escola.edu.br",
    "password": "senha123"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJSUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "usuario@escola.edu.br",
      "nome": "João Silva",
      "tipo_usuario": "professor",
      "empresa_id": 1
    }
  },
  "timestamp": "2025-07-09T21:30:00.000Z"
}
```

### GET /auth/me

Obtém dados do usuário logado.

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

### POST /auth/logout

Realiza logout do sistema.

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

## 👥 Endpoints de Usuários

### GET /usuarios

Lista usuários com filtros e paginação.

**Permissões**: Admin, Gestor

```bash
curl -X GET "http://localhost:5000/api/usuarios?page=1&limit=10&tipo_usuario=professor" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

**Parâmetros:**
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Limite por página (padrão: 20, máx: 100)
- `tipo_usuario` (opcional): admin, gestor, diretor, professor, aluno
- `status` (opcional): ativo, inativo, pendente, bloqueado
- `search` (opcional): Busca por nome ou email
- `empresa_id` (opcional): Filtro por empresa (apenas admin)

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "professor@escola.edu.br",
      "nome": "Maria Santos",
      "tipo_usuario": "professor",
      "empresa_id": 1,
      "status": "ativo",
      "criado_em": "2025-01-01T00:00:00.000Z"
    }
  ],
  "metadata": {
    "total": 50,
    "pagina": 1,
    "limite": 10,
    "totalPaginas": 5,
    "temProxima": true,
    "temAnterior": false
  }
}
```

### POST /usuarios

Cria novo usuário.

**Permissões**: Admin, Gestor

```bash
curl -X POST http://localhost:5000/api/usuarios \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "cognito_sub": "12345678-1234-1234-1234-123456789abc",
    "email": "novoprofessor@escola.edu.br",
    "nome": "João Silva",
    "tipo_usuario": "professor",
    "telefone": "(11) 98765-4321",
    "empresa_id": 1
  }'
```

**Campos obrigatórios:**
- `cognito_sub`: ID do usuário no AWS Cognito
- `email`: Email único
- `nome`: Nome completo
- `tipo_usuario`: Tipo do usuário

### GET /usuarios/:id

Busca usuário por ID.

**Permissões**: Próprio usuário ou hierarquia superior

```bash
curl -X GET http://localhost:5000/api/usuarios/1 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

### PUT /usuarios/:id

Atualiza dados do usuário.

**Permissões**: Próprio usuário ou hierarquia superior

```bash
curl -X PUT http://localhost:5000/api/usuarios/1 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva Santos",
    "telefone": "(11) 99999-8888"
  }'
```

## 🎓 Endpoints de Alunos

### GET /alunos

Lista alunos com controle hierárquico.

**Permissões**: Admin, Gestor, Diretor, Professor

```bash
curl -X GET "http://localhost:5000/api/alunos?escola_id=1&turma=9A" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

**Parâmetros:**
- `escola_id` (opcional): Filtro por escola
- `turma` (opcional): Filtro por turma
- `serie` (opcional): Filtro por série
- `turno` (opcional): manhã, tarde, integral
- `status` (opcional): ativo, inativo, transferido

### POST /alunos

Cria novo aluno.

**Permissões**: Admin, Gestor, Diretor

```bash
curl -X POST http://localhost:5000/api/alunos \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Ana Silva",
    "escola_id": 1,
    "turma": "9A",
    "serie": "9º Ano",
    "turno": "manhã",
    "nome_responsavel": "Maria Silva",
    "contato_responsavel": "(11) 98765-4321"
  }'
```

### GET /alunos/stats

Estatísticas de alunos.

**Permissões**: Admin, Gestor, Diretor

```bash
curl -X GET http://localhost:5000/api/alunos/stats \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total_alunos": 1250,
    "por_turno": {
      "manhã": 450,
      "tarde": 520,
      "integral": 280
    },
    "por_serie": {
      "1º Ano": 180,
      "2º Ano": 175,
      "3º Ano": 170
    },
    "por_status": {
      "ativo": 1200,
      "inativo": 30,
      "transferido": 20
    }
  }
}
```

### POST /alunos/:id/transferir

Transfere aluno para outra escola.

**Permissões**: Admin, Gestor

```bash
curl -X POST http://localhost:5000/api/alunos/1/transferir \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "escola_destino_id": 2,
    "motivo": "Mudança de endereço",
    "data_transferencia": "2025-02-01"
  }'
```

## 🏢 Endpoints de Empresas

### GET /empresas

Lista empresas.

**Permissões**: Admin

```bash
curl -X GET http://localhost:5000/api/empresas \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

### POST /empresas

Cria nova empresa.

**Permissões**: Admin

```bash
curl -X POST http://localhost:5000/api/empresas \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Prefeitura Municipal de São Paulo",
    "cnpj": "46.395.000/0001-39",
    "telefone": "(11) 3113-9000",
    "email_contato": "educacao@prefeitura.sp.gov.br",
    "endereco": "Rua da Consolação, 1530",
    "cidade": "São Paulo",
    "estado": "SP"
  }'
```

## 🏫 Endpoints de Escolas

### GET /escolas

Lista escolas.

**Permissões**: Admin, Gestor (própria empresa), Diretor (própria escola)

```bash
curl -X GET "http://localhost:5000/api/escolas?empresa_id=1" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

### POST /escolas

Cria nova escola.

**Permissões**: Admin, Gestor

```bash
curl -X POST http://localhost:5000/api/escolas \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "contrato_id": 1,
    "nome": "EMEF João Silva",
    "codigo_inep": "35123456",
    "tipo_escola": "municipal",
    "telefone": "(11) 3456-7890",
    "email": "contato@emefjsilva.edu.br",
    "endereco": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP"
  }'
```

## 📊 Códigos de Resposta HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Erro de validação |
| 401 | Não autenticado |
| 403 | Não autorizado |
| 404 | Recurso não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

## 🔍 Estrutura de Respostas

### Resposta de Sucesso

```json
{
  "success": true,
  "data": { /* dados solicitados */ },
  "metadata": { /* metadados opcionais */ },
  "timestamp": "2025-07-09T21:30:00.000Z"
}
```

### Resposta de Erro

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos fornecidos",
    "details": {
      "campo": "email",
      "valor": "email-inválido",
      "motivo": "Formato de email inválido"
    }
  },
  "timestamp": "2025-07-09T21:30:00.000Z"
}
```

## 🔐 Validações Brasileiras

### CPF

```bash
# Formato aceito: XXX.XXX.XXX-XX
curl -X POST http://localhost:5000/api/usuarios \
  -d '{"documento": "123.456.789-10"}'
```

### CNPJ

```bash
# Formato aceito: XX.XXX.XXX/XXXX-XX
curl -X POST http://localhost:5000/api/empresas \
  -d '{"cnpj": "11.222.333/0001-81"}'
```

### Telefone

```bash
# Formatos aceitos:
# Celular: (XX) 9XXXX-XXXX
# Fixo: (XX) XXXX-XXXX
curl -X POST http://localhost:5000/api/usuarios \
  -d '{"telefone": "(11) 98765-4321"}'
```

### DDDs Válidos

Todos os 67 DDDs brasileiros são validados conforme ANATEL:
- SP: 11, 12, 13, 14, 15, 16, 17, 18, 19
- RJ: 21, 22, 24
- ES: 27, 28
- MG: 31, 32, 33, 34, 35, 37, 38
- E todos os demais estados...

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Apenas autenticação
npm run test:auth

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

### Testes Disponíveis

- **Autenticação JWT**: Tokens válidos, inválidos, expirados
- **Controle de Acesso**: Hierarquia de permissões
- **CRUD Completo**: Usuários, alunos, empresas, escolas
- **Validações**: CPF, CNPJ, email, telefone
- **Performance**: Tempo de resposta, rate limiting

## 📈 Monitoramento

### Logs de Auditoria

```json
{
  "timestamp": "2025-07-09T21:30:00.000Z",
  "usuario_id": 1,
  "acao": "CRIAR_USUARIO",
  "recurso": "usuarios",
  "detalhes": {
    "usuario_criado_id": 15,
    "tipo_usuario": "professor"
  },
  "ip": "192.168.1.100",
  "user_agent": "Mozilla/5.0..."
}
```

### Métricas de Performance

- **Tempo de resposta médio**: < 100ms
- **Taxa de erro**: < 1%
- **Rate limit hits**: < 0.1%
- **Uptime**: > 99.9%

## 🔧 Troubleshooting

### Erro de Conexão com Banco

```bash
# Verificar conexão
psql -h localhost -U username -d iaprender -c "SELECT 1;"

# Verificar tabelas
npm run db:push
```

### Erro de Autenticação AWS Cognito

```bash
# Verificar configurações
aws cognito-idp describe-user-pool --user-pool-id us-east-1_xxxxxxxx

# Testar token
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_xxxxxxxx \
  --username usuario@escola.edu.br
```

### Rate Limit Atingido

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Muitas requisições. Tente novamente em 60 segundos.",
    "retry_after": 60
  }
}
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Email**: suporte@iaprender.com.br
- **Documentação**: [docs.iaprender.com.br](https://docs.iaprender.com.br)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/iaprender/issues)

---

**IAprender** - Transformando a educação brasileira com inteligência artificial 🇧🇷