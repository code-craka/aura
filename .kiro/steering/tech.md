# Project Aura - Technology Stack

## Architecture Overview
Chromium-based browser with native AI integration using a hybrid local/cloud processing approach.

## Frontend Stack
- **Framework**: React 18+ with TypeScript 5.3+ (strict mode)
- **Build Tool**: Vite with custom Chromium integration
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for global state, React Query for server state
- **UI Components**: Custom design system + Radix UI primitives
- **Testing**: Vitest + React Testing Library + Playwright

## Backend & AI Integration
- **Runtime**: Node.js 20+ with TypeScript
- **Database**: PostgreSQL for user data, Vector DB for AI context
- **Cache**: Redis for session management and API caching
- **API**: tRPC for type-safe client-server communication
- **AI Models**: GPT-4, Claude-3, Gemini Pro with custom routing and fallback
- **Local AI**: WebAssembly for on-device processing

## Infrastructure
- **Cloud**: AWS/GCP multi-region deployment
- **Containers**: Docker with custom Chromium builds
- **Orchestration**: Kubernetes for production scaling
- **CDN**: CloudFlare for global asset delivery
- **Monitoring**: DataDog for performance and error tracking

## Development Tools
- **AI Assistance**: GitHub Copilot, Claude Code, Augment Code
- **Version Control**: Git with conventional commits
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Quality Gates**: ESLint, TypeScript, Prettier, automated code review

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test
npm run test:e2e

# Build for production
npm run build

# Type checking
npm run type-check

# Linting and formatting
npm run lint
npm run format
```

### AI Development
```bash
# Generate AI-assisted code
npm run ai:generate

# Run AI code review
npm run ai:review

# Generate tests with AI
npm run ai:test

# Update documentation with AI
npm run ai:docs
```

## Performance Requirements
- Page load time < 2 seconds for 90% of requests
- AI response time < 3 seconds for standard queries
- Memory usage < 4GB for 20 tabs
- CPU usage < 15% during idle state

## Security Standards
- End-to-end encryption for all sensitive data
- OWASP security guidelines compliance
- Regular security audits and penetration testing
- GDPR and CCPA compliance