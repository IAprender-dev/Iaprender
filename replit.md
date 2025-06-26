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
- June 25, 2025: Removed navigation buttons from main landing page
  - Eliminated "Plataforma", "Inteligências", "Para Educação", and "Impacto" buttons from desktop header
  - Cleaned mobile navigation menu by removing the same navigation options
  - Simplified landing page navigation to focus on core access functionality
  - Maintained clean, minimalist design with only essential "Acessar IAprender" button
  - Removed borders from "Integração Total" and "100% em Português" cards for cleaner design
- June 25, 2025: Complete teacher dashboard redesign
  - Implemented minimalist and interactive design with fantastic visuals
  - Removed complex sidebar and header components for cleaner experience
  - Created centered layout with gradient cards and smooth hover transitions
  - Added mobile-responsive minimalist sidebar that appears on demand
  - Simplified token usage display and added quick stats cards
  - Enhanced user experience with easy navigation and visual hierarchy
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