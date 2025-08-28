# Amazon Q Developer Rules for Project Aura

## Project Overview

Project Aura is an AI-native browser built on Chromium that eliminates the "effort factor" through seamless AI integration. You are assisting with development of a sophisticated browser application that maintains full browser functionality while adding intelligent automation capabilities.

## Core Architecture Context

### Primary Stack

- **Browser Engine**: Chromium-based with custom modifications
- **Frontend**: React 18 + TypeScript 5.3+ with Vite build system
- **Backend**: Node.js 20+ with tRPC API layer
- **AI Integration**: Multi-model approach (GPT-4, Claude-3, Gemini Pro)
- **Database**: PostgreSQL with Prisma ORM + Redis caching
- **Styling**: Tailwind CSS with custom design system

### Project Structure

```markdown
project-aura/
├── packages/
│   ├── browser-core/          # Main browser application
│   ├── ai-engine/             # AI processing and integration
│   ├── ui-components/         # Shared React components
│   ├── extension-api/         # Chrome extension compatibility
│   └── shared-utils/          # Common utilities
├── apps/
│   ├── browser/               # Main browser app
│   └── landing-page/          # Marketing site
└── tools/
    ├── build-scripts/         # Custom build automation
    └── ai-agents/            # AI development assistants
```

## Code Generation Standards

### 1. TypeScript Requirements

**ALWAYS use strict TypeScript with explicit typing:**

```typescript
// ✅ CORRECT: Explicit interfaces and readonly properties
interface AIRequest {
  readonly type: 'query' | 'analysis' | 'synthesis';
  readonly content: string;
  readonly context: TabContext[];
  readonly privacyLevel: 'low' | 'medium' | 'high';
}

// ✅ CORRECT: Const assertions for literal types
const AI_PROVIDERS = ['openai', 'anthropic', 'google'] as const;
type AIProvider = typeof AI_PROVIDERS[number];

// ❌ AVOID: Any types or implicit typing
const processData = (data: any) => { /* ... */ };
```

**Use discriminated unions for complex state:**

```typescript
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading'; progress: number }
  | { status: 'success'; data: AIResponse }
  | { status: 'error'; error: Error };
```

### 2. React Component Patterns

**Standard component structure:**

```typescript
import { memo, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  readonly children?: React.ReactNode;
  readonly className?: string;
  readonly isActive?: boolean;
  readonly onClick?: (event: React.MouseEvent) => void;
}

export const ComponentName = memo<ComponentProps>(({ 
  children, 
  className, 
  isActive = false,
  onClick 
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.(e);
  }, [onClick]);

  const computedClass = useMemo(() => cn(
    "base-styles",
    isActive && "active-styles",
    className
  ), [isActive, className]);

  return (
    <div className={computedClass} onClick={handleClick}>
      {children}
    </div>
  );
});

ComponentName.displayName = 'ComponentName';
```

### 3. Error Handling Standards

**Use Result pattern for error handling:**

```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function processAIRequest(request: AIRequest): Promise<Result<AIResponse>> {
  try {
    const response = await aiRouter.routeRequest(request);
    return { success: true, data: response };
  } catch (error) {
    logger.error('AI request failed', { error, request: request.type });
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error')
    };
  }
}
```

**React error boundaries:**

```typescript
export class AIErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Component error boundary triggered', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback ?? DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }
    return this.props.children;
  }
}
```

## AI Integration Patterns

### 1. Model Router Implementation

```typescript
class AIModelRouter {
  private readonly models = {
    'gpt-4': new OpenAIProvider({
      model: 'gpt-4-turbo',
      maxTokens: 4096,
      temperature: 0.1,
    }),
    'claude-3-opus': new AnthropicProvider({
      model: 'claude-3-opus-20240229',
      maxTokens: 4096,
    }),
    'gemini-pro': new GoogleProvider({
      model: 'gemini-pro',
      generationConfig: { temperature: 0.1 },
    }),
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
    switch (request.type) {
      case 'code_generation':
        return 'gpt-4';
      case 'analysis':
      case 'synthesis':
        return 'claude-3-opus';
      case 'multimodal':
        return 'gemini-pro';
      default:
        return 'gpt-4';
    }
  }

  private async handleFallback(
    request: AIRequest, 
    failedModel: string, 
    error: Error
  ): Promise<AIResponse> {
    const fallbackModels = Object.keys(this.models).filter(m => m !== failedModel);
    
    for (const model of fallbackModels) {
      try {
        logger.warn(`Falling back to ${model} after ${failedModel} failed`, { error });
        return await this.models[model as keyof typeof this.models].process(request);
      } catch (fallbackError) {
        continue;
      }
    }
    
    throw new Error(`All AI models failed: ${error.message}`);
  }
}
```

### 2. Context Management

```typescript
class ContextManager {
  private vectorStore = new PineconeClient();
  private privacyFilter = new PrivacyFilter();

  async extractTabContext(tab: Tab): Promise<TabContext> {
    const rawContent = await this.extractContent(tab);
    const filteredContent = await this.privacyFilter.sanitize(rawContent, tab.url);
    
    const embeddings = await this.generateEmbeddings(filteredContent);
    
    await this.vectorStore.upsert({
      id: `tab-${tab.id}`,
      values: embeddings,
      metadata: {
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
        contentHash: this.hashContent(filteredContent),
      },
    });

    return {
      tabId: tab.id,
      content: filteredContent,
      embeddings,
      extractedEntities: await this.extractEntities(filteredContent),
      sentiment: await this.analyzeSentiment(filteredContent),
    };
  }

  private async extractContent(tab: Tab): Promise<string> {
    try {
      const [{ result }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => document.body.innerText,
      });
      return result || '';
    } catch (error) {
      logger.warn('Failed to extract tab content', { tabId: tab.id, error });
      return '';
    }
  }
}
```

## Security & Privacy Requirements

### 1. Privacy-First Implementation

```typescript
class PrivacyFilter {
  private readonly sensitivePatterns = [
    { name: 'creditCard', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
    { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
    { name: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
    { name: 'phone', pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g },
  ];

  private readonly sensitiveDomains = [
    'bank', 'banking', 'healthcare', 'medical', 'financial', 'insurance'
  ];

  async sanitize(content: string, url: string): Promise<string> {
    // Block sensitive domains entirely
    if (this.sensitiveDomains.some(domain => url.toLowerCase().includes(domain))) {
      return '[Content filtered for privacy - sensitive domain]';
    }

    // Redact sensitive patterns
    let sanitized = content;
    for (const { name, pattern } of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, `[${name.toUpperCase()}_REDACTED]`);
    }

    return sanitized;
  }

  determinePrivacyLevel(content: string, url: string): 'low' | 'medium' | 'high' {
    if (this.sensitiveDomains.some(domain => url.includes(domain))) return 'high';
    if (this.sensitivePatterns.some(({ pattern }) => pattern.test(content))) return 'medium';
    return 'low';
  }
}

// Local processing for high-privacy scenarios
class LocalAIProcessor {
  private localModel?: WebLLM;

  async processPrivately(request: PrivateAIRequest): Promise<AIResponse> {
    if (!this.localModel) {
      await this.initializeLocalModel();
    }

    return this.localModel!.process(request);
  }

  private async initializeLocalModel(): Promise<void> {
    this.localModel = new WebLLM({
      model: 'Phi-3-mini-4k-instruct-q4f16_1',
      kvConfig: { numLayers: 32, shape: [32, 32, 128], dtype: 'float16' },
    });
    
    await this.localModel.load();
  }
}
```

### 2. Input Validation & Sanitization

```typescript
// Zod schemas for validation
const aiRequestSchema = z.object({
  type: z.enum(['query', 'analysis', 'synthesis', 'generation']),
  content: z.string().min(1).max(10000),
  context: z.array(z.object({
    tabId: z.string(),
    content: z.string(),
    url: z.string().url(),
  })).max(20),
  privacyLevel: z.enum(['low', 'medium', 'high']),
});

// Input sanitization
function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
```

## Performance Optimization

### 1. React Optimization Patterns

```typescript
// Virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualTabList = ({ tabs }: { tabs: Tab[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: tabs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {items.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TabItem tab={tabs[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Debounced AI queries
const useAIQuery = (query: string, options: { delay?: number } = {}) => {
  const { delay = 500 } = options;
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), delay);
    return () => clearTimeout(timer);
  }, [query, delay]);

  return useQuery({
    queryKey: ['ai-query', debouncedQuery],
    queryFn: () => aiRouter.routeRequest({ 
      type: 'query',
      content: debouncedQuery,
      context: [],
      privacyLevel: 'low'
    }),
    enabled: Boolean(debouncedQuery.trim()),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      return failureCount < 2 && !error.message.includes('rate limit');
    },
  });
};
```

### 2. Memory Management

```typescript
// Proper cleanup in useEffect
const useTabMonitoring = (tabId: string) => {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await monitorTabPerformance(tabId);
      } catch (error) {
        logger.error('Tab monitoring failed', { tabId, error });
      }
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [tabId]);
};

// WeakMap for memory-efficient caching
class TabContextCache {
  private cache = new WeakMap<Tab, TabContext>();
  private sizeLimit = 100;
  private accessOrder = new Map<string, number>();

  get(tab: Tab): TabContext | undefined {
    const context = this.cache.get(tab);
    if (context) {
      this.accessOrder.set(tab.id, Date.now());
    }
    return context;
  }

  set(tab: Tab, context: TabContext): void {
    // Implement LRU eviction if size limit exceeded
    if (this.accessOrder.size >= this.sizeLimit) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(tab, context);
    this.accessOrder.set(tab.id, Date.now());
  }

  private evictLeastRecentlyUsed(): void {
    const oldestEntry = Array.from(this.accessOrder.entries())
      .sort((a, b) => a[1] - b[1])[0];
    
    if (oldestEntry) {
      this.accessOrder.delete(oldestEntry[0]);
    }
  }
}

// Resource cleanup utility
class ResourceManager {
  private resources = new Set<() => void>();

  addCleanup(cleanup: () => void): void {
    this.resources.add(cleanup);
  }

  cleanup(): void {
    for (const cleanup of this.resources) {
      try {
        cleanup();
      } catch (error) {
        logger.warn('Resource cleanup failed', { error });
      }
    }
    this.resources.clear();
  }
}
```

## Testing Standards

### 1. Unit Testing Patterns

```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
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

  it('should toggle between URL and AI modes', async () => {
    const user = userEvent.setup();
    render(<SmartAddressBar {...mockProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /toggle ai mode/i });
    
    // Initially in URL mode
    expect(screen.getByPlaceholderText(/enter url/i)).toBeInTheDocument();
    
    // Toggle to AI mode
    await user.click(toggleButton);
    expect(screen.getByPlaceholderText(/ask ai/i)).toBeInTheDocument();
  });

  it('should handle AI queries with proper debouncing', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    
    render(<SmartAddressBar {...mockProps} isAIMode />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test query');
    
    // Should not call immediately
    expect(mockProps.onQuery).not.toHaveBeenCalled();
    
    // Fast forward debounce timer
    vi.advanceTimersByTime(500);
    
    await waitFor(() => {
      expect(mockProps.onQuery).toHaveBeenCalledWith('test query');
    });
    
    vi.useRealTimers();
  });

  it('should handle keyboard navigation correctly', async () => {
    const user = userEvent.setup();
    render(<SmartAddressBar {...mockProps} isAIMode value="test" />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('{Enter}');
    
    expect(mockProps.onQuery).toHaveBeenCalledWith('test');
  });
});

// AI service testing
describe('AIModelRouter', () => {
  let router: AIModelRouter;
  let mockOpenAI: vi.Mocked<OpenAIProvider>;
  let mockClaude: vi.Mocked<AnthropicProvider>;

  beforeEach(() => {
    mockOpenAI = vi.mocked(new OpenAIProvider());
    mockClaude = vi.mocked(new AnthropicProvider());
    router = new AIModelRouter();
  });

  it('should route code generation requests to GPT-4', async () => {
    const request: AIRequest = {
      type: 'code_generation',
      content: 'Create a React component',
      context: [],
      privacyLevel: 'low',
    };

    mockOpenAI.process.mockResolvedValue({ content: 'Generated code' });

    const result = await router.routeRequest(request);

    expect(mockOpenAI.process).toHaveBeenCalledWith(request);
    expect(result.content).toBe('Generated code');
  });

  it('should handle fallback when primary model fails', async () => {
    const request: AIRequest = {
      type: 'analysis',
      content: 'Analyze this data',
      context: [],
      privacyLevel: 'low',
    };

    mockClaude.process.mockRejectedValue(new Error('API Error'));
    mockOpenAI.process.mockResolvedValue({ content: 'Fallback analysis' });

    const result = await router.routeRequest(request);

    expect(mockClaude.process).toHaveBeenCalledWith(request);
    expect(mockOpenAI.process).toHaveBeenCalledWith(request);
    expect(result.content).toBe('Fallback analysis');
  });
});
```

### 2. Integration Testing

```typescript
// E2E testing with Playwright
import { test, expect } from '@playwright/test';

test.describe('AI Integration Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app initialization
    await expect(page.locator('[data-testid="app-ready"]')).toBeVisible();
  });

  test('should provide intelligent cross-tab analysis', async ({ page, context }) => {
    // Open multiple tabs with related content
    const page1 = await context.newPage();
    await page1.goto('/tab1-content');
    
    const page2 = await context.newPage();
    await page2.goto('/tab2-content');
    
    // Switch back to main page
    await page.bringToFront();
    
    // Activate AI mode
    await page.click('[data-testid="ai-mode-toggle"]');
    
    // Ask for cross-tab analysis
    await page.fill('[data-testid="address-bar"]', 'Summarize information across all my open tabs');
    await page.press('[data-testid="address-bar"]', 'Enter');
    
    // Wait for AI processing
    await expect(page.locator('[data-testid="ai-thinking"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-thinking"]')).toBeHidden({ timeout: 10000 });
    
    // Verify response includes content from multiple tabs
    const response = page.locator('[data-testid="ai-response"]');
    await expect(response).toContainText('Summary');
    await expect(response.locator('[data-testid="source-citation"]')).toHaveCount(2);
  });

  test('should execute custom commands successfully', async ({ page }) => {
    // Create a custom command
    await page.click('[data-testid="command-builder"]');
    await page.fill('[data-testid="command-name"]', 'Daily Standup');
    
    // Add workflow steps
    await page.click('[data-testid="add-step"]');
    await page.selectOption('[data-testid="step-type"]', 'navigate');
    await page.fill('[data-testid="step-url"]', '/jira-dashboard');
    
    await page.click('[data-testid="add-step"]');
    await page.selectOption('[data-testid="step-type"]', 'ai-analyze');
    await page.fill('[data-testid="step-prompt"]', 'Summarize my assigned tickets');
    
    await page.click('[data-testid="save-command"]');
    
    // Execute the command
    await page.press('body', 'Control+K'); // Command palette
    await page.fill('[data-testid="command-search"]', 'Daily Standup');
    await page.press('[data-testid="command-search"]', 'Enter');
    
    // Verify command execution
    await expect(page).toHaveURL(/jira-dashboard/);
    await expect(page.locator('[data-testid="ai-response"]')).toContainText('tickets');
  });
});

// API integration testing
describe('tRPC API Integration', () => {
  it('should handle AI queries end-to-end', async () => {
    const caller = appRouter.createCaller({
      db: mockDb,
      user: { id: 'test-user', email: 'test@example.com' },
    });

    const request = {
      type: 'query' as const,
      content: 'What is the weather today?',
      context: [],
      privacyLevel: 'low' as const,
    };

    const response = await caller.ai.query(request);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.content).toContain('weather');
      expect(response.data.modelUsed).toBeTruthy();
    }
  });
});
```

## Accessibility Standards

### 1. WCAG 2.1 AA Compliance

```typescript
// Accessible component implementation
const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "disabled:pointer-events-none disabled:opacity-50",
        
        // Size variants
        {
          'h-8 px-3 text-sm': size === 'small',
          'h-10 px-4': size === 'medium',
          'h-12 px-6 text-lg': size === 'large',
        },
        
        // Color variants
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
          'border border-gray-300 bg-white hover:bg-gray-50': variant === 'outline',
        },
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Keyboard navigation hook
const useKeyboardNavigation = <T,>(
  items: T[],
  onSelect: (item: T, index: number) => void,
  options: {
    loop?: boolean;
    initialIndex?: number;
  } = {}
) => {
  const { loop = true, initialIndex = -1 } = options;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const nextIndex = prev + 1;
          if (nextIndex >= items.length) {
            return loop ? 0 : prev;
          }
          return nextIndex;
        });
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const nextIndex = prev - 1;
          if (nextIndex < 0) {
            return loop ? items.length - 1 : 0;
          }
          return nextIndex;
        });
        break;
        
      case 'Enter':
      case ' ':
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          e.preventDefault();
          onSelect(items[selectedIndex], selectedIndex);
        }
        break;
        
      case 'Escape':
        setSelectedIndex(-1);
        break;
    }
  }, [items, selectedIndex, onSelect, loop]);

  return { selectedIndex, handleKeyDown, setSelectedIndex };
};

// Screen reader announcements
const useScreenReader = () => {
  const announceRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.textContent = message;
      announceRef.current.setAttribute('aria-live', priority);
      
      // Clear after announcement
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const ScreenReaderAnnouncer = useCallback(() => (
    <div
      ref={announceRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  ), []);

  return { announce, ScreenReaderAnnouncer };
};
```

### 2. Focus Management

```typescript
// Focus trap for modals
const useFocusTrap = (isOpen: boolean) => {
  const trapRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const trap = trapRef.current;
    if (!trap) return;

    // Store previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusableElements = trap.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  return trapRef;
};
```

## Documentation Standards

### 1. JSDoc Comments

**Always include comprehensive JSDoc for public APIs:**

```typescript
/**
 * Manages AI model routing and provides intelligent fallback capabilities
 * for improved reliability and cost optimization.
 * 
 * @example Basic usage
 * ```typescript
 * const router = new AIModelRouter();
 * const response = await router.routeRequest({
 *   type: 'analysis',
 *   content: 'Analyze user feedback',
 *   context: [{ tabId: '123', content: 'feedback data' }],
 *   privacyLevel: 'medium'
 * });
 * ```
 * 
 * @example With custom model selection
 * ```typescript
 * const response = await router.routeRequest(request, {
 *   preferredModel: 'claude-3-opus',
 *   timeout: 10000
 * });
 * ```
 */
class AIModelRouter {
  /**
   * Routes an AI request to the most appropriate model based on request type,
   * content complexity, and privacy requirements.
   * 
   * @param request - The AI request to process
   * @param options - Optional routing configuration
   * @returns Promise that resolves to the AI response
   * 
   * @throws {AIProcessingError} When all configured models fail to process the request
   * @throws {ValidationError} When the request format is invalid
   * @throws {RateLimitError} When API rate limits are exceeded
   * 
   * @since 1.0.0
   */
  async routeRequest(
    request: AIRequest, 
    options?: RoutingOptions
  ): Promise<AIResponse> {
    // Implementation details...
  }

  /**
   * Determines the optimal AI model for a given request type.
   * 
   * Uses the following priority:
   * - Code generation: GPT-4 (superior code quality)
   * - Analysis/synthesis: Claude-3 (better reasoning)
   * - Multimodal: Gemini Pro (image + text processing)
   * - Privacy-sensitive: Local model (on-device processing)
   * 
   * @param request - The AI request to analyze
   * @returns The optimal model identifier
   * 
   * @internal This method is used internally by routeRequest
   */
  private selectOptimalModel(request: AIRequest): ModelIdentifier {
    // Implementation...
  }
}
```

### 2. README and Setup Documentation

**Maintain clear setup instructions for AI agents:**

```typescript
// In component README files, include:

/**
 * # SmartAddressBar Component
 * 
 * An intelligent address bar that seamlessly switches between URL navigation
 * and AI query modes, providing contextual suggestions and voice input support.
 * 
 * ## Features
 * - Dual-mode operation (URL/AI)
 * - Real-time suggestion filtering
 * - Voice input with Web Speech API
 * - Keyboard shortcuts and accessibility
 * - Context-aware AI queries
 * 
 * ## Usage
 * ```tsx
 * import { SmartAddressBar } from '@/components/browser/SmartAddressBar';
 * 
 * function BrowserHeader() {
 *   const [query, setQuery] = useState('');
 *   const [isAIMode, setIsAIMode] = useState(false);
 * 
 *   return (
 *     <SmartAddressBar
 *       value={query}
 *       onChange={setQuery}
 *       isAIMode={isAIMode}
 *       onToggleMode={() => setIsAIMode(!isAIMode)}
 *       onQuery={handleAIQuery}
 *       onNavigate={handleNavigation}
 *     />
 *   );
 * }
 * ```
 * 
 * ## Props
 * | Prop | Type | Required | Description |
 * |------|------|----------|-------------|
 * | value | string | Yes | Current input value |
 * | onChange | function | Yes | Value change handler |
 * | isAIMode | boolean | Yes | Whether AI mode is active |
 * | onQuery | function | Yes | AI query submission handler |
 * | onNavigate | function | Yes | URL navigation handler |
 * 
 * ## Accessibility
 * - Full keyboard navigation support
 * - Screen reader announcements for mode changes
 * - High contrast mode compatibility
 * - Focus management with Tab/Shift+Tab
 * 
 * ## Performance Considerations
 * - Queries are debounced by 500ms to prevent excessive API calls
 * - Suggestions are cached for common queries
 * - Component uses React.memo for render optimization
 */
```

## Code Quality Checklist

**Before submitting any code, ensure:**

- [ ] **TypeScript Compliance**: All types explicitly defined, no `any` usage
- [ ] **Error Handling**: Comprehensive error boundaries and Result patterns
- [ ] **Performance**: Memoization, virtualization, debouncing where appropriate
- [ ] **Accessibility**: WCAG 2.1 AA compliance with proper ARIA labels
- [ ] **Security**: Input validation, privacy filtering, sanitization
- [ ] **Testing**: Unit tests with >90% coverage, integration test scenarios
- [ ] **Documentation**: JSDoc comments with examples and usage instructions
- [ ] **Consistency**: Follows established patterns and naming conventions
- [ ] **Browser Compatibility**: Works across modern browsers (Chrome 100+, Firefox 100+, Safari 15+)
- [ ] **AI Integration**: Proper model routing, fallback handling, privacy controls

## Anti-Patterns to Avoid

**Never do these things:**

- ❌ Use `any` type instead of proper TypeScript interfaces
- ❌ Make API calls directly in React render functions
- ❌ Ignore error handling in async operations
- ❌ Bypass accessibility features for "visual design" reasons
- ❌ Process sensitive data in cloud AI models without explicit user consent
- ❌ Create memory leaks with uncleared intervals/timeouts
- ❌ Hardcode API keys or sensitive configuration values
- ❌ Skip input validation and sanitization
- ❌ Ignore browser performance implications of heavy operations
- ❌ Implement custom solutions for problems solved by established libraries

## Final Reminders

1. **Privacy First**: Always consider privacy implications of AI processing
2. **Performance Matters**: Browser performance directly impacts user experience
3. **Accessibility is Required**: Not optional - build inclusive experiences
4. **Test Everything**: Comprehensive testing prevents regressions
5. **Document for Others**: Clear documentation helps team collaboration
6. **Security by Design**: Build security considerations into every feature
7. **Stay Updated**: Keep abreast of AI model updates and best practices
