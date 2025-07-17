# Segurança de Autenticação Melhorada - IAverse

## Visão Geral

Sistema de autenticação seguro implementado em português brasileiro com melhorias de segurança avançadas para proteger a plataforma contra ataques e garantir integridade dos dados de 100k+ usuários.

## Componentes Implementados

### 1. AuthMiddlewareUnified (Middleware de Autenticação Unificado)

**Arquivo:** `server/middleware/authMiddlewareUnified.ts`

#### Características Principais:
- **Mensagens em português brasileiro** em todas as respostas
- **Rate limiting inteligente** com diferentes limites para cada tipo de operação
- **Controle de acesso hierárquico** baseado em roles e grupos
- **Sistema de logging de segurança** para auditoria
- **Detecção de tentativas de força bruta** com bloqueio automático

#### Rate Limiting Implementado:
- **Login**: 5 tentativas por IP/User-Agent em 15 minutos
- **API Geral**: 100 requisições por minuto
- **Admin**: 20 operações administrativas por 5 minutos

#### Funcionalidades de Segurança:
- **Score de Risco**: Cálculo automático baseado em:
  - Tentativas de login anteriores
  - User-Agent suspeito
  - IPs bloqueados
  - Padrões de comportamento
- **Bloqueio Automático**: IPs com score > 80 são bloqueados
- **Limpeza Automática**: Dados de segurança são limpos a cada hora

### 2. CognitoJWTVerifier Melhorado

**Arquivo:** `server/services/CognitoJWTVerifier.ts`

#### Melhorias Implementadas:
- **Respostas estruturadas** com `{ success: boolean, user?, error? }`
- **Mensagens de erro em português**
- **Validação aprimorada** de formato de token
- **Extração robusta** de informações do usuário
- **Tratamento de erros consistente**

### 3. Rotas S3 Atualizadas

**Arquivo:** `server/routes/s3-documents.ts`

#### Atualizações de Segurança:
- **Migração para middleware unificado**
- **Respostas padronizadas em português**
- **Códigos de erro específicos**
- **Validação aprimorada de usuário**
- **Logs de segurança detalhados**

## Estrutura de Respostas

### Formato Padronizado (Português)
```json
{
  "sucesso": true/false,
  "erro": "Mensagem de erro em português",
  "codigo": "CODIGO_ERRO_ESPECIFICO",
  "dados": { /* dados da resposta */ }
}
```

### Códigos de Erro Implementados
- `LIMITE_LOGIN_EXCEDIDO`: Rate limit de login excedido
- `LIMITE_API_EXCEDIDO`: Rate limit de API excedido
- `BLOQUEADO_SEGURANCA`: Acesso bloqueado por segurança
- `TOKEN_AUSENTE`: Token não fornecido
- `TOKEN_FORMATO_INVALIDO`: Formato de token inválido
- `TOKEN_INVALIDO`: Token inválido ou expirado
- `USUARIO_NAO_ENCONTRADO`: Usuário não existe no sistema
- `USUARIO_INATIVO`: Usuário com status inativo
- `NAO_AUTENTICADO`: Usuário não autenticado
- `PERMISSAO_INSUFICIENTE`: Permissões insuficientes
- `ACESSO_GRUPO_NEGADO`: Acesso negado para grupo
- `ERRO_INTERNO`: Erro interno do servidor

## Middleware de Segurança

### Métodos Principais

#### `autenticar()`
- Middleware principal de autenticação
- Verificação de token JWT do AWS Cognito
- Validação de usuário no banco local
- Cálculo de score de risco
- Logging de eventos de segurança

#### `exigirRole(roles: string[])`
- Verificação de roles específicos
- Suporte a múltiplos roles
- Logging de tentativas de acesso negadas

#### `exigirGrupo(grupos: string[])`
- Verificação de grupos do AWS Cognito
- Controle de acesso baseado em grupos
- Auditoria de acessos por grupo

#### Métodos de Conveniência:
- `exigirAdmin()`: Apenas administradores
- `exigirGestorOuSuperior()`: Gestores e superiores
- `exigirDiretorOuSuperior()`: Diretores e superiores

## Sistema de Logging

### Eventos de Segurança Monitorados:
- `ACESSO_BLOQUEADO_RISCO_ALTO`: Bloqueio por risco alto
- `TOKEN_AUSENTE`: Tentativa sem token
- `TOKEN_FORMATO_INVALIDO`: Formato de token inválido
- `VERIFICACAO_TOKEN_FALHOU`: Falha na verificação
- `USUARIO_NAO_ENCONTRADO`: Usuário não encontrado
- `USUARIO_INATIVO`: Usuário inativo
- `AUTENTICACAO_SUCESSO`: Autenticação bem-sucedida
- `PERMISSAO_INSUFICIENTE`: Permissões insuficientes
- `ACESSO_GRUPO_NEGADO`: Acesso negado por grupo
- `ERRO_AUTENTICACAO`: Erro na autenticação

### Estrutura do Log:
```json
{
  "evento": "TIPO_EVENTO",
  "timestamp": "2025-01-17T14:30:00.000Z",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "scoreRisco": 25,
  "detalhes": {
    "usuarioId": "user-123",
    "tipoUsuario": "professor"
  }
}
```

## Controle Hierárquico

### Hierarquia de Roles:
1. **Admin/AdminMaster/Administrador** (Nível mais alto)
2. **Gestor/GestorMunicipal**
3. **Diretor**
4. **Professor**
5. **Aluno** (Nível básico)

### Permissões por Nível:
- **Admin**: Acesso total a todas as funcionalidades
- **Gestor**: Gerenciamento de escolas e contratos
- **Diretor**: Gestão escolar e professores
- **Professor**: Ferramentas educacionais
- **Aluno**: Acesso a conteúdo educacional

## Medidas de Segurança Implementadas

### 1. Proteção contra Força Bruta
- Limite de 5 tentativas de login por 15 minutos
- Bloqueio automático de IPs suspeitos
- Incremento progressivo de penalidades

### 2. Validação de Token
- Verificação de formato JWT
- Validação de assinatura com chaves públicas do AWS Cognito
- Verificação de expiração e audiência

### 3. Monitoramento de Segurança
- Logging detalhado de eventos
- Cálculo de score de risco
- Detecção de padrões suspeitos

### 4. Rate Limiting
- Limites diferenciados por tipo de operação
- Proteção contra spam e DDoS
- Mensagens informativas em português

## Configuração e Uso

### Importação:
```typescript
import { authMiddleware } from '../middleware/authMiddlewareUnified.js';
```

### Uso Básico:
```typescript
// Autenticação obrigatória
router.use(authMiddleware.autenticar);

// Apenas administradores
router.use(authMiddleware.exigirAdmin());

// Gestores ou superiores
router.use(authMiddleware.exigirGestorOuSuperior());

// Rate limiting
router.use(authMiddleware.aplicarLimitador('api'));
```

## Melhorias Futuras

### 1. Autenticação Multifator (MFA)
- Implementação de SMS/Email
- Códigos TOTP
- Biometria (futuro)

### 2. Geolocalização
- Detecção de países suspeitos
- Alerta de login de nova localização
- Bloqueio automático por região

### 3. Análise Comportamental
- Detecção de padrões anômalos
- Machine learning para detecção de fraudes
- Análise de horários de acesso

### 4. Integração com SIEM
- Envio de logs para sistemas centralizados
- Alertas em tempo real
- Correlação de eventos

## Status Atual

✅ **Implementado e Funcional:**
- Middleware de autenticação unificado
- Rate limiting inteligente
- Sistema de logging em português
- Controle hierárquico de acesso
- Validação robusta de tokens
- Proteção contra força bruta

🔄 **Em Desenvolvimento:**
- Integração com todos os endpoints
- Testes de segurança automatizados
- Documentação de API completa

🚀 **Próximos Passos:**
- Implementar MFA
- Adicionar geolocalização
- Integrar com SIEM
- Testes de penetração

---

**Última Atualização:** 17 de Janeiro de 2025
**Versão:** 1.0.0
**Autor:** Sistema de Segurança IAverse