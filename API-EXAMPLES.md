# 🔧 Exemplos Práticos da API - IAprender

Este documento contém exemplos práticos de uso da API do IAprender para diferentes cenários.

## 🚀 Configuração Inicial

### Variáveis de Ambiente para Testes

```bash
export API_BASE_URL="http://localhost:5000/api"
export ADMIN_TOKEN="eyJhbGciOiJSUzI1NiIs..."
export GESTOR_TOKEN="eyJhbGciOiJSUzI1NiIs..."
```

## 📋 Cenários Completos de Uso

### 1. Fluxo de Cadastro de Nova Escola

```bash
# 1. Admin cria nova empresa
curl -X POST $API_BASE_URL/empresas \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Secretaria Municipal de Educação de Santos",
    "cnpj": "58.200.015/0001-43",
    "telefone": "(13) 3201-5000",
    "email_contato": "educacao@santos.sp.gov.br",
    "endereco": "Praça Mauá, 65",
    "cidade": "Santos",
    "estado": "SP"
  }'

# 2. Admin cria contrato para a empresa
curl -X POST $API_BASE_URL/contratos \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "empresa_id": 3,
    "descricao": "Contrato Anual - Secretaria Santos 2025",
    "data_inicio": "2025-01-01",
    "data_fim": "2025-12-31",
    "numero_licencas": 800,
    "valor_total": 96000.00
  }'

# 3. Admin cria usuário gestor
curl -X POST $API_BASE_URL/usuarios \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cognito_sub": "gestor-santos-2025",
    "email": "gestor@santos.sp.gov.br",
    "nome": "Carlos Roberto Santos",
    "tipo_usuario": "gestor",
    "empresa_id": 3,
    "telefone": "(13) 99876-5432",
    "documento": "123.456.789-00"
  }'

# 4. Gestor cria escola
curl -X POST $API_BASE_URL/escolas \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contrato_id": 3,
    "nome": "EMEF Martins Fontes",
    "codigo_inep": "35654789",
    "tipo_escola": "municipal",
    "telefone": "(13) 3289-1500",
    "email": "emef.martinsfontes@santos.sp.gov.br",
    "endereco": "Rua Silva Jardim, 136",
    "cidade": "Santos",
    "estado": "SP"
  }'
```

### 2. Matrícula Completa de Aluno

```bash
# 1. Gestor cria usuário diretor para a escola
curl -X POST $API_BASE_URL/usuarios \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cognito_sub": "diretor-martins-fontes",
    "email": "diretor@emefmartinsfontes.santos.sp.gov.br",
    "nome": "Ana Paula Oliveira",
    "tipo_usuario": "diretor",
    "empresa_id": 3,
    "telefone": "(13) 98765-4321"
  }'

# 2. Diretor cria usuário professor
curl -X POST $API_BASE_URL/usuarios \
  -H "Authorization: Bearer $DIRETOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cognito_sub": "prof-matematica-santos",
    "email": "matematica@emefmartinsfontes.santos.sp.gov.br",
    "nome": "José Carlos Silva",
    "tipo_usuario": "professor",
    "empresa_id": 3
  }'

# 3. Diretor cadastra dados específicos do professor
curl -X POST $API_BASE_URL/professores \
  -H "Authorization: Bearer $DIRETOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "usr_id": 25,
    "escola_id": 3,
    "nome": "José Carlos Silva",
    "disciplinas": ["Matemática", "Física"],
    "formacao": "Licenciatura em Matemática - USP",
    "data_admissao": "2025-01-15"
  }'

# 4. Diretor matricula aluno
curl -X POST $API_BASE_URL/alunos \
  -H "Authorization: Bearer $DIRETOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Marina Santos Silva",
    "escola_id": 3,
    "turma": "8A",
    "serie": "8º Ano",
    "turno": "manhã",
    "nome_responsavel": "Maria Santos Silva",
    "contato_responsavel": "(13) 99654-3210",
    "endereco": "Rua das Palmeiras, 45",
    "data_nascimento": "2011-03-15"
  }'
```

### 3. Consultas e Relatórios

```bash
# 1. Gestor consulta estatísticas da empresa
curl -X GET "$API_BASE_URL/empresas/3/stats" \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# 2. Diretor consulta alunos da escola
curl -X GET "$API_BASE_URL/alunos?escola_id=3&turno=manhã&page=1&limit=20" \
  -H "Authorization: Bearer $DIRETOR_TOKEN"

# 3. Professor consulta alunos da turma
curl -X GET "$API_BASE_URL/alunos?turma=8A&serie=8º Ano" \
  -H "Authorization: Bearer $PROFESSOR_TOKEN"

# 4. Relatório de frequência mensal
curl -X GET "$API_BASE_URL/alunos/stats?periodo=2025-01&escola_id=3" \
  -H "Authorization: Bearer $DIRETOR_TOKEN"
```

## 🔍 Consultas Avançadas com Filtros

### Busca de Usuários por Múltiplos Critérios

```bash
# Buscar professores ativos com formação específica
curl -X GET "$API_BASE_URL/usuarios?tipo_usuario=professor&status=ativo&search=matemática&page=1&limit=50" \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# Buscar alunos por série e turno
curl -X GET "$API_BASE_URL/alunos?serie=9º Ano&turno=tarde&status=ativo&orderBy=nome" \
  -H "Authorization: Bearer $DIRETOR_TOKEN"

# Buscar escolas por estado e tipo
curl -X GET "$API_BASE_URL/escolas?estado=SP&tipo_escola=municipal&status=ativa" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Consultas com Paginação

```bash
# Primeira página
curl -X GET "$API_BASE_URL/usuarios?page=1&limit=10" \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# Resposta com metadados de paginação
{
  "success": true,
  "data": [...],
  "metadata": {
    "total": 150,
    "pagina": 1,
    "limite": 10,
    "totalPaginas": 15,
    "temProxima": true,
    "temAnterior": false
  }
}

# Próxima página
curl -X GET "$API_BASE_URL/usuarios?page=2&limit=10" \
  -H "Authorization: Bearer $GESTOR_TOKEN"
```

## 🔄 Operações de Atualização

### Atualização de Dados do Usuário

```bash
# Professor atualiza próprio perfil
curl -X PUT $API_BASE_URL/usuarios/25 \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telefone": "(13) 99999-8888",
    "endereco": "Rua Nova, 123 - Apartamento 45"
  }'

# Gestor atualiza dados de professor
curl -X PUT $API_BASE_URL/usuarios/25 \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "José Carlos Silva Santos",
    "telefone": "(13) 99999-8888",
    "status": "ativo"
  }'
```

### Transferência de Aluno

```bash
# Transferir aluno para outra escola
curl -X POST $API_BASE_URL/alunos/50/transferir \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "escola_destino_id": 4,
    "motivo": "Mudança de endereço familiar",
    "data_transferencia": "2025-02-01",
    "observacoes": "Aluno com bom desempenho acadêmico"
  }'
```

## 📊 Endpoints de Estatísticas

### Dashboard do Gestor

```bash
# Estatísticas gerais da empresa
curl -X GET $API_BASE_URL/dashboard/gestor \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# Resposta esperada
{
  "success": true,
  "data": {
    "escolas": {
      "total": 15,
      "ativas": 14,
      "em_construcao": 1
    },
    "usuarios": {
      "diretores": 14,
      "professores": 120,
      "alunos": 3500
    },
    "contratos": {
      "ativos": 2,
      "valor_total": 240000.00,
      "licencas_utilizadas": 3634,
      "licencas_disponiveis": 4366
    },
    "atividade_recente": [
      {
        "tipo": "nova_matricula",
        "escola": "EMEF Martins Fontes",
        "detalhes": "3 novos alunos matriculados",
        "timestamp": "2025-07-09T14:30:00Z"
      }
    ]
  }
}
```

### Dashboard do Diretor

```bash
# Estatísticas da escola
curl -X GET $API_BASE_URL/dashboard/diretor \
  -H "Authorization: Bearer $DIRETOR_TOKEN"

# Estatísticas de alunos por turma
curl -X GET "$API_BASE_URL/alunos/stats?escola_id=3&agrupor=turma" \
  -H "Authorization: Bearer $DIRETOR_TOKEN"
```

## 🔐 Exemplos de Validação de Acesso

### Teste de Permissões Hierárquicas

```bash
# Admin acessa dados de qualquer empresa (✅ Permitido)
curl -X GET $API_BASE_URL/usuarios?empresa_id=1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Gestor tenta acessar dados de outra empresa (❌ Negado)
curl -X GET $API_BASE_URL/usuarios?empresa_id=2 \
  -H "Authorization: Bearer $GESTOR_TOKEN"
# Resposta: 403 Forbidden

# Professor tenta criar usuário (❌ Negado)
curl -X POST $API_BASE_URL/usuarios \
  -H "Authorization: Bearer $PROFESSOR_TOKEN" \
  -d '{"nome": "Teste"}'
# Resposta: 403 Forbidden

# Aluno tenta acessar dados de outro aluno (❌ Negado)
curl -X GET $API_BASE_URL/alunos/999 \
  -H "Authorization: Bearer $ALUNO_TOKEN"
# Resposta: 403 Forbidden
```

## 🔍 Depuração e Logs

### Consultar Logs de Auditoria

```bash
# Admin consulta logs de ações de um usuário
curl -X GET "$API_BASE_URL/audit/logs?usuario_id=25&data_inicio=2025-07-01&data_fim=2025-07-09" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Consultar tentativas de acesso negado
curl -X GET "$API_BASE_URL/audit/access-denied?periodo=7d" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Verificar Status do Sistema

```bash
# Health check básico
curl -X GET http://localhost:5000/health

# Status detalhado (apenas admin)
curl -X GET $API_BASE_URL/system/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Resposta do status detalhado
{
  "success": true,
  "data": {
    "database": {
      "status": "healthy",
      "conexoes_ativas": 5,
      "tempo_resposta_ms": 12
    },
    "aws_cognito": {
      "status": "healthy",
      "user_pool": "us-east-1_4jqF97H2X",
      "ultimo_sync": "2025-07-09T21:15:00Z"
    },
    "rate_limiting": {
      "requests_por_minuto": 1250,
      "bloqueios_ativo": 2
    },
    "memoria": {
      "uso_mb": 245,
      "disponivel_mb": 755
    }
  }
}
```

## 📈 Monitoramento e Performance

### Métricas de Performance

```bash
# Consultar métricas de endpoints
curl -X GET "$API_BASE_URL/metrics/endpoints?periodo=24h" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Tempo de resposta por endpoint
curl -X GET "$API_BASE_URL/metrics/response-time?endpoint=/usuarios&periodo=7d" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Rate Limiting

```bash
# Testar limite de requests
for i in {1..70}; do
  echo "Request $i:"
  curl -X GET $API_BASE_URL/usuarios/me \
    -H "Authorization: Bearer $PROFESSOR_TOKEN" \
    -w "Status: %{http_code}, Tempo: %{time_total}s\n" \
    -s -o /dev/null
  sleep 0.1
done

# Após 60 requests/min, retornará:
# Status: 429, Rate limit exceeded
```

## 🧪 Testes de Validação

### Validação de CPF

```bash
# CPF válido
curl -X POST $API_BASE_URL/usuarios \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"documento": "123.456.789-09"}'

# CPF inválido
curl -X POST $API_BASE_URL/usuarios \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"documento": "123.456.789-00"}'
# Resposta: 400 Bad Request - CPF inválido
```

### Validação de CNPJ

```bash
# CNPJ válido
curl -X POST $API_BASE_URL/empresas \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"cnpj": "11.222.333/0001-81"}'

# CNPJ inválido
curl -X POST $API_BASE_URL/empresas \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"cnpj": "11.222.333/0001-99"}'
# Resposta: 400 Bad Request - CNPJ inválido
```

### Validação de Telefone Brasileiro

```bash
# Telefone celular válido
curl -X POST $API_BASE_URL/usuarios \
  -d '{"telefone": "(11) 98765-4321"}'

# Telefone fixo válido
curl -X POST $API_BASE_URL/usuarios \
  -d '{"telefone": "(11) 3456-7890"}'

# DDD inválido
curl -X POST $API_BASE_URL/usuarios \
  -d '{"telefone": "(99) 98765-4321"}'
# Resposta: 400 Bad Request - DDD inválido
```

## 🔄 Scripts de Automação

### Script de Backup de Dados

```bash
#!/bin/bash
# backup-daily.sh

echo "Iniciando backup diário..."

# Backup do banco de dados
pg_dump $DATABASE_URL > "backup_$(date +%Y%m%d).sql"

# Backup de logs de auditoria
curl -X GET "$API_BASE_URL/audit/export?periodo=1d" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o "audit_logs_$(date +%Y%m%d).json"

echo "Backup concluído!"
```

### Script de Sincronização Cognito

```bash
#!/bin/bash
# sync-cognito.sh

echo "Sincronizando usuários do AWS Cognito..."

curl -X POST $API_BASE_URL/admin/sync-cognito \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

echo "Sincronização concluída!"
```

Este guia fornece exemplos práticos para todas as principais funcionalidades da API do IAprender, incluindo cenários completos de uso, validações e monitoramento.