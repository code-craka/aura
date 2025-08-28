# GitHub Copilot Instructions for Project Aura

## Project Context

Project Aura is an AI-native browser built on Chromium, designed to eliminate the "effort factor" through seamless AI integration. You are assisting with development of a sophisticated browser that maintains full functionality while adding intelligent automation and assistance capabilities.

## Core Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript 5.3+ (strict mode)
- **Build Tool**: Vite with custom Chromium integration
- **Styling**: Tailwind CSS with custom design system
- **State**: Zustand + React Query for server state
- **Testing**: Vitest + React Testing Library + Playwright

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **API**: tRPC for type-safe client-server communication
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session and API caching
- **Queue**: BullMQ for background jobs

### AI Integration
- **Models**: GPT-4, Claude-3, Gemini Pro with intelligent routing
- **Local**: WebLLM for privacy-sensitive processing
- **Vector**: Pinecone for context storage and semantic search

## Code Generation Guidelines

### TypeScript Standards
```typescript
// Always use strict TypeScript with explicit types
interface ComponentProps {
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly onClick?: (event: React.MouseEvent) => void;
}

// Prefer const assertions and readonly where appropriate
const AI_MODELS = ['gpt-4', 'claude-3-opus', 'gemini-pro'] as const;
type AIModel = typeof AI_MODELS[number];

// Use discriminated unions for complex state
type AIState = 
  | { status: 'idle' }
  | { status: 'processing'; progress: number }
  | { status: 'complete'; result: string }
  | { status: 'error'; error: Error };
```

### Component Patterns
```typescript
// Use this pattern for all React components
import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SmartAddressBarProps {
  readonly value: string;
  readonly onQuery: (query: string) => void;
  readonly onNavigate: (url: string) => void;
  readonly isAIMode: boolean;
  readonly className?: string;
}

export const SmartAddressBar = memo<SmartAddressBarProps>(({
  value,
  onQuery,
  onNavigate,
  isAIMode,
  className
}) => {
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isAIMode) {
      onQuery(value);
    } else {
      onNavigate(value);
    }
  }, [value, isAIMode, onQuery, onNavigate]);

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn("flex items-center", className)}
    >
      {/* Component implementation */}
    </form>
  );
});

SmartAddressBar.displayName = 'SmartAddressBar';
```

### AI Integration Patterns
```typescript
// Pattern for AI model routing
class AIModelRouter {
  private readonly models = {
    'gpt-4': new OpenAIProvider(),
    'claude-3-opus': new AnthropicProvider(),
    'gemini-pro': new GoogleProvider(),
  } as const;

  async routeRequest(request: AIRequest): Promise<AIResponse> {
    const model = this.selectOptimalModel(request);
    
    try {
      return await this.models[model].process(request);
    } catch (error) {
      return this.handleFallback(request, model, error);
    }
  }

  private selectOptimalModel(request: AIRequest): keyof typeof this.models {
    // Code analysis -> GPT-4
    if (request.type === 'code_generation') return 'gpt-4';
    // Deep analysis -> Claude
    if (request.type === 'analysis') return 'claude-3-opus';
    // Multimodal -> Gemini
    if (request.hasImages) return 'gemini-pro';
    
    return 'gpt-4';
  }
}
```

### Error Handling Standards
```typescript
// Use Result pattern for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Async function error handling
async function processAIRequest(request: AIRequest): Promise<Result<AIResponse>> {
  try {
    const response = await aiRouter.routeRequest(request);
    return { success: true, data: response };
  } catch (error) {
    logger.error('AI request failed', { error, request });
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}

// React component error boundaries
export class AIErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('AI component error', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <AIErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## Specific Component Requirements

### Smart Address Bar
- Dual mode: URL navigation and AI query
- Auto-completion with context awareness
- Voice input support via Web Speech API
- Keyboard shortcuts (Cmd+K for command palette)

### AI Conversation Panel
- Streaming responses with real-time updates
- Source citations with clickable references
- Message history with search capability
- Export functionality (markdown, PDF)

### Tab Management System
- Vertical layout with drag-and-drop
- AI-powered grouping and organization
- Tab previews on hover
- Spaces for project organization

### Custom Command System
- Workflow recording and playback
- Parameter extraction and validation
- Error handling and recovery
- Usage analytics integration

## Performance Requirements

### Browser Performance
```typescript
// Virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualTabList = ({ tabs }: { tabs: Tab[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: tabs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <TabItem 
            key={virtualItem.key}
            tab={tabs[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### AI Response Optimization
```typescript
// Debounced AI queries
const useAIQuery = (query: string, delay = 500) => {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(timer);
  }, [query, delay]);

  return useQuery({
    queryKey: ['ai-query', debouncedQuery],
    queryFn: () => aiRouter.routeRequest({ content: debouncedQuery }),
    enabled: Boolean(debouncedQuery.trim()),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

## Security & Privacy Patterns

### Privacy-First Development
```typescript
// Content filtering for sensitive data
class PrivacyFilter {
  private readonly sensitivePatterns = [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit cards
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  ];

  private readonly sensitiveDomains = [
    'bank', 'healthcare', 'medical', 'financial'
  ];

  filterContent(content: string, url: string): string {
    // Skip sensitive domains entirely
    if (this.sensitiveDomains.some(domain => url.includes(domain))) {
      return '[Content filtered for privacy]';
    }

    // Redact sensitive patterns
    let filtered = content;
    this.sensitivePatterns.forEach(pattern => {
      filtered = filtered.replace(pattern, '[REDACTED]');
    });

    return filtered;
  }
}

// Local-first processing for sensitive operations
class LocalAIProcessor {
  private localModel?: WebLLM;

  async processPrivately(request: PrivateAIRequest): Promise<AIResponse> {
    if (!this.localModel) {
      await this.initializeLocalModel();
    }

    // Process sensitive queries locally
    return this.localModel!.process(request);
  }

  private async initializeLocalModel(): Promise<void> {
    this.localModel = new WebLLM({
      model: 'Phi-3-mini-4k-instruct-q4f16_1',
      // Configuration for on-device processing
    });
    await this.localModel.load();
  }
}
```

## Testing Standards

### Component Testing
```typescript
// Test pattern for AI components
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SmartAddressBar } from './SmartAddressBar';

describe('SmartAddressBar', () => {
  const mockProps = {
    value: '',
    onQuery: vi.fn(),
    onNavigate: vi.fn(),
    isAIMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should switch between URL and AI modes', () => {
    const { rerender } = render(<SmartAddressBar {...mockProps} />);
    
    // Test URL mode
    expect(screen.getByPlaceholderText(/enter url/i)).toBeInTheDocument();
    
    // Test AI mode
    rerender(<SmartAddressBar {...mockProps} isAIMode />);
    expect(screen.getByPlaceholderText(/ask ai/i)).toBeInTheDocument();
  });

  it('should handle AI queries correctly', async () => {
    render(<SmartAddressBar {...mockProps} isAIMode value="test query" />);
    
    fireEvent.submit(screen.getByRole('form'));
    
    await waitFor(() => {
      expect(mockProps.onQuery).toHaveBeenCalledWith('test query');
    });
  });
});
```

### Integration Testing
```typescript
// E2E test patterns with Playwright
import { test, expect } from '@playwright/test';

test.describe('AI Features', () => {
  test('should provide intelligent responses to user queries', async ({ page }) => {
    await page.goto('/');
    
    // Switch to AI mode
    await page.click('[data-testid="ai-mode-toggle"]');
    
    // Enter query
    await page.fill('[data-testid="address-bar"]', 'Summarize these tabs');
    await page.press('[data-testid="address-bar"]', 'Enter');
    
    // Wait for AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-response"]')).toContainText('Summary');
  });
});
```

## Accessibility Requirements

Always include WCAG 2.1 AA compliance:

```typescript
// Accessible component patterns
const AccessibleButton = ({ children, onClick, disabled, ...props }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-disabled={disabled}
    className={cn(
      "focus:ring-2 focus:ring-blue-500 focus:outline-none",
      "disabled:opacity-50 disabled:cursor-not-allowed"
    )}
    {...props}
  >
    {children}
  </button>
);

// Keyboard navigation support
const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          onSelect(items[selectedIndex]);
        }
        break;
    }
  }, [items, selectedIndex, onSelect]);

  return { selectedIndex, handleKeyDown };
};
```

## Documentation Standards

Always include comprehensive JSDoc:

```typescript
/**
 * Intelligent AI model router that selects optimal models based on request type
 * and provides fallback capabilities for improved reliability.
 * 
 * @example
 * ```typescript
 * const router = new AIModelRouter();
 * const response = await router.routeRequest({
 *   type: 'analysis',
 *   content: 'Analyze this data...',
 *   context: tabContexts
 * });
 * ```
 */
class AIModelRouter {
  /**
   * Routes an AI request to the most appropriate model
   * 
   * @param request - The AI request to process
   * @returns Promise resolving to the AI response
   * @throws {AIProcessingError} When all models fail to process the request
   */
  async routeRequest(request: AIRequest): Promise<AIResponse> {
    // Implementation
  }
}
```

## Code Quality Checklist

Before generating code, ensure:

- [ ] TypeScript strict mode compliance
- [ ] Comprehensive error handling with Result patterns
- [ ] Performance optimization (memoization, virtualization)
- [ ] Accessibility features (ARIA labels, keyboard navigation)
- [ ] Security measures (input validation, privacy filtering)
- [ ] Testing coverage (unit tests, integration scenarios)
- [ ] Documentation (JSDoc comments, usage examples)
- [ ] Consistent naming conventions and patterns
- [ ] Browser compatibility considerations
- [ ] AI integration following established patterns

## Common Anti-Patterns to Avoid

- Don't use `any` type - always provide explicit types
- Don't mutate props or state directly
- Don't make API calls in render functions
- Don't ignore error handling in async operations
- Don't bypass accessibility requirements
- Don't hardcode AI model selection without routing logic
- Don't process sensitive data in cloud models without user consent
- Don't create memory leaks with uncleared timers/subscriptions

## AI-Specific Considerations

- Always implement graceful degradation when AI services are unavailable
- Include user consent mechanisms for data processing
- Provide transparency about which AI model is being used
- Implement proper rate limiting to manage API costs
- Cache responses appropriately to improve performance
- Include source citations for AI-generated content
- Allow users to customize AI behavior and preferences