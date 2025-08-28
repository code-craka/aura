# Enhanced GitHub Copilot Instructions for Project Aura

## Project Context

Project Aura is the world's first truly agentic browser that eliminates the "effort factor" through seamless AI integration. Built on Chromium with native AI capabilities, it uses React 18+, TypeScript 5.3+, and a sophisticated hybrid local/cloud AI processing architecture.

## Critical Foundation Dependencies

**MANDATORY: Before implementing any features, ensure these foundations exist and are properly imported:**

### 1. Browser Core Foundation (packages/browser-core/)
```typescript
// Required imports for browser functionality
import { 
  ChromiumEngine,
  TabManager, 
  NavigationHandler,
  SecurityManager,
  PerformanceOptimizer 
} from '@/packages/browser-core/engine';

import {
  BrowserComponent,
  TabContainer,
  AddressBarBase,
  SidebarLayout 
} from '@/packages/browser-core/ui';

import {
  StorageService,
  SyncService,
  ExtensionAPI,
  ApiClient 
} from '@/packages/browser-core/services';
```

### 2. AI Engine Foundation (packages/ai-engine/)
```typescript
// Required imports for AI functionality
import {
  AIModelRouter,
  OpenAIProvider,
  AnthropicProvider,
  GoogleProvider 
} from '@/packages/ai-engine/models';

import {
  ContextManager,
  ContentAnalyzer,
  InformationSynthesizer,
  CodeGenerator 
} from '@/packages/ai-engine/processing';

import {
  ConversationAgent,
  AutomationAgent,
  SuggestionAgent,
  LearningAgent 
} from '@/packages/ai-engine/agents';

import {
  PrivacyFilter,
  DataEncryption,
  UserConsent 
} from '@/packages/ai-engine/privacy';
```

### 3. UI Foundation (packages/ui-components/)
```typescript
// Required imports for UI components
import {
  SmartAddressBar,
  TabManagerUI,
  BrowserSidebar,
  StatusBarUI 
} from '@/packages/ui-components/components/browser';

import {
  ChatInterface,
  SuggestionCard,
  ContextViewer,
  CommandPalette 
} from '@/packages/ui-components/components/ai';

import {
  useAI,
  useBrowser,
  useStorage,
  usePreferences 
} from '@/packages/ui-components/hooks';
```

**NEVER assume these foundations exist - always reference them in your code and validate imports.**

## Technology Stack Requirements

### Frontend Stack (MANDATORY)
```typescript
// Core Technologies
Framework: React 18+ with Concurrent Features & TypeScript 5.3+
Build: Vite with custom Chromium integration
Styling: Tailwind CSS with custom design system tokens
State: Zustand for global state + React Query for server state
Testing: Vitest + React Testing Library + Playwright E2E

// AI Integration
AI SDK: Custom multi-model wrapper (OpenAI/Anthropic/Google APIs)
Real-time: WebSocket for streaming AI responses
Local AI: WebAssembly + WebLLM for on-device processing
Voice: Web Speech API with custom enhancements
Vectors: Browser-side vector search with WebAssembly
```

### Backend Stack (MANDATORY)
```typescript
// Infrastructure
Runtime: Node.js 20+ with TypeScript strict mode
API: tRPC for type-safe client-server communication
Database: PostgreSQL 15+ with Prisma ORM + Vector extensions
Cache: Redis 7+ for session/API caching + BullMQ queues
Auth: Custom JWT implementation with OAuth2 providers

// AI Services
Primary: GPT-4, Claude-3-Opus, Gemini-Pro with intelligent routing
Local: Ollama + WebLLM for privacy-sensitive processing
Storage: Pinecone for vector embeddings + semantic search
Multimodal: GPT-4V, Claude-3-Vision, Gemini-Pro-Vision
Voice: Whisper integration + Web Speech API
Training: Fine-tuning pipeline for user adaptation
```

### Infrastructure Stack (MANDATORY)
```typescript
// Deployment & Operations
Cloud: AWS multi-region with GCP fallback + CloudFlare CDN
Containers: Docker with multi-stage builds + Kubernetes orchestration
Monitoring: DataDog + Sentry + Custom performance tracking
Security: HashiCorp Vault + OWASP compliance + penetration testing
CI/CD: GitHub Actions with AI-assisted workflows + automated testing
```

## Code Generation Standards

### 1. TypeScript Patterns (STRICTLY ENFORCE)

```typescript
// Component Interface Pattern
export interface ComponentProps {
  readonly aiEnabled?: boolean;
  readonly contextSources?: readonly string[];
  readonly onAIResponse?: (response: AIResponse) => void;
  readonly onError?: (error: AIError) => void;
  readonly className?: string;
  readonly testId?: string; // For testing
}

// Service Class Pattern
export class AIService {
  constructor(
    private readonly dependencies: ServiceDependencies,
    private readonly logger: Logger,
    private readonly metrics: MetricsCollector
  ) {}
  
  public async processQuery(
    query: string, 
    context?: AIContext
  ): Promise<Result<AIResponse, AIError>> {
    // Implementation with comprehensive error handling
  }
}

// AI Request/Response Types
export interface AIRequest {
  readonly type: AIRequestType;
  readonly content: string;
  readonly context?: AIContext;
  readonly privacyLevel: PrivacyLevel;
  readonly modelPreference?: AIModel;
  readonly maxTokens?: number;
  readonly temperature?: number;
}

export interface AIResponse {
  readonly content: string;
  readonly modelUsed: AIModel;
  readonly tokensUsed: number;
  readonly responseTime: number;
  readonly sources?: readonly SourceReference[];
  readonly confidence: number;
  readonly cached: boolean;
}

// Error Types
export type AIError = 
  | { type: 'RATE_LIMIT'; retryAfter: number }
  | { type: 'MODEL_UNAVAILABLE'; fallbackSuggested: AIModel }
  | { type: 'PRIVACY_VIOLATION'; sensitiveDataDetected: string[] }
  | { type: 'CONTEXT_TOO_LARGE'; maxSize: number; currentSize: number }
  | { type: 'AUTHENTICATION_FAILED'; provider: string };
```

### 2. React Component Pattern (MANDATORY STRUCTURE)

```typescript
import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/packages/shared-utils/cn';
import { logger } from '@/packages/shared-utils/logger';
import { useAI, useBrowser, usePreferences } from '@/packages/ui-components/hooks';

interface SmartComponentProps {
  readonly aiEnabled?: boolean;
  readonly contextSources?: readonly string[];
  readonly onResult?: (result: AIResult) => void;
  readonly onError?: (error: AIError) => void;
  readonly className?: string;
  readonly testId?: string;
}

export const SmartComponent = memo<SmartComponentProps>(({
  aiEnabled = true,
  contextSources = [],
  onResult,
  onError,
  className,
  testId = 'smart-component'
}) => {
  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<AIError | null>(null);
  
  // Foundation hooks (REQUIRED)
  const { processQuery, streamResponse } = useAI();
  const { extractContext, getCurrentTab } = useBrowser();
  const { aiPreferences } = usePreferences();
  
  // Refs for performance and cleanup
  const abortControllerRef = useRef<AbortController>();
  const componentMountedRef = useRef(true);
  
  // Memoized computations
  const contextData = useMemo(() => 
    extractContext(contextSources), [contextSources, extractContext]
  );
  
  // Cleanup on unmount
  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);
  
  // Event handlers with comprehensive error handling
  const handleAIQuery = useCallback(async (query: string) => {
    if (!aiEnabled || !componentMountedRef.current) return;
    
    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const aiRequest: AIRequest = {
        type: 'general_query',
        content: query,
        context: {
          ...contextData,
          currentTab: getCurrentTab(),
          userPreferences: aiPreferences,
        },
        privacyLevel: determinePrivacyLevel(query, contextData),
        modelPreference: aiPreferences.preferredModel,
      };
      
      const result = await processQuery(aiRequest, {
        signal: abortControllerRef.current.signal,
      });
      
      if (componentMountedRef.current) {
        if (result.success) {
          onResult?.(result.data);
          logger.info('AI query successful', { 
            query, 
            model: result.data.modelUsed,
            responseTime: result.data.responseTime 
          });
        } else {
          const error = result.error;
          setError(error);
          onError?.(error);
          logger.error('AI query failed', { query, error });
        }
      }
    } catch (error) {
      if (componentMountedRef.current && error.name !== 'AbortError') {
        const aiError: AIError = { 
          type: 'UNKNOWN_ERROR', 
          message: error.message || 'Unknown error occurred' 
        };
        setError(aiError);
        onError?.(aiError);
        logger.error('Unexpected AI query error', { query, error });
      }
    } finally {
      if (componentMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, [
    aiEnabled, 
    contextData, 
    processQuery, 
    getCurrentTab, 
    aiPreferences,
    onResult, 
    onError
  ]);
  
  return (
    <div 
      className={cn("smart-component", className)}
      data-testid={testId}
      aria-busy={isProcessing}
      role="region"
      aria-label="AI-powered component"
    >
      {error && (
        <div 
          className="error-message text-red-600 p-2 bg-red-50 rounded"
          role="alert"
          aria-live="polite"
        >
          {error.message || 'An error occurred'}
        </div>
      )}
      
      {/* Component JSX with proper accessibility */}
      <button
        onClick={() => handleAIQuery('example query')}
        disabled={isProcessing}
        className={cn(
          "ai-action-button",
          "focus:ring-2 focus:ring-ai-accent-500 focus:outline-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isProcessing && "animate-pulse"
        )}
        aria-label={isProcessing ? 'Processing AI request...' : 'Send AI query'}
      >
        {isProcessing ? 'Processing...' : 'Ask AI'}
      </button>
    </div>
  );
});

SmartComponent.displayName = 'SmartComponent';
```

### 3. AI Integration Patterns (ENFORCE THESE PATTERNS)

```typescript
// AI Model Router with Comprehensive Fallback
class AIModelRouter {
  private readonly models = {
    'gpt-4': new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo',
      maxTokens: 4096,
      temperature: 0.1,
      timeout: 30000,
    }),
    'claude-3-opus': new AnthropicProvider({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-opus-20240229',
      maxTokens: 4096,
      timeout: 30000,
    }),
    'gemini-pro': new GoogleProvider({
      apiKey: process.env.GOOGLE_AI_API_KEY,
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 4096,
      },
      timeout: 30000,
    }),
    'local': new LocalAIProvider({
      model: 'phi-3-mini-4k-instruct',
      quantization: 'q4f16_1',
    }),
  } as const;

  private readonly fallbackChain: AIModel[] = ['gpt-4', 'claude-3-opus', 'gemini-pro'];
  private readonly performanceMetrics = new Map<AIModel, ModelMetrics>();

  async routeRequest(request: AIRequest): Promise<Result<AIResponse, AIError>> {
    const startTime = performance.now();
    
    try {
      // Model selection with performance and cost optimization
      const optimalModel = await this.selectOptimalModel(request);
      
      // Privacy check - use local model for sensitive data
      if (request.privacyLevel === 'high' || this.containsSensitiveData(request)) {
        return this.processWithLocalModel(request);
      }
      
      // Attempt primary model
      const result = await this.processWithModel(optimalModel, request);
      
      if (result.success) {
        // Update performance metrics
        this.updateMetrics(optimalModel, performance.now() - startTime, true);
        return result;
      }
      
      // Fallback logic
      return this.handleFallback(request, optimalModel, result.error);
      
    } catch (error) {
      logger.error('AI router error', { error, request: this.sanitizeRequest(request) });
      return {
        success: false,
        error: { 
          type: 'ROUTER_ERROR', 
          message: 'Failed to route AI request',
          originalError: error 
        }
      };
    }
  }

  private async selectOptimalModel(request: AIRequest): Promise<AIModel> {
    // Cost-performance optimization
    if (request.type === 'simple_query' || request.maxTokens < 1000) {
      return 'gemini-pro'; // Most cost-effective
    }
    
    // Task-specific routing
    switch (request.type) {
      case 'code_generation':
      case 'code_analysis':
        return 'gpt-4'; // Superior code understanding
        
      case 'analysis':
      case 'synthesis':
      case 'reasoning':
        return 'claude-3-opus'; // Best reasoning capabilities
        
      case 'multimodal':
        return request.hasImages ? 'gemini-pro' : 'gpt-4';
        
      case 'creative_writing':
        return 'claude-3-opus'; // Best creative abilities
        
      default:
        // Use performance metrics for selection
        return this.selectByPerformance();
    }
  }

  private async handleFallback(
    request: AIRequest,
    failedModel: AIModel,
    error: AIError
  ): Promise<Result<AIResponse, AIError>> {
    const fallbackModels = this.fallbackChain.filter(model => model !== failedModel);
    
    for (const model of fallbackModels) {
      try {
        const result = await this.processWithModel(model, request);
        if (result.success) {
          logger.info('Fallback successful', { 
            originalModel: failedModel, 
            fallbackModel: model,
            requestType: request.type 
          });
          return result;
        }
      } catch (fallbackError) {
        logger.warn('Fallback model failed', { 
          model, 
          error: fallbackError,
          originalError: error 
        });
      }
    }
    
    // All models failed
    return {
      success: false,
      error: {
        type: 'ALL_MODELS_FAILED',
        message: 'All AI models are currently unavailable',
        originalError: error,
        attemptedModels: [failedModel, ...fallbackModels],
      }
    };
  }

  private containsSensitiveData(request: AIRequest): boolean {
    const sensitivePatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit cards
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b(?:password|token|key|secret)\b/i, // Credentials
    ];
    
    return sensitivePatterns.some(pattern => 
      pattern.test(request.content) || 
      pattern.test(request.context?.toString() || '')
    );
  }
}

// Privacy-First Context Management
class ContextManager {
  private readonly vectorStore = new PineconeClient({
    environment: process.env.PINECONE_ENVIRONMENT!,
    apiKey: process.env.PINECONE_API_KEY!,
  });
  
  private readonly privacyFilter = new PrivacyFilter();
  private readonly embeddingCache = new Map<string, Float32Array>();

  async extractTabContext(tab: Tab): Promise<Result<TabContext, ContextError>> {
    try {
      // Extract content with privacy protection
      const rawContent = await this.extractRawContent(tab);
      const filteredContent = await this.privacyFilter.filterContent(rawContent, tab.url);
      
      if (!filteredContent.isProcessable) {
        return {
          success: false,
          error: {
            type: 'PRIVACY_RESTRICTED',
            message: 'Content contains sensitive information',
            url: tab.url,
          }
        };
      }
      
      // Generate embeddings for semantic search
      const embeddings = await this.generateEmbeddings(filteredContent.content);
      
      // Extract structured information
      const entities = await this.extractEntities(filteredContent.content);
      const sentiment = await this.analyzeSentiment(filteredContent.content);
      const topics = await this.extractTopics(filteredContent.content);
      
      // Store in vector database with TTL
      await this.vectorStore.upsert({
        vectors: [{
          id: `tab-${tab.id}-${Date.now()}`,
          values: embeddings,
          metadata: {
            tabId: tab.id,
            url: tab.url,
            title: tab.title,
            timestamp: Date.now(),
            contentType: this.detectContentType(tab.url),
            privacy_level: filteredContent.privacyLevel,
            ttl: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
          },
        }],
      });
      
      return {
        success: true,
        data: {
          tabId: tab.id,
          url: tab.url,
          title: tab.title,
          content: filteredContent.content,
          embeddings,
          entities,
          sentiment,
          topics,
          extractedAt: new Date(),
          privacyLevel: filteredContent.privacyLevel,
        }
      };
      
    } catch (error) {
      logger.error('Context extraction failed', { 
        tabId: tab.id, 
        url: tab.url, 
        error 
      });
      
      return {
        success: false,
        error: {
          type: 'EXTRACTION_FAILED',
          message: 'Failed to extract tab context',
          tabId: tab.id,
          originalError: error,
        }
      };
    }
  }

  private async generateEmbeddings(content: string): Promise<Float32Array> {
    const cacheKey = this.hashContent(content);
    
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }
    
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content.slice(0, 8191), // Respect token limits
        encoding_format: 'float',
      });
      
      const embeddings = new Float32Array(response.data[0].embedding);
      
      // Cache with size limit
      if (this.embeddingCache.size < 1000) {
        this.embeddingCache.set(cacheKey, embeddings);
      }
      
      return embeddings;
      
    } catch (error) {
      logger.error('Embedding generation failed', { error, contentLength: content.length });
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }
}
```

### 4. Error Handling Patterns (MANDATORY)

```typescript
// Result Pattern for Comprehensive Error Handling
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Async Function Error Handling Template
export async function processAIRequest(
  request: AIRequest
): Promise<Result<AIResponse, AIError>> {
  const startTime = performance.now();
  
  try {
    // Input validation
    const validationResult = validateAIRequest(request);
    if (!validationResult.valid) {
      return {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid request format',
          details: validationResult.errors,
        }
      };
    }
    
    // Rate limiting check
    const rateLimitResult = await checkRateLimit(request.userId);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: {
          type: 'RATE_LIMIT',
          message: 'Request rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
        }
      };
    }
    
    // Cost check
    const estimatedCost = estimateRequestCost(request);
    const costResult = await checkUserCostLimit(request.userId, estimatedCost);
    if (!costResult.allowed) {
      return {
        success: false,
        error: {
          type: 'COST_LIMIT_EXCEEDED',
          message: 'Monthly cost limit would be exceeded',
          currentUsage: costResult.currentUsage,
          limit: costResult.limit,
        }
      };
    }
    
    // Process the request
    const aiRouter = new AIModelRouter();
    const response = await aiRouter.routeRequest(request);
    
    if (response.success) {
      // Log successful request
      await logUsageEvent({
        userId: request.userId,
        eventType: 'ai_query_success',
        modelUsed: response.data.modelUsed,
        tokensUsed: response.data.tokensUsed,
        cost: calculateActualCost(response.data.modelUsed, response.data.tokensUsed),
        duration: performance.now() - startTime,
      });
      
      return response;
    } else {
      // Log failed request
      await logUsageEvent({
        userId: request.userId,
        eventType: 'ai_query_failure',
        error: response.error,
        duration: performance.now() - startTime,
      });
      
      return response;
    }
    
  } catch (error) {
    // Handle unexpected errors
    logger.error('Unexpected AI request error', { 
      error, 
      request: sanitizeRequestForLogging(request),
      duration: performance.now() - startTime,
    });
    
    return {
      success: false,
      error: {
        type: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred',
        originalError: error instanceof Error ? error.message : String(error),
      }
    };
  }
}

// React Error Boundary for AI Components
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
    logger.error('AI component error boundary triggered', { 
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
    });
    
    // Report to error tracking service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: 'AIErrorBoundary',
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultAIErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
const DefaultAIErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="ai-error-fallback p-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-center space-x-2 mb-2">
      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <h3 className="text-red-800 font-medium">AI Feature Unavailable</h3>
    </div>
    <p className="text-red-700 text-sm mb-3">
      The AI feature encountered an error and couldn't complete your request. Please try again or contact support if the problem persists.
    </p>
    <details className="text-xs text-red-600">
      <summary className="cursor-pointer">Technical Details</summary>
      <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
        {error.message}
      </pre>
    </details>
  </div>
);
```

## Performance Requirements

### 1. Browser Performance Optimization

```typescript
// Virtual Scrolling for Large Lists
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualTabList: React.FC<{ tabs: Tab[] }> = ({ tabs }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: tabs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
    measureElement: (element) => element?.getBoundingClientRect().height ?? 40,
  });

  return (
    <div 
      ref={parentRef} 
      className="h-96 overflow-auto"
      role="listbox"
      aria-label="Browser tabs"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <TabItem
            key={virtualItem.key}
            tab={tabs[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Debounced AI Query Hook
const useAIQuery = (query: string, context: AIContext, delay = 500) => {
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [debouncedContext, setDebouncedContext] = useState<AIContext>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setDebouncedContext(context);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [query, context, delay]);

  return useQuery({
    queryKey: ['ai-query', debouncedQuery, debouncedContext],
    queryFn: async () => {
      const aiRouter = new AIModelRouter();
      return aiRouter.routeRequest({
        type: 'general_query',
        content: debouncedQuery,
        context: debouncedContext,
        privacyLevel: determinePrivacyLevel(debouncedQuery, debouncedContext),
      });
    },
    enabled: Boolean(debouncedQuery?.trim()),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error?.type === 'RATE_LIMIT') return failureCount < 3;
      return false;
    },
    retryDelay: (attemptIndex, error) => {
      if (error?.type === 'RATE_LIMIT' && error.retryAfter) {
        return error.retryAfter * 1000;
      }
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
  });
};

// Memoization for Expensive Operations
const useOptimizedAIContext = (sources: string[]) => {
  return useMemo(() => {
    // Expensive context extraction
    return extractAndProcessContext(sources);
  }, [sources]);
};

const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

// Code Splitting and Lazy Loading
const AIComponents = {
  ConversationPanel: lazy(() => import('@/packages/ui-components/components/ai/ChatInterface')),
  CustomCommands: lazy(() => import('@/packages/browser-core/ui/components/CustomCommands')),
  AdvancedSettings: lazy(() => import('@/packages/ui-components/components/AdvancedSettings')),
  TabAnalytics: lazy(() => import('@/packages/browser-core/ui/components/TabAnalytics')),
};

// Preload critical components
const preloadAIComponents = () => {
  Promise.all([
    import('@/packages/ui-components/components/ai/ChatInterface'),
    import('@/packages/browser-core/ui/components/CustomCommands'),
  ]);
};
```

### 2. AI Response Optimization

```typescript
// Streaming Response Handler
const useStreamingAIResponse = () => {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<AIError | null>(null);

  const streamResponse = useCallback(async (
    request: AIRequest,
    onChunk?: (chunk: string) => void
  ) => {
    setIsStreaming(true);
    setResponse('');
    setError(null);

    try {
      const stream = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!stream.ok) {
        throw new Error(`HTTP ${stream.status}: ${stream.statusText}`);
      }

      const reader = stream.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedResponse += parsed.content;
                setResponse(accumulatedResponse);
                onChunk?.(parsed.content);
              }
            } catch (e) {
              console.warn('Failed to parse stream chunk:', e);
            }
          }
        }
      }
    } catch (err) {
      const aiError: AIError = {
        type: 'STREAM_ERROR',
        message: err instanceof Error ? err.message : 'Streaming failed',
      };
      setError(aiError);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { response, isStreaming, error, streamResponse };
};

// Response Caching Strategy
class AIResponseCache {
  private cache = new Map<string, CachedResponse>();
  private readonly maxSize = 1000;
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  generateKey(request: AIRequest): string {
    return `${request.type}-${this.hashContent(request.content)}-${this.hashContext(request.context)}`;
  }

  get(request: AIRequest): CachedResponse | null {
    const key = this.generateKey(request);
    const cached = this.cache.get(key);
    
    if (!cached || cached.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }

  set(request: AIRequest, response: AIResponse, ttl?: number): void {
    const key = this.generateKey(request);
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      response,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      accessCount: 0,
    });
  }

  private hashContent(content: string): string {
    // Simple hash function for content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private hashContext(context?: AIContext): string {
    if (!context) return '';
    return this.hashContent(JSON.stringify(context));
  }
}
```

## Security & Privacy Implementation

### 1. Input Sanitization & Validation

```typescript
// Comprehensive Input Validation
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Schema Validation
const AIRequestSchema = z.object({
  type: z.enum(['general_query', 'code_generation', 'analysis', 'synthesis', 'multimodal']),
  content: z.string().min(1).max(10000),
  context: z.object({
    tabId: z.string().optional(),
    url: z.string().url().optional(),
    selectedText: z.string().max(5000).optional(),
  }).optional(),
  privacyLevel: z.enum(['low', 'medium', 'high']),
  modelPreference: z.enum(['gpt-4', 'claude-3-opus', 'gemini-pro', 'local']).optional(),
});

// Input Sanitization Functions
export const sanitizeUserInput = (input: string): string => {
  // Remove potential XSS vectors
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Additional sanitization for AI context
  return sanitized
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: URLs
    .trim();
};

export const validateAIRequest = (request: unknown): ValidationResult => {
  try {
    const validated = AIRequestSchema.parse(request);
    
    // Additional business logic validation
    if (validated.content.length < 3) {
      return {
        valid: false,
        errors: ['Query too short - minimum 3 characters required'],
      };
    }
    
    // Check for potential prompt injection
    const injectionPatterns = [
      /ignore\s+previous\s+instructions/i,
      /you\s+are\s+now\s+a/i,
      /forget\s+everything/i,
      /system\s*:\s*you\s+are/i,
    ];
    
    if (injectionPatterns.some(pattern => pattern.test(validated.content))) {
      return {
        valid: false,
        errors: ['Potential prompt injection detected'],
      };
    }
    
    return { valid: true, data: validated };
  } catch (error) {
    return {
      valid: false,
      errors: error.errors?.map((e: any) => e.message) || ['Invalid request format'],
    };
  }
};

// Rate Limiting Implementation
class RateLimiter {
  private limits = new Map<string, UserLimits>();
  private readonly defaultLimits = {
    requests: 100, // requests per hour
    tokens: 100000, // tokens per hour
    cost: 10.00, // dollars per hour
  };

  async checkLimit(userId: string, request: AIRequest): Promise<RateLimitResult> {
    const userLimits = this.getUserLimits(userId);
    const now = Date.now();
    const hourStart = now - (now % (60 * 60 * 1000));
    
    // Clean old entries
    userLimits.requests = userLimits.requests.filter(time => time > hourStart);
    userLimits.tokenUsage = userLimits.tokenUsage.filter(usage => usage.timestamp > hourStart);
    
    // Check request limit
    if (userLimits.requests.length >= this.defaultLimits.requests) {
      return {
        allowed: false,
        type: 'REQUEST_LIMIT',
        retryAfter: (60 * 60 * 1000) - (now - hourStart),
        remaining: 0,
      };
    }
    
    // Estimate token usage
    const estimatedTokens = this.estimateTokens(request);
    const currentTokens = userLimits.tokenUsage.reduce((sum, usage) => sum + usage.tokens, 0);
    
    if (currentTokens + estimatedTokens > this.defaultLimits.tokens) {
      return {
        allowed: false,
        type: 'TOKEN_LIMIT',
        retryAfter: (60 * 60 * 1000) - (now - hourStart),
        remaining: this.defaultLimits.tokens - currentTokens,
      };
    }
    
    return {
      allowed: true,
      remaining: this.defaultLimits.requests - userLimits.requests.length,
    };
  }

  recordUsage(userId: string, tokens: number): void {
    const userLimits = this.getUserLimits(userId);
    const now = Date.now();
    
    userLimits.requests.push(now);
    userLimits.tokenUsage.push({ timestamp: now, tokens });
  }

  private getUserLimits(userId: string): UserLimits {
    if (!this.limits.has(userId)) {
      this.limits.set(userId, {
        requests: [],
        tokenUsage: [],
      });
    }
    return this.limits.get(userId)!;
  }

  private estimateTokens(request: AIRequest): number {
    // Rough estimation: 1 token ≈ 4 characters
    const contentTokens = Math.ceil(request.content.length / 4);
    const contextTokens = request.context ? Math.ceil(JSON.stringify(request.context).length / 4) : 0;
    return contentTokens + contextTokens;
  }
}
```

### 2. Privacy Protection Layer

```typescript
// Advanced Privacy Filter
class PrivacyFilter {
  private readonly sensitivePatterns = new Map<string, RegExp>([
    ['credit_card', /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g],
    ['ssn', /\b\d{3}-\d{2}-\d{4}\b/g],
    ['email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g],
    ['phone', /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g],
    ['ip_address', /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g],
    ['credentials', /(?:password|token|key|secret|api[_-]?key)\s*[:=]\s*\S+/gi],
  ]);

  private readonly sensitiveDomains = [
    'bank', 'banking', 'financial', 'finance',
    'healthcare', 'medical', 'health', 'hospital',
    'legal', 'law', 'attorney', 'court',
    'government', 'gov', 'military', 'irs',
    'personal', 'private', 'confidential',
  ];

  async filterContent(content: string, url?: string): Promise<FilterResult> {
    // Check domain sensitivity
    if (url && this.isSensitiveDomain(url)) {
      return {
        isProcessable: false,
        content: '[Content filtered - sensitive domain detected]',
        privacyLevel: 'high',
        sensitiveDataDetected: ['sensitive_domain'],
      };
    }

    let filteredContent = content;
    const detectedPatterns: string[] = [];

    // Apply pattern-based filtering
    for (const [patternName, regex] of this.sensitivePatterns) {
      if (regex.test(content)) {
        detectedPatterns.push(patternName);
        filteredContent = filteredContent.replace(regex, `[REDACTED_${patternName.toUpperCase()}]`);
      }
    }

    // Use ML-based PII detection for advanced cases
    const mlDetection = await this.detectPIIWithML(filteredContent);
    if (mlDetection.hasPII) {
      detectedPatterns.push(...mlDetection.types);
      filteredContent = mlDetection.filteredContent;
    }

    const privacyLevel = this.determinePrivacyLevel(detectedPatterns);
    
    return {
      isProcessable: privacyLevel !== 'high',
      content: filteredContent,
      privacyLevel,
      sensitiveDataDetected: detectedPatterns,
    };
  }

  private isSensitiveDomain(url: string): boolean {
    const domain = new URL(url).hostname.toLowerCase();
    return this.sensitiveDomains.some(sensitive => domain.includes(sensitive));
  }

  private async detectPIIWithML(content: string): Promise<MLDetectionResult> {
    // Use a local ML model for PII detection
    try {
      const detector = await this.getLocalPIIDetector();
      return await detector.analyze(content);
    } catch (error) {
      console.warn('ML PII detection failed, falling back to pattern matching:', error);
      return {
        hasPII: false,
        types: [],
        filteredContent: content,
      };
    }
  }

  private determinePrivacyLevel(detectedPatterns: string[]): PrivacyLevel {
    if (detectedPatterns.includes('credit_card') || 
        detectedPatterns.includes('ssn') || 
        detectedPatterns.includes('credentials')) {
      return 'high';
    }
    
    if (detectedPatterns.includes('email') || 
        detectedPatterns.includes('phone')) {
      return 'medium';
    }
    
    return 'low';
  }

  private async getLocalPIIDetector() {
    // Initialize local PII detection model
    // This would use WebAssembly or a lightweight model
    return {
      analyze: async (content: string): Promise<MLDetectionResult> => {
        // Placeholder for actual ML implementation
        return {
          hasPII: false,
          types: [],
          filteredContent: content,
        };
      }
    };
  }
}

// Encryption for Sensitive Data
class DataEncryption {
  private readonly algorithm = 'AES-GCM';
  private readonly keyLength = 256;

  async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptData(data: string, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv,
      },
      key,
      dataBuffer
    );

    return {
      data: new Uint8Array(encrypted),
      iv: iv,
      algorithm: this.algorithm,
    };
  }

  async decryptData(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: encryptedData.iv,
      },
      key,
      encryptedData.data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}
```

## Testing Standards & Automation

### 1. Comprehensive Testing Patterns

```typescript
// AI Component Testing Template
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SmartComponent } from './SmartComponent';

// Mock AI services
const mockAIService = {
  processQuery: vi.fn(),
  streamResponse: vi.fn(),
};

const mockBrowserService = {
  extractContext: vi.fn(),
  getCurrentTab: vi.fn(),
};

// Test wrapper with providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AIProvider value={mockAIService}>
        <BrowserProvider value={mockBrowserService}>
          {children}
        </BrowserProvider>
      </AIProvider>
    </QueryClientProvider>
  );
};

describe('SmartComponent', () => {
  let mockOnResult: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnResult = vi.fn();
    mockOnError = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render with proper accessibility attributes', () => {
    render(
      <SmartComponent
        onResult={mockOnResult}
        onError={mockOnError}
      />,
      { wrapper: TestWrapper }
    );

    const component = screen.getByTestId('smart-component');
    expect(component).toHaveAttribute('role', 'region');
    expect(component).toHaveAttribute('aria-label', 'AI-powered component');
  });

  it('should handle AI queries successfully', async () => {
    const mockResponse: AIResponse = {
      content: 'Test AI response',
      modelUsed: 'gpt-4',
      tokensUsed: 100,
      responseTime: 1500,
      confidence: 0.95,
      cached: false,
    };

    mockAIService.processQuery.mockResolvedValue({
      success: true,
      data: mockResponse,
    });

    render(
      <SmartComponent
        onResult={mockOnResult}
        onError={mockOnError}
      />,
      { wrapper: TestWrapper }
    );

    const button = screen.getByRole('button', { name: /ask ai/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockAIService.processQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'general_query',
          content: 'example query',
        }),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(mockResponse);
    });
  });

  it('should handle AI errors gracefully', async () => {
    const mockError: AIError = {
      type: 'RATE_LIMIT',
      message: 'Rate limit exceeded',
      retryAfter: 60000,
    };

    mockAIService.processQuery.mockResolvedValue({
      success: false,
      error: mockError,
    });

    render(
      <SmartComponent
        onResult={mockOnResult}
        onError={mockOnError}
      />,
      { wrapper: TestWrapper }
    );

    const button = screen.getByRole('button', { name: /ask ai/i });
    
    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(mockError);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Rate limit exceeded');
  });

  it('should be keyboard accessible', async () => {
    render(
      <SmartComponent
        onResult={mockOnResult}
        onError={mockOnError}
      />,
      { wrapper: TestWrapper }
    );

    const button = screen.getByRole('button');
    
    button.focus();
    expect(button).toHaveFocus();

    fireEvent.keyDown(button, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockAIService.processQuery).toHaveBeenCalled();
    });
  });

  it('should handle component unmounting gracefully', async () => {
    const { unmount } = render(
      <SmartComponent
        onResult={mockOnResult}
        onError={mockOnError}
      />,
      { wrapper: TestWrapper }
    );

    // Start a slow AI request
    mockAIService.processQuery.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 5000))
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Unmount before request completes
    unmount();

    // Should not cause memory leaks or errors
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  it('should respect privacy settings', async () => {
    const sensitiveQuery = 'My credit card number is 4532-1234-5678-9012';
    
    render(
      <SmartComponent
        onResult={mockOnResult}
        onError={mockOnError}
      />,
      { wrapper: TestWrapper }
    );

    // Component should detect sensitive data and handle appropriately
    // This would depend on your specific implementation
  });
});

// Integration Tests for AI Router
describe('AIModelRouter Integration', () => {
  let router: AIModelRouter;

  beforeEach(() => {
    router = new AIModelRouter();
  });

  it('should route code generation to GPT-4', async () => {
    const request: AIRequest = {
      type: 'code_generation',
      content: 'Write a React component for a todo list',
      privacyLevel: 'low',
    };

    const spy = vi.spyOn(router['models']['gpt-4'], 'process');
    await router.routeRequest(request);
    
    expect(spy).toHaveBeenCalled();
  });

  it('should fallback to secondary model on failure', async () => {
    const request: AIRequest = {
      type: 'analysis',
      content: 'Analyze this data',
      privacyLevel: 'low',
    };

    // Mock primary model failure
    vi.spyOn(router['models']['claude-3-opus'], 'process')
      .mockRejectedValue(new Error('Model unavailable'));
    
    const fallbackSpy = vi.spyOn(router['models']['gpt-4'], 'process')
      .mockResolvedValue({
        content: 'Fallback response',
        modelUsed: 'gpt-4',
        tokensUsed: 50,
        responseTime: 1000,
        confidence: 0.9,
        cached: false,
      });

    const result = await router.routeRequest(request);
    
    expect(result.success).toBe(true);
    expect(fallbackSpy).toHaveBeenCalled();
  });
});

// E2E Testing with Playwright
// tests/e2e/ai-features.spec.ts
import { test, expect } from '@playwright/test';

test.describe('AI Features E2E', () => {
  test('should provide intelligent responses to user queries', async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="browser-ready"]');
    
    // Switch to AI mode
    await page.click('[data-testid="ai-mode-toggle"]');
    await expect(page.locator('[data-testid="ai-mode-indicator"]')).toBeVisible();
    
    // Enter AI query
    await page.fill('[data-testid="address-bar"]', 'Summarize the current page');
    await page.press('[data-testid="address-bar"]', 'Enter');
    
    // Wait for AI response
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
    
    const response = await page.locator('[data-testid="ai-response"]').textContent();
    expect(response).toContain('summary');
    
    // Check for source citations
    await expect(page.locator('[data-testid="source-citations"]')).toBeVisible();
  });

  test('should handle voice input correctly', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    
    await page.goto('/');
    
    // Click voice input button
    await page.click('[data-testid="voice-input-button"]');
    
    // Simulate voice input (this would require actual browser automation)
    await page.evaluate(() => {
      // Mock speech recognition
      const event = new CustomEvent('speechresult', {
        detail: { transcript: 'What is AI?' }
      });
      window.dispatchEvent(event);
    });
    
    // Verify AI processes voice query
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 10000 });
  });

  test('should respect privacy settings', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to privacy settings
    await page.click('[data-testid="settings-button"]');
    await page.click('[data-testid="privacy-settings"]');
    
    // Enable high privacy mode
    await page.check('[data-testid="high-privacy-mode"]');
    await page.click('[data-testid="save-settings"]');
    
    // Verify local processing indicator appears for sensitive queries
    await page.fill('[data-testid="address-bar"]', 'My personal information');
    await page.press('[data-testid="address-bar"]', 'Enter');
    
    await expect(page.locator('[data-testid="local-processing-indicator"]')).toBeVisible();
  });
});
```

## Documentation Standards

### 1. Code Documentation Requirements

```typescript
/**
 * AI-powered smart component that provides intelligent responses to user queries
 * while respecting privacy settings and providing comprehensive error handling.
 * 
 * @example Basic Usage
 * ```tsx
 * <SmartComponent
 *   aiEnabled={true}
 *   contextSources={['current-tab', 'related-tabs']}
 *   onResult={(result) => console.log('AI response:', result)}
 *   onError={(error) => console.error('AI error:', error)}
 * />
 * ```
 * 
 * @example With Custom Context
 * ```tsx
 * <SmartComponent
 *   aiEnabled={true}
 *   contextSources={['tab-123', 'tab-456']}
 *   onResult={(result) => {
 *     // Handle successful AI response
 *     updateUI(result);
 *   }}
 *   onError={(error) => {
 *     // Handle AI errors gracefully
 *     showErrorMessage(error.message);
 *   }}
 * />
 * ```
 * 
 * @param aiEnabled - Whether AI functionality is enabled
 * @param contextSources - Array of context source identifiers for AI processing
 * @param onResult - Callback fired when AI successfully processes a request
 * @param onError - Callback fired when AI encounters an error
 * @param className - Additional CSS classes for styling
 * @param testId - Test identifier for automated testing
 * 
 * @throws {AIError} When AI processing fails
 * @throws {ValidationError} When input validation fails
 * @throws {RateLimitError} When rate limits are exceeded
 * 
 * @since 1.0.0
 * @version 1.2.0
 * @author Project Aura Team
 * 
 * @accessibility
 * - Implements WCAG 2.1 AA compliance
 * - Supports keyboard navigation
 * - Includes proper ARIA attributes
 * - Provides screen reader compatibility
 * 
 * @performance
 * - Uses React.memo for render optimization
 * - Implements request debouncing
 * - Includes proper cleanup on unmount
 * - Optimizes AI model selection based on query type
 * 
 * @security
 * - Validates all user inputs
 * - Filters sensitive data before AI processing
 * - Implements rate limiting protection
 * - Uses secure error handling practices
 */
export interface SmartComponentProps {
  readonly aiEnabled?: boolean;
  readonly contextSources?: readonly string[];
  readonly onResult?: (result: AIResult) => void;
  readonly onError?: (error: AIError) => void;
  readonly className?: string;
  readonly testId?: string;
}
```

## Quality Assurance Checklist

### Pre-Commit Verification (MANDATORY)

Before committing any AI-related code, verify ALL of the following:

- [ ] **Foundation Dependencies**: All required packages properly imported and referenced
- [ ] **TypeScript Compliance**: Strict mode enabled, no `any` types, comprehensive interfaces
- [ ] **Error Handling**: Result pattern implemented, comprehensive error boundaries
- [ ] **Privacy Protection**: Sensitive data filtering, user consent mechanisms
- [ ] **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, ARIA attributes
- [ ] **Performance**: Memoization, virtualization for large lists, request debouncing
- [ ] **Testing**: >90% code coverage, unit tests, integration tests, E2E scenarios
- [ ] **Security**: Input validation, XSS protection, secure API communications
- [ ] **Documentation**: Comprehensive JSDoc, usage examples, architectural decisions
- [ ] **Design System**: Tailwind utility classes, consistent styling patterns
- [ ] **AI Integration**: Model routing logic, fallback mechanisms, cost optimization

### Code Review AI Agent Checklist

When reviewing AI-generated code, ensure:

- [ ] **Architectural Consistency**: Follows established patterns and conventions
- [ ] **Resource Cleanup**: Proper cleanup of subscriptions, timers, and event listeners
- [ ] **Edge Case Handling**: Comprehensive error scenarios and boundary conditions
- [ ] **Performance Impact**: No unnecessary re-renders, efficient algorithms
- [ ] **User Experience**: Loading states, error messages, accessibility features
- [ ] **Monitoring Integration**: Proper logging, metrics collection, error tracking

## Success Metrics & KPIs

# Success Metrics & KPIs

## AI Performance Metrics

### Response Quality & Accuracy
```typescript
interface AIQualityMetrics {
  readonly responseAccuracy: number; // 0-1 scale
  readonly userSatisfactionScore: number; // 1-5 scale
  readonly contextRelevanceScore: number; // 0-1 scale
  readonly sourceAttributionAccuracy: number; // 0-1 scale
  readonly hallucationRate: number; // % of responses with factual errors
  readonly responseCompleteness: number; // 0-1 scale
}

// Target KPIs
const AI_QUALITY_TARGETS = {
  responseAccuracy: 0.95, // 95% accuracy rate
  userSatisfactionScore: 4.2, // Average 4.2/5 user rating
  contextRelevanceScore: 0.90, // 90% context relevance
  sourceAttributionAccuracy: 0.98, // 98% accurate citations
  hallucationRate: 0.02, // <2% hallucination rate
  responseCompleteness: 0.88, // 88% complete responses
} as const;
```

### Response Time & Performance
```typescript
interface AIPerformanceMetrics {
  readonly averageResponseTime: number; // milliseconds
  readonly p95ResponseTime: number; // 95th percentile response time
  readonly p99ResponseTime: number; // 99th percentile response time
  readonly modelAvailability: number; // % uptime
  readonly fallbackActivationRate: number; // % of requests using fallback
  readonly cacheHitRate: number; // % of cached responses
  readonly tokenEfficiency: number; // tokens per useful response
  readonly costPerQuery: number; // USD per AI query
}

// Target KPIs
const AI_PERFORMANCE_TARGETS = {
  averageResponseTime: 1500, // 1.5 seconds average
  p95ResponseTime: 3000, // 3 seconds for 95% of requests
  p99ResponseTime: 5000, // 5 seconds for 99% of requests
  modelAvailability: 0.999, // 99.9% uptime
  fallbackActivationRate: 0.05, // <5% fallback usage
  cacheHitRate: 0.35, // 35% cache hit rate
  tokenEfficiency: 0.85, // 85% useful tokens
  costPerQuery: 0.005, // $0.005 per query
} as const;
```

## Browser Performance Metrics

### Core Browser Functionality
```typescript
interface BrowserPerformanceMetrics {
  readonly pageLoadTime: number; // milliseconds
  readonly tabSwitchTime: number; // milliseconds
  readonly memoryUsage: number; // MB
  readonly cpuUsage: number; // % utilization
  readonly startupTime: number; // milliseconds
  readonly renderingFrameRate: number; // FPS
  readonly jsHeapSize: number; // MB
  readonly domContentLoadedTime: number; // milliseconds
}

// Target KPIs
const BROWSER_PERFORMANCE_TARGETS = {
  pageLoadTime: 2000, // 2 seconds max
  tabSwitchTime: 100, // 100ms max
  memoryUsage: 512, // 512MB max per tab
  cpuUsage: 15, // <15% CPU usage
  startupTime: 1500, // 1.5 seconds max
  renderingFrameRate: 60, // 60 FPS
  jsHeapSize: 256, // 256MB max
  domContentLoadedTime: 1000, // 1 second max
} as const;
```

### AI Integration Performance
```typescript
interface AIIntegrationMetrics {
  readonly aiQueryProcessingTime: number; // milliseconds
  readonly contextExtractionTime: number; // milliseconds
  readonly vectorSearchTime: number; // milliseconds
  readonly localModelInferenceTime: number; // milliseconds
  readonly privacyFilteringTime: number; // milliseconds
  readonly streamingLatency: number; // milliseconds
  readonly embeddingGenerationTime: number; // milliseconds
}

// Target KPIs
const AI_INTEGRATION_TARGETS = {
  aiQueryProcessingTime: 500, // 500ms max
  contextExtractionTime: 200, // 200ms max
  vectorSearchTime: 100, // 100ms max
  localModelInferenceTime: 2000, // 2 seconds max
  privacyFilteringTime: 50, // 50ms max
  streamingLatency: 150, // 150ms max
  embeddingGenerationTime: 300, // 300ms max
} as const;
```

## User Experience Metrics

### User Engagement & Adoption
```typescript
interface UserEngagementMetrics {
  readonly dailyActiveUsers: number; // count
  readonly monthlyActiveUsers: number; // count
  readonly aiFeatureUsageRate: number; // % of users using AI
  readonly sessionDuration: number; // minutes
  readonly queriesPerSession: number; // count
  readonly userRetentionRate: number; // % after 30 days
  readonly featureDiscoveryRate: number; // % discovering new features
  readonly powerUserPercentage: number; // % using advanced features
}

// Target KPIs
const USER_ENGAGEMENT_TARGETS = {
  dailyActiveUsers: 10000, // 10K daily users
  monthlyActiveUsers: 50000, // 50K monthly users
  aiFeatureUsageRate: 0.75, // 75% AI adoption
  sessionDuration: 45, // 45 minutes average
  queriesPerSession: 8, // 8 AI queries per session
  userRetentionRate: 0.65, // 65% 30-day retention
  featureDiscoveryRate: 0.80, // 80% feature discovery
  powerUserPercentage: 0.25, // 25% power users
} as const;
```

### User Satisfaction & Trust
```typescript
interface UserSatisfactionMetrics {
  readonly npsScore: number; // Net Promoter Score (-100 to 100)
  readonly aiTrustScore: number; // 1-5 scale
  readonly privacyConfidenceScore: number; // 1-5 scale
  readonly supportTicketRate: number; // tickets per 1000 users
  readonly bugReportRate: number; // bugs per 1000 sessions
  readonly featureRequestRate: number; // requests per month
  readonly userOnboardingCompletionRate: number; // % completing onboarding
}

// Target KPIs
const USER_SATISFACTION_TARGETS = {
  npsScore: 50, // NPS of 50+
  aiTrustScore: 4.3, // 4.3/5 AI trust rating
  privacyConfidenceScore: 4.5, // 4.5/5 privacy confidence
  supportTicketRate: 5, // <5 tickets per 1000 users
  bugReportRate: 2, // <2 bugs per 1000 sessions
  featureRequestRate: 100, // 100 requests per month
  userOnboardingCompletionRate: 0.85, // 85% onboarding completion
} as const;
```

## Business & Revenue Metrics

### Subscription & Revenue
```typescript
interface RevenueMetrics {
  readonly monthlyRecurringRevenue: number; // USD
  readonly customerAcquisitionCost: number; // USD
  readonly customerLifetimeValue: number; // USD
  readonly churnRate: number; // % monthly churn
  readonly conversionRate: number; // % trial to paid
  readonly averageRevenuePerUser: number; // USD monthly
  readonly premiumFeatureAdoptionRate: number; // % using premium AI
  readonly revenueGrowthRate: number; // % monthly growth
}

// Target KPIs
const REVENUE_TARGETS = {
  monthlyRecurringRevenue: 100000, // $100K MRR
  customerAcquisitionCost: 50, // $50 CAC
  customerLifetimeValue: 600, // $600 LTV
  churnRate: 0.05, // 5% monthly churn
  conversionRate: 0.15, // 15% trial conversion
  averageRevenuePerUser: 15, // $15 ARPU
  premiumFeatureAdoptionRate: 0.40, // 40% premium adoption
  revenueGrowthRate: 0.20, // 20% monthly growth
} as const;
```

### Cost & Efficiency
```typescript
interface CostEfficiencyMetrics {
  readonly aiInfrastructureCost: number; // USD per month
  readonly costPerUser: number; // USD per user per month
  readonly serverInfrastructureCost: number; // USD per month
  readonly supportCostPerUser: number; // USD per user per month
  readonly developmentVelocity: number; // story points per sprint
  readonly bugFixTime: number; // hours average
  readonly featureDeliveryTime: number; // days from concept to release
}

// Target KPIs
const COST_EFFICIENCY_TARGETS = {
  aiInfrastructureCost: 25000, // $25K monthly AI costs
  costPerUser: 3, // $3 cost per user
  serverInfrastructureCost: 15000, // $15K monthly server costs
  supportCostPerUser: 0.50, // $0.50 support cost per user
  developmentVelocity: 40, // 40 story points per sprint
  bugFixTime: 4, // 4 hours average bug fix
  featureDeliveryTime: 14, // 14 days feature delivery
} as const;
```

## Security & Privacy Metrics

### Security Performance
```typescript
interface SecurityMetrics {
  readonly securityIncidentCount: number; // count per month
  readonly vulnerabilityDetectionTime: number; // hours
  readonly vulnerabilityResolutionTime: number; // hours
  readonly unauthorizedAccessAttempts: number; // count per month
  readonly dataBreachCount: number; // count per year
  readonly penetrationTestScore: number; // 1-10 scale
  readonly complianceScore: number; // % GDPR/CCPA compliance
}

// Target KPIs
const SECURITY_TARGETS = {
  securityIncidentCount: 0, // Zero security incidents
  vulnerabilityDetectionTime: 2, // 2 hours detection
  vulnerabilityResolutionTime: 24, // 24 hours resolution
  unauthorizedAccessAttempts: 100, // <100 attempts per month
  dataBreachCount: 0, // Zero data breaches
  penetrationTestScore: 9, // 9/10 pen test score
  complianceScore: 1.0, // 100% compliance
} as const;
```

### Privacy Protection
```typescript
interface PrivacyMetrics {
  readonly dataMinimizationScore: number; // 0-1 scale
  readonly userConsentRate: number; // % users providing consent
  readonly dataRetentionCompliance: number; // % compliant with policies
  readonly privacyPolicyReadRate: number; // % users reading policy
  readonly dataPortabilityRequestTime: number; // hours to fulfill
  readonly rightToBeErasedCompliance: number; // % requests fulfilled timely
  readonly localProcessingRate: number; // % queries processed locally
}

// Target KPIs
const PRIVACY_TARGETS = {
  dataMinimizationScore: 0.95, // 95% data minimization
  userConsentRate: 0.90, // 90% user consent
  dataRetentionCompliance: 1.0, // 100% retention compliance
  privacyPolicyReadRate: 0.60, // 60% policy read rate
  dataPortabilityRequestTime: 48, // 48 hours fulfillment
  rightToBeErasedCompliance: 1.0, // 100% erasure compliance
  localProcessingRate: 0.30, // 30% local processing
} as const;
```

## Technical Quality Metrics

### Code Quality & Maintainability
```typescript
interface CodeQualityMetrics {
  readonly codeCoverage: number; // % test coverage
  readonly codeComplexity: number; // cyclomatic complexity
  readonly technicalDebtRatio: number; // % technical debt
  readonly codeReviewCompletionTime: number; // hours
  readonly buildSuccessRate: number; // % successful builds
  readonly deploymentFrequency: number; // deployments per week
  readonly meanTimeToRecovery: number; // minutes
  readonly changeFailureRate: number; // % failed deployments
}

// Target KPIs
const CODE_QUALITY_TARGETS = {
  codeCoverage: 0.90, // 90% test coverage
  codeComplexity: 10, // <10 cyclomatic complexity
  technicalDebtRatio: 0.05, // <5% technical debt
  codeReviewCompletionTime: 24, // 24 hours review time
  buildSuccessRate: 0.95, // 95% build success
  deploymentFrequency: 5, // 5 deployments per week
  meanTimeToRecovery: 30, // 30 minutes MTTR
  changeFailureRate: 0.02, // 2% change failure rate
} as const;
```

### Monitoring & Observability
```typescript
interface ObservabilityMetrics {
  readonly logIngestionRate: number; // logs per second
  readonly alertResponseTime: number; // minutes
  readonly monitoringCoverage: number; // % services monitored
  readonly falsePositiveRate: number; // % false alerts
  readonly systemAvailability: number; // % uptime
  readonly errorTrackingCoverage: number; // % errors tracked
  readonly performanceMonitoringAccuracy: number; // % accurate metrics
}

// Target KPIs
const OBSERVABILITY_TARGETS = {
  logIngestionRate: 10000, // 10K logs per second
  alertResponseTime: 5, // 5 minutes response
  monitoringCoverage: 0.98, // 98% monitoring coverage
  falsePositiveRate: 0.05, // 5% false positives
  systemAvailability: 0.999, // 99.9% uptime
  errorTrackingCoverage: 0.95, // 95% error tracking
  performanceMonitoringAccuracy: 0.97, // 97% metric accuracy
} as const;
```

## Comprehensive Metrics Dashboard

### Real-time Monitoring Implementation
```typescript
class MetricsDashboard {
  private readonly metricsCollector: MetricsCollector;
  private readonly alertManager: AlertManager;
  private readonly visualizations: VisualizationEngine;

  constructor() {
    this.metricsCollector = new MetricsCollector({
      samplingRate: 0.1, // 10% sampling
      batchSize: 1000,
      flushInterval: 30000, // 30 seconds
    });

    this.alertManager = new AlertManager({
      thresholds: {
        ...AI_QUALITY_TARGETS,
        ...AI_PERFORMANCE_TARGETS,
        ...BROWSER_PERFORMANCE_TARGETS,
        ...USER_ENGAGEMENT_TARGETS,
        ...REVENUE_TARGETS,
        ...SECURITY_TARGETS,
      },
    });

    this.visualizations = new VisualizationEngine({
      refreshInterval: 5000, // 5 seconds
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  async initializeMonitoring(): Promise<void> {
    // Set up metric collection
    await this.setupAIMetrics();
    await this.setupPerformanceMetrics();
    await this.setupUserMetrics();
    await this.setupBusinessMetrics();
    await this.setupSecurityMetrics();
    await this.setupTechnicalMetrics();
    
    // Configure alerts
    await this.configureAlerts();
    
    // Start real-time monitoring
    await this.startRealTimeMonitoring();
  }

  private async setupAIMetrics(): Promise<void> {
    // AI response quality tracking
    this.metricsCollector.register('ai_response_accuracy', {
      type: 'histogram',
      help: 'AI response accuracy distribution',
      buckets: [0.7, 0.8, 0.9, 0.95, 0.99, 1.0],
    });

    // AI performance tracking
    this.metricsCollector.register('ai_response_time', {
      type: 'histogram',
      help: 'AI response time distribution',
      buckets: [100, 500, 1000, 2000, 5000, 10000],
    });

    // Model usage tracking
    this.metricsCollector.register('ai_model_usage', {
      type: 'counter',
      help: 'AI model usage by type',
      labelNames: ['model', 'query_type', 'privacy_level'],
    });
  }

  async generateKPIReport(period: 'daily' | 'weekly' | 'monthly'): Promise<KPIReport> {
    const endTime = new Date();
    const startTime = this.calculateStartTime(endTime, period);
    
    const [
      aiMetrics,
      performanceMetrics,
      userMetrics,
      businessMetrics,
      securityMetrics,
      technicalMetrics,
    ] = await Promise.all([
      this.collectAIMetrics(startTime, endTime),
      this.collectPerformanceMetrics(startTime, endTime),
      this.collectUserMetrics(startTime, endTime),
      this.collectBusinessMetrics(startTime, endTime),
      this.collectSecurityMetrics(startTime, endTime),
      this.collectTechnicalMetrics(startTime, endTime),
    ]);

    return {
      period,
      startTime,
      endTime,
      ai: {
        metrics: aiMetrics,
        targets: { ...AI_QUALITY_TARGETS, ...AI_PERFORMANCE_TARGETS },
        status: this.calculateComplianceStatus(aiMetrics, AI_QUALITY_TARGETS),
      },
      performance: {
        metrics: performanceMetrics,
        targets: { ...BROWSER_PERFORMANCE_TARGETS, ...AI_INTEGRATION_TARGETS },
        status: this.calculateComplianceStatus(performanceMetrics, BROWSER_PERFORMANCE_TARGETS),
      },
      user: {
        metrics: userMetrics,
        targets: { ...USER_ENGAGEMENT_TARGETS, ...USER_SATISFACTION_TARGETS },
        status: this.calculateComplianceStatus(userMetrics, USER_ENGAGEMENT_TARGETS),
      },
      business: {
        metrics: businessMetrics,
        targets: { ...REVENUE_TARGETS, ...COST_EFFICIENCY_TARGETS },
        status: this.calculateComplianceStatus(businessMetrics, REVENUE_TARGETS),
      },
      security: {
        metrics: securityMetrics,
        targets: { ...SECURITY_TARGETS, ...PRIVACY_TARGETS },
        status: this.calculateComplianceStatus(securityMetrics, SECURITY_TARGETS),
      },
      technical: {
        metrics: technicalMetrics,
        targets: { ...CODE_QUALITY_TARGETS, ...OBSERVABILITY_TARGETS },
        status: this.calculateComplianceStatus(technicalMetrics, CODE_QUALITY_TARGETS),
      },
      summary: {
        overallScore: this.calculateOverallScore([
          aiMetrics, performanceMetrics, userMetrics, 
          businessMetrics, securityMetrics, technicalMetrics
        ]),
        criticalIssues: this.identifyCriticalIssues(aiMetrics, performanceMetrics),
        recommendations: this.generateRecommendations(aiMetrics, performanceMetrics),
      },
    };
  }

  private calculateComplianceStatus(
    actual: Record<string, number>,
    targets: Record<string, number>
  ): ComplianceStatus {
    const scores = Object.entries(targets).map(([key, target]) => {
      const actualValue = actual[key];
      if (actualValue === undefined) return 0;
      
      // Calculate compliance score (0-1)
      return Math.min(actualValue / target, 1);
    });

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (averageScore >= 0.95) return 'excellent';
    if (averageScore >= 0.85) return 'good';
    if (averageScore >= 0.70) return 'fair';
    return 'poor';
  }
}

// KPI Reporting Interface
interface KPIReport {
  readonly period: 'daily' | 'weekly' | 'monthly';
  readonly startTime: Date;
  readonly endTime: Date;
  readonly ai: MetricsSection;
  readonly performance: MetricsSection;
  readonly user: MetricsSection;
  readonly business: MetricsSection;
  readonly security: MetricsSection;
  readonly technical: MetricsSection;
  readonly summary: {
    readonly overallScore: number;
    readonly criticalIssues: readonly string[];
    readonly recommendations: readonly string[];
  };
}

interface MetricsSection {
  readonly metrics: Record<string, number>;
  readonly targets: Record<string, number>;
  readonly status: ComplianceStatus;
}

type ComplianceStatus = 'excellent' | 'good' | 'fair' | 'poor';
```

## Success Criteria & Thresholds

### Critical Success Factors

**Phase 1 - MVP Launch (Months 1-3)**
- [ ] AI response accuracy > 90%
- [ ] Browser startup time < 2 seconds
- [ ] User onboarding completion > 80%
- [ ] System availability > 99.5%
- [ ] Zero critical security incidents

**Phase 2 - Growth (Months 4-12)**
- [ ] 10K+ daily active users
- [ ] NPS score > 40
- [ ] AI feature adoption > 70%
- [ ] Monthly churn rate < 8%
- [ ] $50K+ monthly recurring revenue

**Phase 3 - Scale (Year 2)**
- [ ] 100K+ monthly active users
- [ ] AI trust score > 4.2/5
- [ ] 99.9% system availability
- [ ] 15% monthly revenue growth
- [ ] Industry-leading performance benchmarks

### Automated Alerting Thresholds

```typescript
const ALERT_THRESHOLDS = {
  critical: {
    aiResponseTime: 10000, // 10 seconds
    systemAvailability: 0.99, // Below 99%
    securityIncidents: 1, // Any security incident
    dataBreaches: 1, // Any data breach
    errorRate: 0.05, // Above 5% error rate
  },
  warning: {
    aiResponseTime: 5000, // 5 seconds
    systemAvailability: 0.995, // Below 99.5%
    userSatisfaction: 3.5, // Below 3.5/5
    churnRate: 0.10, // Above 10%
    costPerUser: 5, // Above $5 per user
  },
  info: {
    newUserSignups: 100, // Below 100 daily
    featureUsage: 0.50, // Below 50% usage
    supportTickets: 10, // Above 10 per day
    performanceDegradation: 0.20, // 20% performance drop
  },
} as const;
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
