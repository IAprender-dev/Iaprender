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