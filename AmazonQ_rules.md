# Amazon Q Developer Rules for Project Aura

## Project Overview

Project Aura is the world's first truly agentic browser that transforms web browsing from passive consumption to intelligent assistance, eliminating the "effort factor" through seamless AI integration. Built on a customized Chromium base with native AI integration using React 18+, TypeScript 5.3+, and a hybrid local/cloud AI processing approach.

## Core Architecture Principles

### Foundation-First Development

- **Browser Core Foundation** must be implemented before any AI features
- **AI Engine Foundation** provides unified multi-model AI integration (GPT-4, Claude-3, Gemini Pro)
- **UI Foundation** delivers React components with AI-enhanced patterns
- All AI features build upon these foundations - never assume undefined infrastructure

### Technology Stack Requirements

```typescript
// Frontend Stack (MANDATORY)
Framework: React 18+ with TypeScript 5.3+ (strict mode)
Build Tool: Vite with custom Chromium integration
Styling: Tailwind CSS with custom design system
State Management: Zustand + React Query
UI Components: Custom design system + Radix UI primitives
Testing: Vitest + React Testing Library + Playwright

// Backend & AI Integration
Runtime: Node.js 20+ with TypeScript
Database: PostgreSQL + Vector DB for AI context
API: tRPC for type-safe client-server communication
AI Models: GPT-4, Claude-3, Gemini Pro with routing/fallback
```

## Code Generation Rules

### 1. TypeScript Requirements

- **ALWAYS** use TypeScript 5.3+ with strict mode enabled
- **ALWAYS** define comprehensive interfaces for all components and services
- **ALWAYS** include proper JSDoc comments for all functions and classes
- **NEVER** use `any` type - use proper type definitions or `unknown`

### 2. React Component Patterns

```typescript
// REQUIRED component structure
export interface ComponentProps {
  // All props must be typed
}

export const Component: React.FC<ComponentProps> = ({ }) => {
  // Component implementation
};

export default Component;
```

### 3. AI Integration Patterns

- **ALWAYS** use AI Engine Foundation's router for model selection
- **ALWAYS** implement privacy filtering before sending data to AI models
- **ALWAYS** provide fallback mechanisms for AI failures
- **ALWAYS** include confidence scores and source citations

### 4. Browser Integration Requirements

- **ALWAYS** use Browser Core Foundation's APIs for content extraction
- **ALWAYS** respect Chrome extension compatibility requirements
- **ALWAYS** implement proper sandboxing and security measures
- **NEVER** directly access DOM without using foundation APIs

## Performance Requirements (NON-NEGOTIABLE)

- Page load time < 2 seconds for 90% of requests
- AI response time < 3 seconds for standard queries
- Memory usage < 4GB for 20 tabs
- CPU usage < 15% during idle state
- UI interactions < 100ms response time

## Security & Privacy Rules

### Data Handling

- **ALWAYS** encrypt sensitive data at rest and in transit
- **ALWAYS** implement PII detection and filtering
- **ALWAYS** request user consent for sensitive data processing
- **ALWAYS** provide granular privacy controls
- **NEVER** train on user data without explicit consent

### Code Security

- **ALWAYS** sanitize all user inputs
- **ALWAYS** implement proper CORS handling
- **ALWAYS** use secure authentication patterns
- **ALWAYS** follow OWASP security guidelines

## Feature Implementation Order

1. **Browser Core Foundation** (Chromium integration, tab management, security)
2. **AI Engine Foundation** (Multi-model integration, context management)
3. **UI Foundation** (React components, design system)
4. **Smart Conversation System** (Natural language interface)
5. **Cross-Tab Intelligence** (Multi-source analysis)
6. **Custom Command System** (Workflow automation)
7. **Additional AI Features** (Writing assistant, research engine, etc.)

## AI Feature Development Rules

### Context Awareness

- **ALWAYS** use Cross-Tab Intelligence for multi-source analysis
- **ALWAYS** provide source citations and references
- **ALWAYS** respect user privacy settings and permissions
- **ALWAYS** filter sensitive content before AI processing

### User Experience

- **ALWAYS** provide progressive disclosure of advanced features
- **ALWAYS** maintain familiar browser interaction patterns
- **ALWAYS** implement graceful degradation when AI is unavailable
- **ALWAYS** provide clear explanations of AI actions

## Testing Requirements

- **MINIMUM** 90% test coverage for all new code
- **ALWAYS** include unit tests for components and services
- **ALWAYS** include integration tests for AI features
- **ALWAYS** include accessibility tests (WCAG 2.1 AA compliance)
- **ALWAYS** include performance benchmarking tests

## File Organization Rules

### Naming Conventions

- Components: PascalCase (`SmartAddressBar.tsx`)
- Hooks: camelCase with `use` prefix (`useAIConversation.ts`)
- Utilities: camelCase (`formatResponse.ts`)
- Types: PascalCase (`AIResponse.ts`)
- Tests: Same as source with `.test.` or `.spec.` suffix

### Module Structure

```
packages/
├── browser-core/     # Chromium integration, tab management
├── ai-engine/        # AI processing and integration
├── ui-components/    # Shared React components
└── shared-utils/     # Common utilities
```

## Commit Message Format

```
feat(scope): description
fix(scope): description
refactor(scope): description
perf(scope): description
test(scope): description
docs(scope): description
ai-gen(scope): AI-generated code
ai-test(scope): AI-generated tests
```

## Error Handling Requirements

- **ALWAYS** implement comprehensive error boundaries
- **ALWAYS** provide user-friendly error messages
- **ALWAYS** include error recovery mechanisms
- **ALWAYS** log errors for debugging and monitoring
- **NEVER** expose internal errors to users

## Accessibility Requirements

- **ALWAYS** implement WCAG 2.1 AA compliance
- **ALWAYS** provide keyboard navigation for all features
- **ALWAYS** include proper ARIA labels and descriptions
- **ALWAYS** support screen readers and assistive technologies
- **ALWAYS** provide high contrast mode support

## AI Model Usage Guidelines

- **PRIMARY**: GPT-4 for complex reasoning and conversation
- **SECONDARY**: Claude-3 for analysis and writing assistance
- **TERTIARY**: Gemini Pro for multimodal tasks
- **LOCAL**: WebAssembly models for privacy-sensitive operations
- **ALWAYS** implement intelligent routing based on query type
- **ALWAYS** provide fallback mechanisms between models

## Documentation Requirements

- **ALWAYS** include comprehensive README files for each package
- **ALWAYS** generate API documentation from TypeScript interfaces
- **ALWAYS** document architectural decisions in ADRs
- **ALWAYS** provide usage examples for all components
- **ALWAYS** maintain up-to-date development guidelines

## Quality Gates (MANDATORY)

- ESLint with strict rules must pass
- TypeScript compilation with no errors
- Prettier formatting must be applied
- All tests must pass with >90% coverage
- Security scans must pass with no critical issues
- Performance benchmarks must meet requirements
- Accessibility tests must pass WCAG 2.1 AA

## Prohibited Practices

- **NEVER** use deprecated React patterns (class components, legacy context)
- **NEVER** bypass TypeScript strict mode
- **NEVER** implement AI features without foundation dependencies
- **NEVER** store sensitive data without encryption
- **NEVER** make direct API calls without using AI Engine Foundation
- **NEVER** create components without proper accessibility support
- **NEVER** commit code without comprehensive tests

## Success Metrics to Optimize For

- 40% time savings on target workflows ("effort factor" reduction)
- >95% AI query success rate
- >60% feature adoption rate within 30 days
- >4.2/5.0 user satisfaction score
- <100ms UI interaction response time
- <3 seconds AI response time