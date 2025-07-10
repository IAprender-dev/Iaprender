# MAPA VISUAL DE FORMULÁRIOS - SISTEMA IAPRENDER

## 📊 RESUMO EXECUTIVO

### Estatísticas Gerais
- **Total de formulários identificados:** 17
- **Precisam adaptação:** 13 (76.5%)
- **Já funcionais:** 4 (23.5%)
- **Prioridade ALTA:** 7 formulários
- **Prioridade MÉDIA:** 8 formulários
- **Prioridade BAIXA:** 2 formulários

---

## 🗂️ FORMULÁRIOS POR CATEGORIA

### 🔐 AUTENTICAÇÃO (3 formulários)
| Formulário | Status | Prioridade | Endpoint | Observações |
|------------|--------|------------|----------|-------------|
| **Login** | ✅ ATIVO | 🔴 ALTA | `POST /api/auth/login` | Funcional com useForm |
| **Registro** | ✅ ATIVO | 🔴 ALTA | `POST /api/auth/register` | Funcional com useForm |
| **AWS Cognito** | ✅ ATIVO | 🔴 ALTA | `GET /start-login` | Redirect para Cognito |

### 🏢 GESTÃO MUNICIPAL (5 formulários)
| Formulário | Status | Prioridade | Endpoint | Observações |
|------------|--------|------------|----------|-------------|
| **Criar Escola** | ⚠️ PRECISA_ADAPTACAO | 🔴 ALTA | `POST /api/municipal/schools` | Formulário inline |
| **Editar Escola** | ⚠️ PRECISA_ADAPTACAO | 🔴 ALTA | `PATCH /api/municipal/schools/:id` | Modal de edição |
| **Criar Diretor** | ⚠️ PRECISA_ADAPTACAO | 🔴 ALTA | `POST /api/municipal/directors` | Formulário inline |
| **Editar Diretor** | ⚠️ PRECISA_ADAPTACAO | 🟡 MEDIA | `PATCH /api/municipal/directors/:id` | Modal de edição |
| **Editar Contrato** | ⚠️ PRECISA_ADAPTACAO | 🟡 MEDIA | `PATCH /api/municipal/contracts/:id` | Sistema financeiro |

### 📚 EDUCACIONAL (3 formulários)
| Formulário | Status | Prioridade | Endpoint | Observações |
|------------|--------|------------|----------|-------------|
| **Plano de Aula** | ⚠️ PRECISA_ADAPTACAO | 🔴 ALTA | `POST /api/teacher/lesson-plans` | Integrado com IA |
| **Material Didático** | ⚠️ PRECISA_ADAPTACAO | 🟡 MEDIA | `POST /api/teacher/materials` | Upload de arquivos |
| **Criar Atividade** | ⚠️ PRECISA_ADAPTACAO | 🟡 MEDIA | `POST /api/teacher/activities` | Sistema de avaliação |

### 👤 PERFIL E CONFIGURAÇÃO (2 formulários)
| Formulário | Status | Prioridade | Endpoint | Observações |
|------------|--------|------------|----------|-------------|
| **Editar Perfil** | ⚠️ PRECISA_ADAPTACAO | 🟡 MEDIA | `PATCH /api/usuarios/me` | Múltiplos dashboards |
| **Primeiro Acesso** | ✅ ATIVO | 🔴 ALTA | `POST /api/users/complete-profile` | Onboarding |

### 🤖 IA E TOKENS (2 formulários)
| Formulário | Status | Prioridade | Endpoint | Observações |
|------------|--------|------------|----------|-------------|
| **Config IA** | ⚠️ PRECISA_ADAPTACAO | 🟡 MEDIA | `PATCH /api/admin/ai/config` | Admin apenas |
| **Config Tokens** | ⚠️ PRECISA_ADAPTACAO | 🟢 BAIXA | `PATCH /api/admin/tokens/config` | Monitoramento |

### 🎓 GESTÃO DE ALUNOS (2 formulários)
| Formulário | Status | Prioridade | Endpoint | Observações |
|------------|--------|------------|----------|-------------|
| **Matricular Aluno** | ⚠️ PRECISA_ADAPTACAO | 🔴 ALTA | `POST /api/alunos` | Sistema acadêmico |
| **Transferir Aluno** | ⚠️ PRECISA_ADAPTACAO | 🟡 MEDIA | `PATCH /api/alunos/:id/transfer` | Mobilidade escolar |

---

## 🎯 PLANO DE ADAPTAÇÃO PRIORIZADO

### 🔥 FASE 1 - CRÍTICOS (7 formulários)
> **Prazo sugerido:** 2-3 semanas
> **Impacto:** Sistema básico funcional

1. **Criar Escola** - Base do sistema municipal
2. **Editar Escola** - Gestão básica
3. **Criar Diretor** - Hierarquia administrativa
4. **Plano de Aula** - Ferramenta principal dos professores
5. **Matricular Aluno** - Processo acadêmico essencial
6. **Login** ✅ (Já pronto)
7. **Registro** ✅ (Já pronto)

### ⚡ FASE 2 - IMPORTANTES (6 formulários)
> **Prazo sugerido:** 3-4 semanas
> **Impacto:** Funcionalidades avançadas

1. **Editar Diretor** - Gestão de recursos humanos
2. **Editar Contrato** - Gestão financeira
3. **Material Didático** - Recursos pedagógicos
4. **Criar Atividade** - Sistema de avaliação
5. **Editar Perfil** - Personalização de usuários
6. **Transferir Aluno** - Mobilidade acadêmica
7. **Config IA** - Otimização de IA

### 🔧 FASE 3 - OPCIONAIS (1 formulário)
> **Prazo sugerido:** 1 semana
> **Impacto:** Otimizações administrativas

1. **Config Tokens** - Monitoramento avançado

---

## 📋 CAMPOS OBRIGATÓRIOS POR FORMULÁRIO

### 🏢 Gestão Municipal
```yaml
Criar Escola:
  - name (string, min: 2)
  - address (string, min: 10)
  - city (string, min: 2)
  - state (string, 2 chars)
  - contractId (number, exists)

Criar Diretor:
  - email (email, unique)
  - firstName (string, min: 2)
  - lastName (string, min: 2)
  - contractId (number, exists)
  - password (string, min: 8, strong)
```

### 📚 Educacional
```yaml
Plano de Aula:
  - titulo (string, min: 5)
  - disciplina (string, enum)
  - serie (string, enum)
  - objetivos (text, min: 20)
  - conteudo (text, min: 50)

Material Didático:
  - titulo (string, min: 5)
  - tipo (enum: pdf,video,imagem)
  - disciplina (string, enum)
  - descricao (text, min: 20)
```

### 🎓 Gestão de Alunos
```yaml
Matricular Aluno:
  - nome (string, min: 2)
  - cpf (string, valid_cpf)
  - email (email, unique)
  - serie (string, enum)
  - turma (string, min: 1)
```

---

## 🔍 VALIDAÇÕES ESPECÍFICAS IDENTIFICADAS

### 📝 Validações Brasileiras
- **CPF:** Algoritmo Mod 11, rejeição de sequências
- **CNPJ:** Algoritmo Mod 11, formatação automática
- **Telefone:** DDDs válidos ANATEL, celular/fixo
- **CEP:** 8 dígitos, auto-complete ViaCEP
- **INEP:** 8 dígitos, código escolar oficial

### 🔒 Validações de Segurança
- **Email único:** Verificação no banco de dados
- **Senha forte:** Mínimo 8 chars, maiúscula, número, especial
- **Campos obrigatórios:** Validação client + server
- **Rate limiting:** Proteção contra spam

### 📊 Validações de Negócio
- **Hierarquia:** Admin > Gestor > Diretor > Professor > Aluno
- **Empresa:** Filtros automáticos por empresa do usuário
- **Escola-Contrato:** Relacionamento obrigatório
- **Capacidades:** Limites de usuários por contrato

---

## 🛠️ TEMPLATES SUGERIDOS POR FORMULÁRIO

### 🎨 Templates de Base
1. **auth-login** - Simples, foco na UX
2. **auth-register** - Multi-step com validação
3. **escola-criar** - Complexo com auto-complete
4. **diretor-criar** - Hierárquico com roles
5. **plano-aula** - Educacional com IA
6. **aluno-criar** - Acadêmico com CPF

### 🔧 Recursos Necessários nos Templates
- ✅ Validação brasileira inline
- ✅ Formatação automática
- ✅ Auto-complete CEP
- ✅ Indicador de força da senha
- ✅ Upload de arquivos
- ✅ Navegação por Enter
- ✅ Estados de loading
- ✅ Feedback visual
- ✅ Responsividade mobile

---

## 📈 PRÓXIMOS PASSOS

### 1. Implementação Imediata
- [ ] Adaptar formulário "Criar Escola" (FASE 1)
- [ ] Adaptar formulário "Criar Diretor" (FASE 1)
- [ ] Adaptar formulário "Plano de Aula" (FASE 1)

### 2. Semana 2
- [ ] Adaptar formulários de edição (Escola/Diretor)
- [ ] Implementar sistema de upload para materiais
- [ ] Integrar validações brasileiras avançadas

### 3. Semana 3
- [ ] Finalizar formulários educacionais
- [ ] Implementar gestão de alunos
- [ ] Testes de integração completos

### 4. Validação Final
- [ ] Testes com usuários reais
- [ ] Performance e otimização
- [ ] Documentação para desenvolvedores

---

## 🏆 BENEFÍCIOS ESPERADOS

### 🎯 Padronização
- Design consistente em todos os formulários
- Validações uniformes
- Experiência de usuário otimizada

### ⚡ Performance
- Carregamento mais rápido
- Validação em tempo real
- Estados de loading claros

### 🔧 Manutenibilidade
- Código reutilizável
- Fácil adição de novos formulários
- Sistema de templates escalável

### 🛡️ Segurança
- Validações server-side robustas
- Proteção contra ataques
- Auditoria completa de ações

---

**Última atualização:** 10 de julho de 2025  
**Responsável:** Sistema de Mapeamento IAprender  
**Status:** Análise completa - Pronto para implementação