# Project Aura - Project Structure

## Repository Organization
Monorepo structure with packages for different components and apps for deployable applications.

```
project-aura/
├── packages/
│   ├── browser-core/          # Main browser application logic
│   ├── ai-engine/             # AI processing and integration
│   ├── ui-components/         # Shared React components
│   ├── extension-api/         # Chrome extension compatibility
│   ├── shared-utils/          # Common utilities and helpers
│   └── desktop-app/           # Electron wrapper for desktop
├── apps/
│   ├── browser/               # Main browser application
│   ├── landing-page/          # Next.js marketing site
│   ├── admin-dashboard/       # Internal admin tools
│   └── docs/                  # Documentation site
├── tools/
│   ├── build-scripts/         # Custom build automation
│   ├── ai-agents/             # AI development assistants
│   ├── testing-tools/         # Custom testing utilities
│   └── deployment/            # Infrastructure as code
└── config/
    ├── eslint/                # Linting configuration
    ├── typescript/            # TypeScript configurations
    ├── webpack/               # Build configurations
    └── ci/                    # CI/CD configurations
```

## Core Module Structure

### Browser Core (`packages/browser-core/`)
```
src/
├── engine/                    # Chromium integration and browser engine
├── ui/                        # React components and layouts
├── services/                  # Storage, sync, extensions, API
└── types/                     # TypeScript definitions
```

### AI Engine (`packages/ai-engine/`)
```
src/
├── models/                    # AI provider integrations and routing
├── processing/                # Context extraction and analysis
├── agents/                    # Conversation, automation, suggestions
├── privacy/                   # Data filtering and encryption
└── types/                     # AI-specific type definitions
```

### UI Components (`packages/ui-components/`)
```
src/
├── components/
│   ├── browser/               # Browser-specific components
│   ├── ai/                    # AI interaction components
│   ├── forms/                 # Form controls and inputs
│   └── layout/                # Layout and container components
├── hooks/                     # Custom React hooks
├── styles/                    # Tailwind themes and utilities
└── types/                     # Component interfaces
```

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch for features
- `staging`: Pre-production testing
- `feature/*`: Individual feature development
- `ai-agent/*`: AI-generated code branches

### Commit Convention
```
feat: New feature implementation
fix: Bug fixes and patches
refactor: Code restructuring
perf: Performance improvements
test: Test additions/modifications
docs: Documentation updates
ai-gen: AI-generated code
ai-test: AI-generated tests
```

### File Naming Conventions
- Components: PascalCase (`SmartAddressBar.tsx`)
- Hooks: camelCase with `use` prefix (`useAIConversation.ts`)
- Utilities: camelCase (`formatResponse.ts`)
- Types: PascalCase with descriptive names (`AIResponse.ts`)
- Tests: Same as source with `.test.` or `.spec.` suffix

## Code Organization Principles

### Component Structure
```typescript
// Component file structure
export interface ComponentProps {
  // Props interface
}

export const Component: React.FC<ComponentProps> = ({ }) => {
  // Component implementation
};

export default Component;
```

### Service Layer Pattern
```typescript
// Service pattern for business logic
export class ServiceName {
  constructor(private dependencies: Dependencies) {}
  
  public async method(): Promise<Result> {
    // Implementation
  }
}
```

### AI Integration Pattern
```typescript
// AI service integration
export interface AIProvider {
  query(prompt: string, context?: Context): Promise<AIResponse>;
  analyze(content: Content): Promise<Analysis>;
}
```

## Testing Organization
```
tests/
├── unit/                      # Component and function tests
├── integration/               # API and service integration tests
├── e2e/                       # End-to-end user scenarios
└── load/                      # Performance and stress tests
```

## Documentation Structure
- README files in each package explaining purpose and usage
- API documentation generated from TypeScript interfaces
- Architecture decision records (ADRs) in `/docs/architecture/`
- User guides and tutorials in `/docs/user-guides/`

## AI-Assisted Development
- AI agents generate boilerplate code following established patterns
- Human oversight required for architecture decisions and business logic
- Automated code review and testing with AI assistance
- Documentation generation and maintenance by AI agents