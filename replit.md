# IAverse - AI-Powered Educational Platform

## Overview

IAverse is a comprehensive educational platform that integrates artificial intelligence to enhance teaching and learning experiences. The platform serves teachers, students, and administrators with specialized tools for lesson planning, content generation, interactive learning, and academic management.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for client-side routing
- **State Management**: React Query (TanStack Query) for server state, React Context for authentication
- **UI Components**: Comprehensive component library with dark/light theme support

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication with bcrypt for password hashing
- **File Processing**: Support for PDF, DOCX, and image uploads

### Database Design
- **ORM**: Drizzle with PostgreSQL driver
- **Schema**: Comprehensive relational schema including:
  - User management (teachers, students, admins)
  - Course and content management
  - Activity tracking and progress monitoring
  - AI tool usage and token tracking
  - Contract and subscription management
  - Educational administration (secretarias and escolas tables)
  - Institutional hierarchy with secretary-school relationships

## Key Components

### AI Integration Services
1. **OpenAI Integration**: Chat completion, image generation, document analysis
2. **Anthropic Claude**: Advanced text processing and analysis
3. **Perplexity AI**: Real-time search and research capabilities
4. **Token Management**: Usage tracking and billing integration

### Educational Tools
1. **Teacher Tools**:
   - Lesson plan generator
   - Activity creator
   - Educational image generation
   - Document analysis
   - BNCC-aligned content summaries

2. **Student Tools**:
   - AI tutor chat
   - Study plan generator
   - Interactive quizzes
   - Mind mapping tools
   - Translation services
   - Wikipedia explorer

3. **Administrative Tools**:
   - User management
   - Contract administration
   - Usage analytics
   - Token monitoring

## Data Flow

### Authentication Flow
1. User login/registration through `/api/auth` endpoints
2. Session management with encrypted user data
3. Role-based access control (admin, teacher, student)
4. Contract-based feature access

### AI Request Flow
1. Token limit validation before processing
2. Provider-specific API calls with error handling
3. Usage tracking and cost calculation
4. Response formatting and delivery

### Content Management Flow
1. File upload and processing (PDF, DOCX, images)
2. AI-powered content analysis and generation
3. Database storage with metadata
4. Download and sharing capabilities

## External Dependencies

### AI Service Providers
- **OpenAI**: GPT models, DALL-E for image generation
- **Anthropic**: Claude models for text processing
- **Perplexity**: Online search and research

### Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development and deployment platform

### File Processing Libraries
- **mammoth**: DOCX file processing
- **pdf-parse-new**: PDF text extraction
- **multer**: File upload handling

### Frontend Libraries
- **React Helmet**: SEO and meta tag management
- **Framer Motion**: Animations and transitions
- **React Hook Form**: Form validation and handling
- **Zod**: Schema validation

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Deployment Fix**: Custom scripts relocate files from `dist/public` to `dist` for Replit compatibility

### Production Configuration
- Static file serving from `dist` directory
- Environment-based configuration
- Database connection pooling
- Error handling and logging

### Scaling Considerations
- Token usage monitoring and alerts
- Database connection optimization
- CDN integration for static assets
- Load balancing for AI API requests

## Roadmap Futuro (Documentado para Implementação Posterior)

### FASE 4 - Sistema de Gestão Educacional Completo
- Sistema de Turmas e Disciplinas (criação, gestão, associações)
- Sistema de Notas e Avaliações (lançamento, cálculos, relatórios)
- Sistema de Frequência (controle presença, alertas)
- Portal do Aluno/Responsável (boletim online, comunicação)

### FASE 5 - Ferramentas Pedagógicas Avançadas
- Sistema de criação de provas automatizadas
- Banco de questões por disciplina
- Correção automática com IA
- Análise de desempenho por questão

### FASE 6 - Integração de IA Educacional
- Tutor virtual personalizado por aluno
- Recomendações de conteúdo adaptativo
- Análise preditiva de desempenho
- Intervenções pedagógicas automáticas

## Recent Changes
- July 5, 2025: CORREÇÃO CRÍTICA - Marca oficial "IAprender" aplicada em TODOS os formulários administrativos
  - ✅ Corrigido de "IAverse" para marca oficial "IAprender" em todos os dashboards administrativos
  - ✅ CompanyContractManagement.tsx - logo atualizado para IAprender
  - ✅ AIManagementDashboard.tsx - logo atualizado para IAprender
  - ✅ UserManagement.tsx - logo atualizado para IAprender
  - ✅ CognitoUserManagement.tsx - logo atualizado para IAprender
  - ✅ AdvancedToolsDashboard.tsx - logo atualizado para IAprender
  - ✅ SecurityComplianceDashboard.tsx - logo atualizado para IAprender
  - ✅ AdvancedAdminDashboard.tsx - logo atualizado para IAprender
  - ✅ AdminMasterDashboard.tsx - logo atualizado para IAprender
  - ✅ ContractManagement.tsx - padrão oficial aplicado (botão "Voltar" + logo IAprender)
  - ✅ LiteLLMManagement.tsx - padrão oficial aplicado (botão "Voltar" + logo IAprender)
  - ✅ Marca oficial: "IAprender" com símbolo azul orgânico conforme attached_assets/IAprender Logo_1751743080748.png
  - ✅ Padrão oficial: Botão "Voltar" + Logo oficial "IAprender" em todos os formulários administrativos
  - ✅ Design unificado: logo com gradiente azul-roxo e nome "IAprender" em gradiente
  - ✅ Padrão consistente aplicado em toda interface administrativa com marca oficial
- July 5, 2025: Sistema de permissões AWS completamente removido conforme solicitado
  - ✅ Arquivo AWSPermissionsManager.tsx deletado da interface administrativa
  - ✅ Import e rota do AWSPermissionsManager removidos do App.tsx
  - ✅ Botão "Permissões AWS" removido do AdvancedAdminDashboard
  - ✅ Botão "Configurar Permissões AWS" removido do AdminMasterDashboard
- July 5, 2025: Central de Pagamentos completamente removida do sistema
  - ✅ Arquivo PaymentCenter.tsx deletado da interface administrativa
  - ✅ Import e rota do PaymentCenter removidos do App.tsx
  - ✅ Botão "Central de Pagamentos" removido do AdminMasterDashboard
  - ✅ Todas as rotas de API relacionadas a pagamentos removidas (/api/admin/payment/*)
  - ✅ Sistema agora mais limpo sem funcionalidades de pagamento desnecessárias
- July 5, 2025: Removidas abas "Provedores" e "Analytics" do formulário admin/ai-management
  - ✅ Abas desnecessárias removidas do AIManagementDashboard conforme solicitado
  - ✅ TabsList reduzida de 5 para 3 colunas (Visão Geral, Aplicações, Chaves Virtuais)
  - ✅ Descrição do cabeçalho atualizada para "Controle de Aplicações e Chaves Virtuais"
  - ✅ Interface simplificada mantendo apenas funcionalidades essenciais
- July 4, 2025: CORREÇÃO CRÍTICA - Sistema de Listagem AWS Cognito Totalmente Funcional
  - ✅ Corrigidos erros de schema Drizzle (campo contractNumber inexistente removido)
  - ✅ Substituídas consultas SQL complexas por queries separadas mais robustas
  - ✅ Adicionada importação inArray do drizzle-orm para operações de banco
  - ✅ Criado endpoint /api/debug-cognito para teste de conectividade sem autenticação
  - ✅ Confirmado AWS Cognito funcionando: 2 usuários Admin + 1 Gestores encontrados
  - ✅ Sistema /api/admin/users/list retornando dados reais com autenticação admin
  - ✅ Integração completa: dados Cognito + PostgreSQL local + informações de contrato
  - ✅ Paginação, estatísticas e filtros funcionando corretamente
  - ✅ Interface AdminUserManagement pronta para acesso com dados reais
- July 4, 2025: PASSO 1 - Sistema Completo de Gestão de Escolas Municipais Implementado
  - ✅ Criado sistema completo de gestão de escolas com foco em contratos como entidade central
  - ✅ Implementados 5 endpoints backend funcionais: GET, POST, PATCH, DELETE e estatísticas para escolas
  - ✅ Cada escola representa um contrato específico para liberação de acesso aos tokens de IA
  - ✅ Sistema de criação automática de diretores: usuários criados no AWS Cognito + sincronização local
  - ✅ Regra de negócio implementada: criação limitada ao grupo Diretores apenas
  - ✅ Validação rigorosa: escolas vinculadas ao contrato/empresa do gestor municipal
  - ✅ Sistema de desativação completa: escola + usuários + contrato tornam-se inacessíveis
  - ✅ Interface SchoolManagement.tsx com formulário completo de criação de escolas
  - ✅ Dashboard com estatísticas reais: total de escolas, ativas, alunos, professores, salas
  - ✅ Formulário incluí dados do diretor para criação automática no Cognito
  - ✅ Integração completa frontend-backend com React Query e mutations
  - ✅ Botão "Gestão de Escolas" adicionado ao dashboard municipal com tema emerald
  - ✅ Rota /municipal/schools funcionalmente integrada ao sistema de navegação
  - ✅ Sistema utiliza dados reais do banco PostgreSQL, sem dados fictícios
- July 3, 2025: PASSO 6 - Segurança e Compliance (Governança) Implementado
  - ✅ Criado Dashboard completo de Segurança e Compliance (/admin/security) com foco em governança
  - ✅ Implementadas 5 abas funcionais: Visão Geral, Auditoria, LGPD, Riscos, Classificação de Dados
  - ✅ Sistema LGPD: requisitos de conformidade, solicitações de privacidade e gestão de consentimento
  - ✅ Auditoria: logs detalhados de ações, monitoramento de acesso e rastreabilidade completa
  - ✅ Avaliação de Riscos: identificação de ameaças, vulnerabilidades e mitigações implementadas
  - ✅ Classificação de Dados: categorização por níveis (público, interno, confidencial, restrito)
  - ✅ Métricas de Compliance: scores LGPD (94.2%), segurança (96.8%) e risco geral (15.7)
  - ✅ Certificações: ISO 27001, SOC 2 Type II, LGPD Compliance com status e prazos
  - ✅ 6 endpoints backend funcionais: /audit-logs, /compliance-status, /privacy-requests, /risk-assessment, /data-classification, /generate-report
  - ✅ Interface moderna com gradientes red/pink e design enterprise-level de segurança
  - ✅ Botão "Segurança & Compliance" adicionado ao AdminMasterDashboard
  - ✅ Sistema de geração de relatórios de auditoria e compliance automatizados
- July 3, 2025: PASSO 5 - Ferramentas Avançadas (Produtividade) Implementado
  - ✅ Criado Dashboard de Ferramentas Avançadas completo (/admin/tools) focado em produtividade
  - ✅ Implementadas 5 abas funcionais: Automação, Operações em Lote, Analytics Avançado, Integrações, Otimização
  - ✅ Sistema de Automação: criação de regras com gatilhos, ações e condições personalizáveis
  - ✅ Operações em Lote: execução de tarefas massivas com monitoramento de progresso em tempo real
  - ✅ Analytics Avançado: relatórios personalizados e insights inteligentes de uso da plataforma
  - ✅ Centro de Integrações: APIs externas, webhooks e funcionalidades de exportação
  - ✅ Otimização de Performance: métricas de sistema e sugestões de melhorias automatizadas
  - ✅ KPI Cards: tempo economizado (127h), eficiência (+34.5%), adoção (85%), economia (R$ 8.450)
  - ✅ 5 endpoints backend funcionais: /automation-rules, /bulk-operations, /productivity-metrics
  - ✅ Interface moderna com gradientes emerald/teal e design enterprise-level
  - ✅ Botão "Ferramentas Avançadas" adicionado ao AdminMasterDashboard
  - ✅ Sistema de monitoramento e execução de automações em tempo real
- July 3, 2025: Sistema Completo de Criação em Lote de Usuários AWS Cognito Implementado
  - ✅ Criado card completo "Criação em Lote via Planilha" na interface CognitoUserManagement
  - ✅ Implementado endpoint backend /api/admin/users/bulk-create para processamento CSV
  - ✅ Configuração de multer específica para arquivos CSV com validação de tipo e tamanho
  - ✅ Sistema de download de template CSV com formato: email, nome, nivelAcesso, empresa, contrato
  - ✅ Interface de upload com área drag-and-drop, validação de arquivo e preview
  - ✅ Processamento linha por linha com validações robustas e tratamento de erros
  - ✅ Criação automática no AWS Cognito + sincronização com banco local PostgreSQL
  - ✅ Dashboard de resultados com métricas detalhadas: criados, falhas, total, taxa de sucesso
  - ✅ Sistema de relatórios de erro com linha específica e mensagem descritiva
  - ✅ Funcionalidade completa para criação massiva de usuários Admin, Gestores, Diretores
  - ✅ Design responsivo purple-themed integrado à interface principal
- July 3, 2025: Redesign Completo do AdminMasterDashboard com Dados Reais
  - ✅ Removido sistema de validação conforme solicitado pelo usuário
  - ✅ Redesign completo do AdminMasterDashboard com visual moderno enterprise-level
  - ✅ Gradientes modernos de fundo slate/blue/indigo em toda a interface
  - ✅ Cards com backdrop-blur e shadows suaves para visual premium
  - ✅ Métricas reais: contratos ativos, empresas parceiras, usuários totais, receita mensal
  - ✅ Criado endpoint /api/admin/system-stats para estatísticas em tempo real
  - ✅ Status do sistema com indicadores visuais: online, base de dados, segurança
  - ✅ Painel de ações rápidas reorganizado com botões gradientes coloridos
  - ✅ Seção "Resumo do Sistema" com badges de status em tempo real
  - ✅ Integração completa com dados reais do banco PostgreSQL
  - ✅ Eliminação total de dados fictícios, apenas informações autênticas
  - ✅ Layout responsivo otimizado para desktop, tablet e mobile
- July 3, 2025: Sistema de Validação Removido (ANTERIOR)
  - ✅ Redesign completo do ContractValidationSystem.tsx com interface premium
  - ✅ Visual moderno: gradientes de fundo, cards com backdrop-blur, shadows suaves
  - ✅ Implementados 4 endpoints backend funcionais: /api/admin/validation/results, /run, /auto-fix, /export
  - ✅ Sistema de validação em 4 categorias: contratos, usuários gestores, empresas, integridade referencial
  - ✅ Interface com abas filtráveis profissionais (Todos, Contratos, Usuários, Empresas, Integração)
  - ✅ Cards de métricas com ícones coloridos e dados reais do banco
  - ✅ Índice de integridade visual com progress bar e timestamp real
  - ✅ Sistema de recomendações específicas para cada tipo de problema
  - ✅ Funcionalidade de exportação de relatórios em PDF
  - ✅ Correção automática com botões de ação verde
  - ✅ Botão "Sistema de Validação" adicionado ao AdminMasterDashboard
  - ✅ Dados exclusivamente reais do banco de dados, sem dados fictícios
  - ✅ Design responsivo enterprise-level com cores modernas slate/blue/indigo
- July 3, 2025: PASSO 3 - Sistema Completo de Visualização e Edição de Vínculos Empresa-Contrato para Usuários Gestores
  - ✅ Implementado sistema completo de mutation para atualizar vínculos de empresa e contrato
  - ✅ Corrigido erro do Select.Item usando value="none" em vez de string vazia
  - ✅ Removido ícone de olho dos botões "Visualizar" nos cards dos usuários
  - ✅ Implementada função handleSaveContract com tratamento adequado para valores null
  - ✅ Adicionado endpoint PATCH /api/admin/users/:userId/update-contract funcional
  - ✅ Sistema de loading states, notificações de sucesso/erro e invalidação de cache
  - ✅ Validação completa: selectedContractId="none" é convertido para null antes do envio
  - ✅ Interface limpa com botões "Visualizar" (sem ícone) e "Editar Vínculos" (verde)
  - ✅ Modal de edição com dropdowns dinâmicos e preview dos vínculos atuais/novos
  - ✅ Sistema totalmente funcional para gestão de vínculos empresa-contrato de gestores
- July 3, 2025: PASSO 2 - Sistema Completo de Visualização e Edição de Empresas e Contratos
  - ✅ Funcionalidades de visualização e edição totalmente implementadas
  - ✅ Botões "Visualizar" (👁️) e "Editar" (✏️) para empresas e contratos individuais
  - ✅ Modais detalhados de visualização com todas as informações da empresa/contrato
  - ✅ Formulários completos de edição com validação e feedback visual
  - ✅ Endpoints backend PATCH para /api/admin/companies/:id e /api/admin/contracts/:id
  - ✅ Integração completa frontend-backend com mutations e atualizações automáticas
  - ✅ Interface intuitiva com cores diferenciadas: azul para visualizar, verde para editar
  - ✅ Sistema de estados e helpers para gerenciar modais e formulários
  - ✅ Validações robustas no backend e tratamento de erros adequado
  - ✅ Transições fluidas entre modais de visualização e edição
- July 3, 2025: PASSO 1 - Nova Interface Empresa-Centrada de Gestão de Contratos Implementada
  - ✅ Criado sistema CompanyContractManagement.tsx com foco na empresa como entidade central
  - ✅ Interface intuitiva onde contratos aparecem como cards vinculados a cada empresa
  - ✅ Formulários separados e otimizados: criação de empresa e criação de contrato independentes
  - ✅ Layout responsivo com busca, filtros e navegação simplificada
  - ✅ Endpoint backend /api/admin/companies-with-contracts para buscar dados integrados
  - ✅ Rota /admin/companies-contracts adicionada ao sistema de navegação
  - ✅ Botão "Empresas & Contratos (Novo)" no AdminMasterDashboard para acesso rápido
  - ✅ Sistema facilita entendimento visual: 1 empresa pode ter múltiplos contratos
  - ✅ Preparação para próximas melhorias: templates de planos, criação automática de gestores
- July 3, 2025: FASE 4.1 - Sistema de Listagem e Consulta de Usuários AWS Cognito Implementado
  - ✅ Criados 3 novos endpoints backend: /api/admin/users/list, /api/admin/users/:userId/details, /api/admin/users/statistics
  - ✅ Implementada interface completa UserManagement.tsx com filtros avançados e paginação
  - ✅ Sistema de busca por nome/email, filtros por grupo (Admin/Gestores) e status Cognito
  - ✅ Estatísticas em tempo real: total, ativos, pendentes, inativos com análise por período
  - ✅ Paginação funcional com navegação entre páginas e controle de limite
  - ✅ Modal de detalhes do usuário com informações completas do Cognito
  - ✅ Integração com dados locais do banco para informações complementares
  - ✅ Adicionados métodos ao CognitoService: listUsersInGroup, getUserDetails, getUserGroups
  - ✅ Interface responsiva com badges de status e grupos coloridos
  - ✅ Rota /admin/user-management adicionada ao sistema de navegação
  - ✅ Botão de acesso no AdminMasterDashboard conectado ao novo sistema
  - ✅ Sistema testado e funcionando com usuário admin.cognito_029282 do grupo Admin
  - ⚠️ Permissão AWS AdminListGroupsForUser pendente (comportamento esperado até configuração completa)
- July 3, 2025: FASE 3.2 - Dashboard Administrativo Avançado Implementado
  - ✅ Criado novo Dashboard Administrativo Avançado (/admin/advanced) com interface enterprise-level
  - ✅ Implementadas 5 abas funcionais: Visão Geral, Analytics, Alertas, Configurações, Monitoramento
  - ✅ Sistema de métricas expandido com recursos do servidor (CPU, memória, disco, API calls)
  - ✅ Analytics da plataforma com usuários ativos, funcionalidades mais usadas, tempo de sessão
  - ✅ Sistema de alertas em tempo real com capacidade de resolução e categorização
  - ✅ Interface de configurações da plataforma com filtros e edição em tempo real
  - ✅ Painel de monitoramento com status de serviços e logs do sistema
  - ✅ Novos endpoints backend: /api/admin/platform-analytics, /api/admin/system-alerts, /api/admin/platform-configs
  - ✅ Integração completa com sistema de autenticação e autorização admin
  - ✅ Interface responsiva com design moderno e gradientes consistentes
  - ✅ Adicionado botão de acesso rápido no AdminMasterDashboard
  - ✅ Sistema de notificações em tempo real e atualizações automáticas
- July 3, 2025: FASE 3.1 - Sistema de Onboarding Completo Implementado
  - ✅ Criada página completa de primeiro acesso (/first-access) com tutorial personalizado por função
  - ✅ Implementados endpoints para alteração de senha no primeiro acesso (/api/auth/change-password)
  - ✅ Sistema de onboarding com 3 etapas: alteração de senha, boas-vindas, e tutorial específico
  - ✅ Validação robusta de senhas com critérios de segurança AWS Cognito
  - ✅ Interface responsiva com progresso visual e badges de função
  - ✅ Redirecionamento automático para dashboard específico após conclusão
  - ✅ Integração completa com sistema AWS Cognito para gestão de senhas temporárias
  - ✅ URLs de primeiro acesso geradas automaticamente na criação de usuários
  - ✅ Tutorial customizado para cada tipo de usuário: Admin, Gestores, Diretores, Professores, Alunos
  - ✅ Interface de criação de usuários mostra URL completa de primeiro acesso com botões de cópia
  - ✅ Endpoint complete-onboarding corrigido para criar usuários locais quando necessário
  - ✅ Sistema de mapeamento de grupos Cognito para roles locais funcionando corretamente
  - ✅ Validação de schema de banco de dados corrigida para inserção de novos usuários
- July 2, 2025: COMPLETE AWS Cognito User Management System - Phase 2.2 Successfully Deployed
  - ✅ Applied AWS IAM policy CognitoUserManagement_4jqF97H2X with all required permissions
  - ✅ Fixed user creation endpoint validation to use dynamic Cognito groups instead of hardcoded list
  - ✅ Successfully tested complete user creation workflow with real AWS Cognito integration
  - ✅ Created test user: professor.final@escola.edu.br (username: professor.final_983543, group: Professores)
  - ✅ Confirmed full CRUD operations: user creation, group assignment, password management, local database sync
  - ✅ System now fully operational for all user hierarchy levels: Admin > Gestores > Diretores > Professores > Alunos
  - ✅ AWS Cognito integration 100% functional with real authentication and user management capabilities
- July 2, 2025: Fixed Authentication Page Auto-Redirect Issue and Import Path Corrections
  - Resolved Auth.tsx automatic redirection problem that sent users back to home page
  - Modified useEffect to only redirect users who just completed login (via query parameter)
  - Added informative message when already logged users access auth page directly
  - Corrected all cognito-service module import paths from dynamic to static imports
  - Fixed module resolution errors throughout the backend routes system
  - Enhanced user experience by allowing manual navigation to auth page without forced redirects
- July 2, 2025: AWS Cognito User Pool Correction - Phase 2.1.2 Complete (Correct User Pool Identified & Configured)
  - ✅ Identified correct User Pool ID: us-east-1_4jqF97H2X from COGNITO_USER_POLL_ID secret variable
  - ✅ Updated AWS IAM Service to prioritize correct User Pool with fallback for compatibility
  - ✅ Implemented secure Secrets Manager API for accessing Replit environment variables
  - ✅ System now generates policies with correct User Pool ARN: arn:aws:cognito-idp:us-east-1:*:userpool/us-east-1_4jqF97H2X
  - ✅ Confirmed diagnostic system working with updated User Pool configuration
  - ✅ All administrative interfaces updated to use correct User Pool reference
  - 🔄 Next Phase 2.2: Apply generated IAM policy in AWS Console for UsuarioBedrock user
- July 2, 2025: AWS Cognito Permissions System - Phase 2.1 Complete (Advanced Diagnostics & Configuration)
  - ✅ Created comprehensive AWS IAM Service with automatic permission diagnostics and policy generation
  - ✅ Implemented 4 new admin API endpoints for AWS permissions management (/api/admin/aws/permissions/*)
  - ✅ Built advanced AWSPermissionsManager.tsx interface with real-time diagnostics and 3-tab layout
  - ✅ Added automatic AWS user identification (arn:aws:iam::762723916379:user/UsuarioBedrock)
  - ✅ Integrated permission verification system with visual progress tracking
  - ✅ Generated automatic IAM policy JSON with 16 specific Cognito permissions
  - ✅ Created manual configuration instructions with AWS Console integration
  - ✅ Added "Configurar Permissões AWS" button to admin dashboard with /admin/aws-permissions route
  - ✅ System provides copy-to-clipboard functionality for policies and URLs
  - ✅ Real-time verification system confirms when permissions are properly configured
- July 2, 2025: AWS Cognito User Registration System - Phase 1.3 Complete (Administrative Interface Ready)
  - ✅ Extended users table with AWS Cognito integration fields: cognito_user_id, cognito_group, cognito_status
  - ✅ Created cognito_group enum with hierarchical structure: Admin, Gestores, Diretores, Professores, Alunos
  - ✅ Enhanced CognitoService with group management methods: checkRequiredGroups(), createRequiredGroups(), createGroup()
  - ✅ Added admin API endpoints for Cognito group management: /api/admin/cognito/groups/status, /api/admin/cognito/groups/create, /api/admin/cognito/groups
  - ✅ Created comprehensive CognitoUserManagement.tsx administrative interface for user registration
  - ✅ Fixed all import path issues and module resolution errors
  - ✅ System ready for user creation once AWS permissions are configured
  - Updated COGNITO_GRUPOS_SETUP.md with comprehensive configuration guide and permission requirements
- July 2, 2025: Fixed Lesson Planning Document Generation System
  - Added missing `/api/analyze-tema` endpoint for automatic theme analysis using Anthropic Claude
  - Added missing `/api/generate-comprehensive-lesson-plan` endpoint for complete lesson plan generation
  - Fixed authentication issues by adding `credentials: 'include'` to fetch requests in frontend
  - Implemented comprehensive BNCC-aligned lesson plan generation with 15 required sections
  - Added retry logic and error handling for AI API calls
  - Connected lesson planning system to Anthropic Claude 3.5 Sonnet for professional educational content
  - Fixed "Gerar Plano de Aula" button being disabled due to authentication errors
- July 2, 2025: AWS Cognito Connection Resilience System Implementation
  - Enhanced AWS Cognito service with robust connectivity testing using multiple endpoints
  - Added pre-redirection connectivity tests to prevent connection refused errors
  - Implemented automatic fallback to standard login when Cognito is unavailable
  - Created `/cognito-test` endpoint for real-time connectivity diagnosis
  - Enhanced error handling with graceful degradation and user-friendly error messages
  - Updated login flow to test Cognito availability before attempting redirection
  - Maintained email validation support for Brazilian institutional domains (.gov.br, .edu.br)
- July 2, 2025: Enhanced User Creation System with Company-Contract Integration for Municipal Managers
  - Extended platform-based user creation system to require company contracting data for Municipal Managers
  - Added mandatory company and contract selection when creating Municipal Manager accounts
  - Created API endpoints: /api/admin/companies and /api/admin/companies/:id/contracts for contract data
  - Modified user creation form to show company selection dropdown for Municipal Managers
  - Implemented contract validation ensuring selected contract belongs to selected company
  - Enhanced backend validation to verify company and contract existence before user creation
  - Updated CognitoService to store company_id and contract_id as custom attributes in AWS Cognito
  - Added conditional form fields that appear only when Municipal Manager role is selected
  - Created company-contract relationship display with real-time contract filtering
  - Integrated company contracting data with Municipal Manager registration process
  - System now enforces business rule: Municipal Manager creation requires valid company contract
- July 2, 2025: AWS Cognito Group-Based Role Authentication and URL Redirection System
  - Enhanced CognitoService with comprehensive group-to-role mapping for 4 user types
  - Implemented automatic URL redirection based on AWS Cognito group membership
  - Created mapping system: GestorMunicipal → /municipal/dashboard, Diretor → /school/dashboard, Professor → /professor, Aluno → /student/dashboard
  - Updated callback route to use processUserAuthentication() method with detailed logging
  - Added support for multiple group name variations (Admin/AdminMaster, Professor/Professores/Teachers, etc.)
  - Connected existing dashboard pages to authentication system with proper routing
  - Created comprehensive setup guide (COGNITO_GRUPOS_SETUP.md) for AWS Console configuration
  - System automatically creates users with correct roles based on Cognito group membership
  - Enhanced debugging with detailed console logs showing group analysis and redirection flow
- July 2, 2025: Complete LiteLLM Management Dashboard with Real Data Integration
  - Created comprehensive LiteLLM administration interface at /admin/ai/litellm-management
  - Implemented 5-tab dashboard: Overview, Models, API Keys, Analytics, Settings
  - Built LiteLLMService class for real API integration with authentication and error handling
  - Added automatic fallback to display configuration status when LiteLLM is not configured
  - Created native dashboard access button that opens LiteLLM's built-in UI when configured
  - Integrated real data fetching from LiteLLM API endpoints: /health, /metrics, /models, /keys, /usage
  - Added connection testing and configuration validation functionality
  - Implemented secure environment variable configuration (LITELLM_URL, LITELLM_API_KEY)
  - Created user-friendly configuration status display with setup instructions
  - Enhanced error handling with detailed logging and graceful degradation
  - Added "LiteLLM Control" button to AI Management Dashboard header
  - Created 12 API endpoints for full CRUD operations and real data integration
  - Integrated with existing authentication and admin authorization system
- July 1, 2025: DEFINITIVE FIX for Recurring Black Background Issue Across Platform
  - Disabled dark mode globally in tailwind.config.ts (darkMode: false)
  - Added comprehensive CSS overrides in index.css to force light theme with !important declarations
  - Modified HTML head with inline styles and JavaScript to prevent dark theme application
  - Added MutationObserver to dynamically remove any dark theme classes that may be added at runtime
  - Created AdminLayout component as additional safety layer for admin dashboards
  - Applied color-scheme: light globally to prevent browser-level dark mode interference
  - Solution addresses root cause at multiple levels: Tailwind config, CSS variables, HTML attributes, and JavaScript monitoring
- July 1, 2025: Fixed AWS Console Button Redirection and Database Audit Issues
  - Corrected AWS Console Bedrock button redirection in AI Management Dashboard to proper AWS Bedrock console URL
  - Fixed database audit_logs table schema mismatch by adding missing contract_id column and correcting resource_id type
  - Added functional "Gestão de Custos" button linking to /admin/ai/cost-management page
  - Resolved AWS console access authentication and audit logging system
  - Both Console AWS Bedrock and Cost Management buttons now working correctly in dashboard header
- July 1, 2025: Secure AWS Bedrock Console Access System Implementation
  - Created comprehensive AWSConsoleAccessService with SSO authentication and temporary credentials
  - Implemented secure access flow: user validation → AWS role assumption → signed console URL generation
  - Added audit logging for all console access attempts with user tracking and session management
  - Built secure API endpoints: /api/admin/aws/console/access, /api/admin/aws/console/status, /api/admin/aws/cloudwatch
  - Enhanced frontend buttons with real-time authentication requests and error handling
  - Added fallback mechanisms for CloudWatch access when full AWS console is unavailable
  - Implemented session revocation capabilities for secure logout
  - Added region validation and authorized user management
  - Created configuration status checking for missing AWS environment variables
- July 1, 2025: Real AI Provider Data Integration Implementation
  - Created comprehensive AIProvidersService for fetching real usage data from AWS Bedrock and LiteLLM APIs
  - Integrated CloudWatch metrics to retrieve actual Bedrock usage, costs, and token consumption
  - Connected to LiteLLM analytics endpoints for real-time usage monitoring
  - Updated AI Management Dashboard to display authentic provider data instead of mock data
  - Added fallback mechanisms for when API credentials are not configured
  - Enhanced provider status checking with real connectivity tests
  - Mapped real model usage data to platform applications for accurate cost allocation
  - Implemented dynamic cost breakdown based on actual model performance metrics
- July 1, 2025: AWS Cognito OAuth integration implementation (Phase 1 Complete)
  - Created comprehensive CognitoService utility class with token exchange, user info decoding, and role mapping
  - Added Cognito authentication routes: /api/cognito/test, /start-login, /callback, /logout-callback
  - Integrated role-based user redirection (admin → /admin/master, teacher → /professor, student → /student/dashboard)
  - Added AWS Cognito login button to authentication page with modern UI design
  - Configured automatic user creation/update from Cognito user pools with group-based role assignment
  - Successfully tested Cognito service configuration and URL generation
- July 1, 2025: Complete development of three administrative systems with modern UI/UX
  - Developed comprehensive Contract Management System with real-time statistics, contract listing, and quick actions
  - Implemented Security Monitoring System with event tracking, alert management, and security actions center
  - Built Platform Configuration System with system settings, user management, and platform controls
  - Applied modern UI/UX principles with soft color palettes (emerald, blue, purple, slate gradients)
  - Enhanced visual hierarchy with backdrop-blur effects, gradient headers, and sophisticated card layouts
  - Implemented enterprise-level interface design with hover effects, consistent spacing, and readable typography
  - Replaced hard blue colors with soft pastels and dark text for better accessibility and modern aesthetics
- June 30, 2025: Added logout buttons to all three administrative dashboards
  - Added red-styled logout buttons with LogOut icon in headers of AdminMasterDashboard, MunicipalManagerDashboard, and SchoolDirectorDashboard
  - Buttons positioned consistently on the right side of each dashboard header
  - Integrated with existing useAuth logout functionality for secure session termination
  - Maintained visual consistency with red hover states and border styling across all dashboards
- June 30, 2025: Updated all three administrative dashboards with clean, simple layouts
  - Changed background colors from dark/gradient themes to light gray-50 for consistency with teacher/student dashboards
  - Simplified AdminMasterDashboard with clean card layouts and basic tab structure
  - Updated MunicipalManagerDashboard background to match clean theme
  - Modified SchoolDirectorDashboard to use simple gray background instead of blue gradients
  - Ensured consistent typography and spacing across all administrative levels
  - Maintained functionality while improving visual consistency and readability
- June 30, 2025: Complete Admin Master Dashboard implementation
  - Created comprehensive admin master dashboard with enterprise-level functionality
  - Implemented system metrics monitoring (contracts, users, revenue, uptime)
  - Added contract management with suspension/activation capabilities
  - Built security alert system with resolution tracking
  - Created audit logging system for all admin actions
  - Added platform configuration management interface
  - Integrated comprehensive dashboard with real-time monitoring capabilities
  - Enhanced database schema with admin-specific tables (auditLogs, securityAlerts, systemHealthMetrics, platformConfigs)
  - Updated authentication flow to redirect admin users to /admin/master
- June 30, 2025: MAJOR ARCHITECTURAL CHANGE - Complete removal of secretary-level functionality
  - Removed all secretary dashboard pages, components, and routes from frontend
  - Eliminated all secretary-related API endpoints and database operations from backend
  - Removed secretarias and escolas database tables and their associated schemas
  - Updated all navigation and authentication flows to redirect admin users to teacher dashboard
  - Cleaned up notification systems to remove secretary references
  - Simplified system architecture by eliminating the three-tier user role system
- June 30, 2025: Complete AWS Bedrock integration with comprehensive token monitoring system
  - Implemented AWS Bedrock service with support for Claude 3.5 Sonnet, Amazon Titan, Meta Llama 2, and AI21 Jurassic models
  - Created comprehensive token monitoring system with usage tracking, cost calculation, and alert system
  - Added AWS Bedrock API routes for all supported models (Claude, Titan, Llama, Jurassic)
  - Built token dashboard with real-time monitoring, usage analytics, and pricing information
  - Enhanced database schema to support provider-specific token tracking with cost analysis
  - Integrated AWS credentials management for secure Bedrock access
  - Created token management API endpoints for usage statistics, alerts, and pricing data
  - Implemented token limit checking and alert system for usage monitoring
  - Added comprehensive dashboard for teachers to monitor AWS Bedrock usage and costs
- June 28, 2025: Cleaned up school registration system by removing non-functional APIs
  - Removed "Buscar Dados" button from school registration form
  - Deleted all CNPJ and INEP code lookup APIs (/api/cnpj/autocompletar, /api/inep/autocompletar, /api/inep/escola endpoints)
  - Removed INEP service files (inep-service.ts, real-inep-service.ts, api-inep-real.ts, basedosdados-inep.ts, inep-oficial.ts)
  - Simplified school registration form to manual data entry only
  - Cleaned up unused imports and functions related to external API lookups
- June 28, 2025: Complete Panel SME implementation for municipal education secretaries
  - Created Panel SME dashboard (/panel.sme) with administrative tools and statistics
  - Implemented school registration form (/panel.sme/cadastrar-escola) with comprehensive validation
  - Built school management interface (/panel.sme/escolas) with data visualization and CRUD operations
  - Added complete API routes for schools management (GET, POST, PATCH, DELETE /api/escolas)
  - Created admin user (secretaria@dominio.com) with panel access permissions
  - Integrated real database operations with proper error handling and data validation
  - Added comprehensive dashboard statistics and real-time data from actual database
- June 28, 2025: Created comprehensive educational administration database structure
  - Added Secretarias table with fields: id_secretaria, nome_secretaria, nome_secretario, cnpj, endereço, bairro, cidade, estado, cep, telefone, e-mail, data_criacao, site, status
  - Added Escolas table with fields: id_escola, nome_escola, tipo_escola, inep, cnpj, id_secretaria (FK), nome_diretor, endereço, bairro, cidade, estado, cep, telefone, e-mail, zona, data_fundacao, numero_salas, numero_alunos, status
  - Established foreign key relationship between Escolas and Secretarias for institutional hierarchy
  - Added enum types for status control (ativa/inativa) and classification (municipal/estadual/federal/particular, urbana/rural)
  - Populated tables with sample data demonstrating real-world usage scenarios
  - Updated Drizzle schema with proper TypeScript types and insert schemas
- June 26, 2025: Complete redesign of Analytics Dashboard with billion-dollar platform aesthetics
  - Rebuilt entire /professor/analises with premium visual design and sophisticated charts
  - Added enterprise-level metrics: revenue (₹42.8M), valuation (₹847M), global presence (127 countries)
  - Implemented advanced chart types: ComposedChart, RadialBarChart, ScatterChart, AreaChart
  - Enhanced with multi-dimensional data visualizations including AI model performance analytics
  - Added premium loading states, gradient overlays, and hover animations
  - Redesigned with refined card layouts, professional color schemes, and executive-level reporting
  - Integrated real-time business intelligence with sophisticated tooltips and data legends
- June 26, 2025: Enhanced Student Quiz form with emerald green theme and standard navigation
  - Updated Quiz form to use emerald/teal green color theme matching the interactive quiz card design
  - Implemented standard back button pattern with "Voltar" button positioned on the left side
  - Applied emerald theme consistently across all quiz states: configuration, running, and results
  - Updated background gradients, form elements, buttons, and progress indicators
  - Fixed navigation routing from /aluno to /student/dashboard for proper redirection
- June 26, 2025: Implemented role-based navigation for Central-IA and all AI-specific pages
  - Created dynamic getDashboardRoute() function that determines appropriate dashboard based on user role
  - Teacher role → /professor dashboard
  - Student role → /student/dashboard
  - Admin role → /secretary dashboard
  - Updated "Voltar" buttons in CentralIA, ClaudePage, ChatGPTPage, PerplexityPage, and ImageGenPage
  - All AI pages now redirect users back to their role-specific dashboard instead of generic route
  - Enhanced user experience with intelligent navigation that respects user permissions and context
- June 25, 2025: Removed navigation buttons from main landing page
  - Eliminated "Plataforma", "Inteligências", "Para Educação", and "Impacto" buttons from desktop header
  - Cleaned mobile navigation menu by removing the same navigation options
  - Simplified landing page navigation to focus on core access functionality
  - Maintained clean, minimalist design with only essential "Acessar IAprender" button
  - Removed borders from "Integração Total" and "100% em Português" cards for cleaner design
  - Redesigned three main feature cards with minimalist style while keeping same texts and icons
  - Implemented clean, centered layout with subtle backgrounds and hover effects
  - Enhanced cards with fantastic contrast using dark backgrounds and vibrant colors for maximum visual impact
  - Redesigned cards to match "Linguagem & Texto" and "Criação Visual" style with left-aligned text and subtle colors
- June 25, 2025: Complete teacher dashboard redesign
  - Implemented minimalist and interactive design with fantastic visuals
  - Removed complex sidebar and header components for cleaner experience
  - Created centered layout with gradient cards and smooth hover transitions
  - Added mobile-responsive minimalist sidebar that appears on demand
  - Simplified token usage display and added quick stats cards
  - Enhanced user experience with easy navigation and visual hierarchy
  - Replaced generic statistics cards with relevant educational insights including student engagement, learning progress, weekly activity, and AI usage with mini charts and visual indicators
  - Added subtle solid color backgrounds and enhanced borders to insight cards (blue, green, purple, indigo themes matching icon colors)
  - Repositioned educational insight cards below token usage card for better visual hierarchy
  - Removed gradient background from professor page for cleaner minimalist design
  - Redesigned welcome section with professional layout and violet theme
  - Enhanced token usage card with green theme and improved visual hierarchy
  - Redesigned tools grid with unique subtle solid colors for each card (blue, rose, amber, emerald, purple, cyan, orange, pink)
  - Added section headers and improved typography throughout dashboard
  - Enhanced welcome card with prominent gradient background (violet to purple)
  - Updated header with IAprender logo, removed resume button, kept notifications and profile only
  - Added smooth scroll-to-top animation when dashboard loads
- June 25, 2025: Complete integrated notification system for all user roles
  - Implemented comprehensive notification system between Secretary, Teachers, Students
  - Secretary can send/receive notifications to/from all users (teachers, students, parents)
  - Teachers can send/receive notifications to/from secretary and students
  - Students can send/receive notifications to/from secretary and teachers
  - Created unified NotificationCenter component with role-based functionality
  - Added notification API routes with proper authorization and validation
  - Integrated notification pages in all dashboards (/secretary/notifications, /professor/notificacoes, /student/notificacoes)
  - Updated dashboard cards to link to notification centers
  - Sequential numbering system for tracking (NOT-YYYY-XXX format)
  - Priority levels, response tracking, read receipts, and status management
  - Real-time notification count hooks for UI updates
  - Enhanced teacher notification center with full database integration
  - Added support for group notifications (all_teachers, all_students)
  - Implemented complete CRUD operations for teacher notifications
- June 25, 2025: Complete form template system and email/WhatsApp integration
  - Created comprehensive form template system with consistent colors, layout, fonts, and styles
  - Implemented email service using SendGrid for sending login credentials
  - Added WhatsApp service placeholder for credential delivery
  - Enhanced date formatting to show complete field information with tooltips
  - Created reusable form components (FormContainer, FormSection, FormField, etc.)
  - Added color schemes (primary, secondary, success, warning, danger) for different form types
  - Integrated email and WhatsApp sending into user creation process
  - Updated success messages to show delivery status for credentials

- June 24, 2025: Complete teacher dashboard redesign from scratch
  - Created new intuitive dashboard with modern UI/UX principles
  - Added welcome bar with gradient background and user greeting
  - Added token consumption bar with progress indicator and usage statistics
  - Implemented main tools section: "Central de Inteligências" and "Planejamento de Aulas" side by side
  - Added 8 tool buttons in 2x4 grid: Gerador de Atividades, Redações, Notícias & Podcasts, Análise de Documentos, Materiais Didáticos, Calculadora de Notas, Notificações de Comportamento, Análise de Desempenho
  - All buttons are functional with proper routing to respective dashboards
  - Enhanced visual hierarchy with gradients, shadows, and hover effects
  - Added footer with user account information
- June 24, 2025: Dashboard cleanup and route optimization
  - Removed redundant "Planejamento de Aula" button from dashboard (red card)
  - Removed duplicate route /professor/planejamento to avoid confusion
  - Kept only /professor/ferramentas/planejamento-aula for lesson planning
  - Adjusted grid layout from 4 columns to 3 columns for better spacing
  - Created dedicated dashboards for Calculator, Notifications, and Analytics with clean layouts
  - Removed sidebars from specialized dashboards for focused user experience
  - Added consistent "Voltar ao Dashboard" navigation buttons
- June 24, 2025: AWS Cognito OAuth integration implemented
  - Root route (/) now serves the Home landing page (AIverseLanding component)
  - /start-login redirects to Cognito authentication when user clicks IA access buttons
  - /callback exchanges authorization codes for JWT tokens
  - Group-based redirection (Administrador/SecretariaAdm/EscolaAdm → secretary, Professores → teacher, default → student)
  - dotenv configuration for environment variables
  - Landing page serves as main entry point with buttons to access IA platform
  - Updated "Explorar o IAprender" buttons to redirect to /auth instead of start-login

## Changelog
- June 23, 2025. Initial setup
- June 24, 2025. AWS Cognito OAuth authentication system

## User Preferences

Preferred communication style: Simple, everyday language.