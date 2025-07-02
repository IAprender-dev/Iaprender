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

## Recent Changes
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