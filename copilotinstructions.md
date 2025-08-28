# GitHub Copilot Instructions for Project Aura

## Project Context

You are working on Project Aura, the world's first truly agentic browser that eliminates the "effort factor" through seamless AI integration. This is a Chromium-based browser with native AI capabilities built using React 18+, TypeScript 5.3+, and a hybrid local/cloud AI processing architecture.

## Core Architecture Understanding

### Foundation Dependencies (CRITICAL)

Before implementing any AI features, ensure these foundations exist:

1. **Browser Core Foundation** - Chromium integration, tab management, security framework
2. **AI Engine Foundation** - Multi-model AI integration (GPT-4, Claude-3, Gemini Pro), context management
3. **UI Foundation** - React components, design system, AI-enhanced UI patterns

**NEVER assume these foundations exist - always reference them in your code.**

### Technology Stack (MANDATORY)

```typescript
// Frontend (Required)
React 18+ with TypeScript 5.3+ (strict mode)
Vite build tool with custom Chromium integration
Tailwind CSS with custom design system
Zustand + React Query for state management
Vitest + React Testing Library + Playwright for testing

// Backend & AI
Node.js 20+ with TypeScript
PostgreSQL + Vector DB for AI context
tRPC for type-safe APIs
Multi-model AI integration with routing/fallback
```

## Code Generation Guidelines

### 1. TypeScript Patterns (ALWAYS USE)

```typescript
// Component Pattern
export interface ComponentProps {
  // Comprehensive prop typing
  aiEnabled?: boolean;
  onAIAction?: (action: AIAction) => void;
}

export const Component: React.FC<ComponentProps> = ({ 
  aiEnabled = false,
  onAIAction 
}) => {
  // Implementation with proper error handling
};

// Service Pattern
export class AIService {
  constructor(private dependencies: Dependencies) {}
  
  public async processQuery(query: string): Promise<AIResponse> {
    // Implementation with error handling and fallbacks
  }
}

// AI Integration Pattern
export interface AIProvider {
  query(prompt: string, context?: Context): Promise<AIResponse>;
  analyze(content: Content): Promise<Analysis>;
}
```

### 2. AI Feature Implementation Pattern

```typescript
// ALWAYS use this pattern for AI features
import { useAIEngine } from '@/packages/ai-engine';
import { useBrowserCore } from '@/packages/browser-core';
import { useUIFoundation } from '@/packages/ui-components';

export const AIFeatureComponent: React.FC<Props> = () => {
  const { router, contextManager } = useAIEngine();
  const { contentExtractor, tabManager } = useBrowserCore();
  const { ConversationPanel, SuggestionCard } = useUIFoundation();
  
  // Feature implementation that builds on foundations
};
```

### 3. Error Handling Pattern (MANDATORY)

```typescript
// ALWAYS implement comprehensive error handling
try {
  const result = await aiEngine.processQuery(query);
  return result;
} catch (error) {
  if (error instanceof AIProviderError) {
    // Try fallback provider
    return await aiEngine.fallbackQuery(query);
  }
  
  // Log error and provide user-friendly message
  logger.error('AI query failed', { error, query });
  throw new UserFriendlyError('Unable to process request. Please try again.');
}
```

## AI-Specific Code Patterns

### Context Extraction

```typescript
// ALWAYS use Browser Core Foundation for content extraction
const extractTabContext = async (tabId: string): Promise<TabContext> => {
  const content = await browserCore.extractContent(tabId, {
    includeText: true,
    includeMetadata: true,
    respectPrivacy: true
  });
  
  return aiEngine.contextManager.processContent(content);
};
```

### Multi-Model AI Integration

```typescript
// ALWAYS use AI Engine Foundation's router
const processAIQuery = async (query: string, type: QueryType): Promise<AIResponse> => {
  const provider = aiEngine.router.selectProvider(type, {
    preferLocal: query.includesSensitiveData,
    maxLatency: 3000,
    fallbackEnabled: true
  });
  
  return await provider.query(query);
};
```

### Privacy-Safe Processing

```typescript
// ALWAYS filter sensitive data before AI processing
const processSafeContent = async (content: string): Promise<AIResponse> => {
  const filtered = await aiEngine.privacy.filterSensitiveData(content);
  
  if (filtered.containsSensitiveData && !userConsent) {
    throw new PrivacyError('Sensitive data detected. User consent required.');
  }
  
  return await aiEngine.processContent(filtered.content);
};
```

## Component Development Rules

### React Component Structure

```typescript
// ALWAYS use this structure
import React, { useState, useCallback, useMemo } from 'react';
import { useAI, useBrowser, useUI } from '@/hooks';

interface SmartComponentProps {
  // Comprehensive typing
  aiEnabled?: boolean;
  contextSources?: string[];
  onResult?: (result: AIResult) => void;
}

export const SmartComponent: React.FC<SmartComponentProps> = ({
  aiEnabled = true,
  contextSources = [],
  onResult
}) => {
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Foundation hooks
  const { processQuery } = useAI();
  const { extractContext } = useBrowser();
  const { showNotification } = useUI();
  
  // Memoized computations
  const contextData = useMemo(() => 
    extractContext(contextSources), [contextSources]
  );
  
  // Event handlers
  const handleAIQuery = useCallback(async (query: string) => {
    if (!aiEnabled) return;
    
    setIsProcessing(true);
    try {
      const result = await processQuery(query, contextData);
      onResult?.(result);
    } catch (error) {
      showNotification('Error processing query', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [aiEnabled, contextData, processQuery, onResult, showNotification]);
  
  return (
    <div className="smart-component">
      {/* Component JSX with proper accessibility */}
    </div>
  );
};
```

### Styling with Tailwind (REQUIRED)

```typescript
// ALWAYS use design system tokens
const styles = {
  primary: 'bg-brand-blue text-white hover:bg-brand-blue-dark',
  aiAccent: 'bg-ai-accent text-white border-ai-accent-light',
  success: 'bg-success-green text-white',
  error: 'bg-error-red text-white',
  
  // Spacing system (4px base)
  spacing: {
    xs: 'p-1',    // 4px
    sm: 'p-2',    // 8px
    md: 'p-4',    // 16px
    lg: 'p-6',    // 24px
    xl: 'p-8'     // 32px
  }
};
```

## Testing Patterns (MANDATORY)

### Component Testing

```typescript
// ALWAYS include comprehensive tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SmartComponent } from './SmartComponent';

describe('SmartComponent', () => {
  const mockProcessQuery = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should process AI queries when enabled', async () => {
    render(<SmartComponent aiEnabled={true} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(mockProcessQuery).toHaveBeenCalledWith('test query', expect.any(Object));
    });
  });
  
  it('should handle errors gracefully', async () => {
    mockProcessQuery.mockRejectedValue(new Error('AI Error'));
    
    render(<SmartComponent aiEnabled={true} />);
    
    // Test error handling
  });
  
  it('should be accessible', () => {
    render(<SmartComponent />);
    
    // Test WCAG compliance
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-label');
  });
});
```

## Performance Optimization Rules

### React Performance

```typescript
// ALWAYS optimize expensive operations
const ExpensiveComponent: React.FC<Props> = ({ data, onProcess }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => 
    expensiveDataProcessing(data), [data]
  );
  
  // Memoize callbacks to prevent re-renders
  const handleClick = useCallback((item: Item) => {
    onProcess(item);
  }, [onProcess]);
  
  // Use React.memo for expensive components
  return <MemoizedChild data={processedData} onClick={handleClick} />;
};

export default React.memo(ExpensiveComponent);
```

### AI Response Optimization

```typescript
// ALWAYS implement caching for AI responses
const useCachedAIQuery = (query: string) => {
  return useQuery({
    queryKey: ['ai-query', query],
    queryFn: () => aiEngine.processQuery(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      // Retry logic for AI failures
      return failureCount < 3 && !error.isPermanent;
    }
  });
};
```

## Security Implementation (CRITICAL)

### Input Sanitization

```typescript
// ALWAYS sanitize user inputs
import DOMPurify from 'dompurify';

const sanitizeUserInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
};
```

### Secure AI Processing

```typescript
// ALWAYS implement secure AI data handling
const secureAIProcess = async (data: UserData): Promise<AIResponse> => {
  // Detect and filter PII
  const filtered = await privacyFilter.filterPII(data);
  
  // Encrypt sensitive data
  const encrypted = await encryption.encrypt(filtered.sensitiveData);
  
  // Process with AI
  const response = await aiEngine.process({
    ...filtered.safeData,
    encryptedData: encrypted
  });
  
  return response;
};
```

## Accessibility Requirements (MANDATORY)

### WCAG 2.1 AA Compliance

```typescript
// ALWAYS include proper accessibility
const AccessibleComponent: React.FC<Props> = () => {
  return (
    <div role="region" aria-label="AI Assistant">
      <button
        aria-label="Send message to AI assistant"
        aria-describedby="ai-help-text"
        onClick={handleSubmit}
      >
        Send
      </button>
      
      <div id="ai-help-text" className="sr-only">
        Type your message and press send to interact with the AI assistant
      </div>
      
      {/* Proper focus management */}
      <div
        ref={focusRef}
        tabIndex={-1}
        aria-live="polite"
        aria-atomic="true"
      >
        {aiResponse}
      </div>
    </div>
  );
};
```

## File Organization (ENFORCE)

### Directory Structure

```
packages/
├── browser-core/
│   ├── src/
│   │   ├── engine/           # Chromium integration
│   │   ├── ui/              # React components
│   │   ├── services/        # Business logic
│   │   └── types/           # TypeScript definitions
├── ai-engine/
│   ├── src/
│   │   ├── models/          # AI provider integrations
│   │   ├── processing/      # Context and analysis
│   │   ├── agents/          # AI agents
│   │   └── privacy/         # Privacy protection
└── ui-components/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── hooks/           # Custom hooks
    │   └── styles/          # Design system
```

## Common Patterns to Generate

### AI-Enhanced Address Bar

```typescript
export const SmartAddressBar: React.FC<AddressBarProps> = ({
  mode = 'url',
  onModeChange,
  onSubmit
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { processQuery } = useAI();
  const { navigate } = useBrowser();
  
  const handleSubmit = useCallback(async () => {
    if (mode === 'ai') {
      const response = await processQuery(query);
      onSubmit?.(response);
    } else {
      navigate(query);
    }
  }, [mode, query, processQuery, navigate, onSubmit]);
  
  return (
    <div className="smart-address-bar">
      {/* Implementation */}
    </div>
  );
};
```

### AI Conversation Interface

```typescript
export const ConversationPanel: React.FC<ConversationProps> = ({
  messages,
  onSendMessage,
  contextPills
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { processMessage } = useAI();
  
  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    
    setIsTyping(true);
    try {
      const response = await processMessage(input);
      onSendMessage?.(response);
    } finally {
      setIsTyping(false);
      setInput('');
    }
  }, [input, processMessage, onSendMessage]);
  
  return (
    <div className="conversation-panel">
      {/* Implementation */}
    </div>
  );
};
```

## Quality Checklist (VERIFY BEFORE COMMIT)

- [ ] TypeScript strict mode compliance
- [ ] Comprehensive error handling
- [ ] Privacy and security measures
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Test coverage >90%
- [ ] Foundation dependencies referenced
- [ ] Proper documentation
- [ ] Design system compliance
- [ ] Mobile responsiveness

## Success Metrics to Code For

- 40% time savings on workflows
- <3 second AI response times
- <100ms UI interactions
- >95% AI query success rate
- >90% test coverage
- WCAG 2.1 AA compliance
