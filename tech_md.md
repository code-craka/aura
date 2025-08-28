# Project Aura - Technical Specification for AI Agents

## 1. Technical Architecture Overview

### 1.1 System Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                    User Interface Layer                 │
├─────────────────────────────────────────────────────────┤
│  React Components │ Tailwind CSS │ TypeScript │ Vite    │
├─────────────────────────────────────────────────────────┤
│                    Browser Engine Layer                 │
├─────────────────────────────────────────────────────────┤
│  Chromium Base │ Extension API │ Security │ Performance │
├─────────────────────────────────────────────────────────┤
│                    AI Integration Layer                 │
├─────────────────────────────────────────────────────────┤
│  GPT-4 │ Claude-3 │ Gemini Pro │ Local Models │ Router  │
├─────────────────────────────────────────────────────────┤
│                    Data Processing Layer                │
├─────────────────────────────────────────────────────────┤
│  Context Engine │ Vector DB │ Cache │ Privacy Filter    │
├─────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                 │
├─────────────────────────────────────────────────────────┤
│  AWS/GCP │ Kubernetes │ PostgreSQL │ Redis │ Monitoring │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Core Technology Stack
```typescript
// Frontend Stack
interface FrontendStack {
  framework: "React 18 with Concurrent Features";
  language: "TypeScript 5.3+ with Strict Mode";
  bundler: "Vite with Custom Chromium Integration";
  styling: "Tailwind CSS with Custom Design System";
  stateManagement: "Zustand + React Query";
  testing: "Vitest + React Testing Library + Playwright";
  aiIntegration: "Custom SDK for multi-model AI";
}

// Backend Stack
interface BackendStack {
  runtime: "Node.js 20+ with TypeScript";
  framework: "tRPC for type-safe API";
  database: "PostgreSQL 15+ with Prisma ORM";
  vectorDB: "Pinecone for AI context storage";
  cache: "Redis 7+ for session and API caching";
  queue: "BullMQ for background job processing";
  authentication: "Custom JWT with OAuth2 providers";
}

// AI & ML Stack
interface AIStack {
  primaryModels: ["GPT-4", "Claude-3-Opus", "Gemini-Pro"];
  localModels: ["Ollama", "WebLLM for browser"];
  vectorSearch: "OpenAI Embeddings + Pinecone";
  multiModal: "GPT-4V, Claude-3-Vision, Gemini-Pro-Vision";
  voiceProcessing: "Web Speech API + Whisper";
  customTraining: "Fine-tuning pipeline for user adaptation";
}

// Infrastructure Stack
interface InfrastructureStack {
  cloudProvider: "AWS Multi-Region with GCP Fallback";
  containerization: "Docker with multi-stage builds";
  orchestration: "Kubernetes with custom operators";
  monitoring: "DataDog + Sentry for error tracking";
  cdn: "CloudFlare with edge computing";
  security: "Vault for secrets, OWASP compliance";
  cicd: "GitHub Actions with AI-assisted workflows";
}
```

## 2. Browser Engine Architecture

### 2.1 Chromium Integration
```cpp
// Chromium Customization Points
class AuraBrowserEngine {
  // Custom content script injection
  void InjectAICapabilities(WebContents* web_contents);
  
  // Enhanced tab management
  void EnableAdvancedTabFeatures();
  
  // Privacy-first modifications
  void ConfigurePrivacySettings();
  
  // Performance optimizations
  void OptimizeForAIWorkloads();
  
  // Security hardening
  void ApplySecurityEnhancements();
};

// Tab Management Enhancement
interface TabManager {
  enableSpaces: boolean;
  enableVerticalTabs: boolean;
  aiGrouping: boolean;
  contextualSuggestions: boolean;
  crossTabAnalysis: boolean;
}
```

### 2.2 Extension System Compatibility
```typescript
// Chrome Extension API Compatibility Layer
interface ExtensionAPI {
  // Maintain full Chrome extension compatibility
  chromeApis: {
    tabs: "Full API support with AI enhancements";
    storage: "Enhanced with AI context awareness";
    bookmarks: "AI-powered organization";
    history: "Intelligent search and categorization";
    contextMenus: "AI-generated contextual actions";
  };
  
  // Custom Aura-specific APIs
  auraApis: {
    aiAgent: "Direct AI model access for extensions";
    contextAnalysis: "Cross-tab content analysis";
    workflowAutomation: "Custom command integration";
    voiceInterface: "Voice command processing";
  };
}
```

## 3. AI Integration Architecture

### 3.1 Multi-Model AI Router
```typescript
// AI Model Selection and Routing
class AIModelRouter {
  private models = {
    gpt4: new OpenAIProvider({
      model: "gpt-4-turbo",
      maxTokens: 4096,
      temperature: 0.1,
    }),
    claude: new AnthropicProvider({
      model: "claude-3-opus-20240229",
      maxTokens: 4096,
    }),
    gemini: new GoogleProvider({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
      },
    }),
  };

  async routeRequest(request: AIRequest): Promise<AIResponse> {
    // Intelligent model selection based on request type
    const optimalModel = this.selectOptimalModel(request);
    
    try {
      const response = await this.models[optimalModel].process(request);
      
      // Quality assessment and fallback logic
      if (this.assessResponseQuality(response) < 0.8) {
        return this.tryFallbackModel(request, optimalModel);
      }
      
      return response;
    } catch (error) {
      return this.handleModelError(error, request);
    }
  }

  private selectOptimalModel(request: AIRequest): ModelType {
    // Analysis task -> Claude (superior reasoning)
    // Code generation -> GPT-4 (better code quality)
    // Multimodal -> Gemini Pro (image + text processing)
    // Privacy-sensitive -> Local model
    
    if (request.type === "code_generation") return "gpt4";
    if (request.type === "analysis" || request.type === "synthesis") return "claude";
    if (request.hasImages || request.type === "multimodal") return "gemini";
    if (request.privacyLevel === "high") return "local";
    
    return "gpt4"; // Default fallback
  }
}
```

### 3.2 Context Management System
```typescript
// Advanced Context Management
interface ContextEngine {
  // Tab content analysis
  analyzeTabContent(tabId: string): Promise<TabContext>;
  
  // Cross-tab correlation
  findRelatedContent(contexts: TabContext[]): Promise<ContentRelation[]>;
  
  // User intent detection
  detectUserIntent(behaviorPattern: BehaviorPattern): Promise<Intent>;
  
  // Context compression for API efficiency
  compressContext(fullContext: FullContext): Promise<CompressedContext>;
}

class ContextManager {
  private vectorStore = new PineconeClient();
  private contextCache = new Map<string, CachedContext>();
  
  async extractTabContext(tab: Tab): Promise<TabContext> {
    // Extract meaningful content while respecting privacy
    const content = await this.extractContent(tab);
    const sanitizedContent = await this.privacyFilter(content, tab.url);
    
    // Generate embeddings for semantic search
    const embeddings = await this.generateEmbeddings(sanitizedContent);
    
    // Store in vector database
    await this.vectorStore.upsert({
      id: `tab-${tab.id}`,
      values: embeddings,
      metadata: {
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
        contentType: this.detectContentType(tab.url),
      },
    });
    
    return {
      tabId: tab.id,
      content: sanitizedContent,
      embeddings,
      extractedEntities: await this.extractEntities(sanitizedContent),
      sentiment: await this.analyzeSentiment(sanitizedContent),
    };
  }
  
  private async privacyFilter(content: string, url: string): Promise<string> {
    // Remove sensitive information based on URL patterns and content analysis
    const sensitivePatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit cards
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    ];
    
    // Skip banking, healthcare, and other sensitive domains
    const sensitiveDomains = ["bank", "healthcare", "medical", "financial"];
    if (sensitiveDomains.some(domain => url.includes(domain))) {
      return "[Content filtered for privacy]";
    }
    
    let filteredContent = content;
    sensitivePatterns.forEach(pattern => {
      filteredContent = filteredContent.replace(pattern, "[REDACTED]");
    });
    
    return filteredContent;
  }
}
```

### 3.3 Local AI Processing
```typescript
// On-Device AI for Privacy-Sensitive Tasks
class LocalAIProcessor {
  private localModel: WebLLM;
  private initialized = false;
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Load lightweight model for on-device processing
    this.localModel = new WebLLM({
      model: "Phi-3-mini-4k-instruct-q4f16_1",
      kvConfig: {
        numLayers: 32,
        shape: [32, 32, 128],
        dtype: "float16",
      },
    });
    
    await this.localModel.load();
    this.initialized = true;
  }
  
  async processPrivateTasks(request: PrivateAIRequest): Promise<AIResponse> {
    await this.initialize();
    
    // Handle privacy-sensitive queries locally
    switch (request.type) {
      case "password_generation":
        return this.generateSecurePassword(request.requirements);
      case "personal_data_analysis":
        return this.analyzePersonalData(request.data);
      case "sensitive_content_summary":
        return this.summarizeSensitiveContent(request.content);
      default:
        throw new Error(`Unsupported private task: ${request.type}`);
    }
  }
  
  private async generateSecurePassword(requirements: PasswordRequirements): Promise<AIResponse> {
    // Generate password locally without API calls
    const response = await this.localModel.complete({
      prompt: `Generate a secure password with these requirements: ${JSON.stringify(requirements)}`,
      maxTokens: 50,
      temperature: 0.8,
    });
    
    return {
      content: response,
      source: "local",
      privacyLevel: "maximum",
    };
  }
}
```

## 4. Frontend Architecture Details

### 4.1 React Component Architecture
```typescript
// Smart Address Bar Component
interface SmartAddressBarProps {
  onAIQuery: (query: string) => void;
  onNavigation: (url: string) => void;
  currentTab: Tab;
  aiEnabled: boolean;
}

const SmartAddressBar: React.FC<SmartAddressBarProps> = ({
  onAIQuery,
  onNavigation,
  currentTab,
  aiEnabled,
}) => {
  const [inputMode, setInputMode] = useState<'url' | 'ai'>('url');
  const [query, setQuery] = useState('');
  const { data: suggestions } = useAISuggestions(query, currentTab);
  
  // AI Query Processing
  const handleAIQuery = useCallback(async (query: string) => {
    const aiRequest: AIRequest = {
      type: 'general_query',
      content: query,
      context: {
        currentTab: currentTab.id,
        relatedTabs: await getRelatedTabs(currentTab),
        userIntent: await detectIntent(query),
      },
      privacyLevel: determinePrivacyLevel(query, currentTab.url),
    };
    
    onAIQuery(JSON.stringify(aiRequest));
  }, [currentTab, onAIQuery]);
  
  return (
    <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
      {/* Mode Toggle */}
      <button
        onClick={() => setInputMode(inputMode === 'url' ? 'ai' : 'url')}
        className={`p-2 rounded-l-lg transition-colors ${
          inputMode === 'ai'
            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        {inputMode === 'ai' ? <SparklesIcon /> : <GlobeIcon />}
      </button>
      
      {/* Input Field */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (inputMode === 'ai') {
              handleAIQuery(query);
            } else {
              onNavigation(query);
            }
          }
        }}
        placeholder={
          inputMode === 'ai' 
            ? 'Ask AI about this page or your tabs...' 
            : 'Enter URL or search...'
        }
        className="flex-1 px-4 py-2 bg-transparent border-0 outline-none text-gray-900 dark:text-gray-100"
      />
      
      {/* AI Suggestions Dropdown */}
      {inputMode === 'ai' && suggestions && (
        <SuggestionDropdown
          suggestions={suggestions}
          onSelect={handleAIQuery}
          className="absolute top-full left-0 right-0 z-50"
        />
      )}
    </div>
  );
};

// AI Conversation Interface
interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceReference[];
  actions?: ActionButton[];
}

const AIConversationPanel: React.FC = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { sendMessage, streamResponse } = useAIConversation();
  
  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: ConversationMessage = {
      id: nanoid(),
      type: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    
    try {
      const assistantMessage: ConversationMessage = {
        id: nanoid(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        sources: [],
        actions: [],
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Stream AI response
      await streamResponse(content, (chunk) => {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: msg.content + chunk }
            : msg
        ));
      });
      
    } catch (error) {
      console.error('AI conversation error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [streamResponse]);
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Message History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={message}
            isProcessing={isProcessing && message.type === 'assistant'}
          />
        ))}
      </div>
      
      {/* Input Area */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={isProcessing}
        placeholder="Ask AI about your tabs, or request an action..."
      />
    </div>
  );
};
```

### 4.2 State Management Architecture
```typescript
// Global State Management with Zustand
interface AppState {
  // Browser State
  tabs: Tab[];
  activeTabId: string | null;
  spaces: Space[];
  bookmarks: Bookmark[];
  
  // AI State
  conversations: Conversation[];
  aiEnabled: boolean;
  currentModel: AIModel;
  contextCache: Map<string, TabContext>;
  
  // User State
  user: User | null;
  preferences: UserPreferences;
  customCommands: CustomCommand[];
  
  // UI State
  sidebarCollapsed: boolean;
  aiPanelVisible: boolean;
  theme: 'light' | 'dark' | 'system';
}

const useAppStore = create<AppState & AppActions>((set, get) => ({
  // Initial state
  tabs: [],
  activeTabId: null,
  spaces: [],
  bookmarks: [],
  conversations: [],
  aiEnabled: true,
  currentModel: 'gpt4',
  contextCache: new Map(),
  user: null,
  preferences: defaultPreferences,
  customCommands: [],
  sidebarCollapsed: false,
  aiPanelVisible: false,
  theme: 'system',
  
  // Actions
  addTab: (tab: Tab) => set(state => ({
    tabs: [...state.tabs, tab]
  })),
  
  removeTab: (tabId: string) => set(state => ({
    tabs: state.tabs.filter(tab => tab.id !== tabId),
    activeTabId: state.activeTabId === tabId ? 
      state.tabs[0]?.id || null : state.activeTabId
  })),
  
  updateTabContext: (tabId: string, context: TabContext) => set(state => {
    const newCache = new Map(state.contextCache);
    newCache.set(tabId, context);
    return { contextCache: newCache };
  }),
  
  addConversationMessage: (conversationId: string, message: ConversationMessage) => 
    set(state => ({
      conversations: state.conversations.map(conv =>
        conv.id === conversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      )
    })),
    
  toggleAIPanel: () => set(state => ({
    aiPanelVisible: !state.aiPanelVisible
  })),
}));

// React Query for Server State Management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error instanceof AIAPIError && error.status === 429) {
          return failureCount < 3; // Retry rate limits
        }
        return false;
      },
    },
  },
});

// Custom Hooks for AI Integration
const useAIQuery = (query: string, context: QueryContext) => {
  return useQuery({
    queryKey: ['ai-query', query, context],
    queryFn: async () => {
      const aiRouter = new AIModelRouter();
      return aiRouter.routeRequest({
        type: 'general_query',
        content: query,
        context,
        privacyLevel: determinePrivacyLevel(query, context),
      });
    },
    enabled: Boolean(query?.trim()),
    staleTime: 2 * 60 * 1000, // 2 minutes for AI responses
  });
};

const useTabAnalysis = (tabId: string) => {
  return useQuery({
    queryKey: ['tab-analysis', tabId],
    queryFn: async () => {
      const contextManager = new ContextManager();
      const tab = await browser.tabs.get(parseInt(tabId));
      return contextManager.extractTabContext(tab);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for tab content
  });
};
```

## 5. Backend Architecture Details

### 5.1 tRPC API Implementation
```typescript
// API Router Definition
export const appRouter = router({
  // Authentication
  auth: authRouter,
  
  // AI Operations
  ai: router({
    query: publicProcedure
      .input(aiQuerySchema)
      .mutation(async ({ input, ctx }) => {
        const aiRouter = new AIModelRouter();
        const response = await aiRouter.routeRequest(input);
        
        // Log usage for billing and analytics
        await ctx.db.usageEvent.create({
          data: {
            userId: ctx.user?.id,
            eventType: 'ai_query',
            modelUsed: response.modelUsed,
            tokensUsed: response.tokensUsed,
            cost: calculateCost(response.modelUsed, response.tokensUsed),
          },
        });
        
        return response;
      }),
      
    conversation: protectedProcedure
      .input(conversationSchema)
      .subscription(async ({ input, ctx }) => {
        // Streaming AI responses
        return observable<ConversationMessage>((emit) => {
          const conversationHandler = new ConversationHandler(ctx.user.id);
          
          conversationHandler.streamResponse(input, (message) => {
            emit.next(message);
          });
          
          return () => {
            conversationHandler.cleanup();
          };
        });
      }),
  }),
  
  // Browser Operations
  browser: router({
    tabs: router({
      list: protectedProcedure
        .query(async ({ ctx }) => {
          return ctx.db.tab.findMany({
            where: { userId: ctx.user.id },
            include: { space: true },
          });
        }),
        
      analyze: protectedProcedure
        .input(z.object({ tabId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          const contextManager = new ContextManager();
          const analysis = await contextManager.analyzeTab(input.tabId);
          
          // Store analysis results
          await ctx.db.tabAnalysis.upsert({
            where: { tabId: input.tabId },
            update: { analysis },
            create: {
              tabId: input.tabId,
              userId: ctx.user.id,
              analysis,
            },
          });
          
          return analysis;
        }),
    }),
    
    commands: router({
      create: protectedProcedure
        .input(createCommandSchema)
        .mutation(async ({ input, ctx }) => {
          const command = await ctx.db.customCommand.create({
            data: {
              ...input,
              userId: ctx.user.id,
            },
          });
          
          // Generate AI-optimized execution plan
          const executionPlan = await generateExecutionPlan(input.steps);
          await ctx.db.commandExecutionPlan.create({
            data: {
              commandId: command.id,
              plan: executionPlan,
            },
          });
          
          return command;
        }),
        
      execute: protectedProcedure
        .input(executeCommandSchema)
        .mutation(async ({ input, ctx }) => {
          const command = await ctx.db.customCommand.findFirst({
            where: { id: input.commandId, userId: ctx.user.id },
            include: { executionPlan: true },
          });
          
          if (!command) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Command not found',
            });
          }
          
          const executor = new CommandExecutor();
          const result = await executor.execute(command, input.parameters);
          
          // Log execution for analytics
          await ctx.db.commandExecution.create({
            data: {
              commandId: command.id,
              userId: ctx.user.id,
              success: result.success,
              duration: result.duration,
              parameters: input.parameters,
            },
          });
          
          return result;
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
```

### 5.2 Database Schema Implementation
```typescript
// Prisma Schema
model User {
  id                String              @id @default(cuid())
  email             String              @unique
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  preferences       Json?
  subscriptionTier  SubscriptionTier    @default(FREE)
  
  // Relations
  conversations     Conversation[]
  customCommands    CustomCommand[]
  usageEvents       UsageEvent[]
  tabAnalyses       TabAnalysis[]
  
  @@map("users")
}

model Conversation {
  id          String              @id @default(cuid())
  userId      String
  title       String?
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  // Relations
  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages    ConversationMessage[]
  
  @@map("conversations")
}

model ConversationMessage {
  id             String       @id @default(cuid())
  conversationId String
  type           MessageType  // USER, ASSISTANT
  content        String       @db.Text
  sources        Json?        // Source references for AI responses
  metadata       Json?        // Model used, tokens, etc.
  createdAt      DateTime     @default(now())
  
  // Relations
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  @@map("conversation_messages")
}

model CustomCommand {
  id            String                @id @default(cuid())
  userId        String
  name          String
  description   String?
  steps         Json                  // Workflow steps definition
  parameters    Json?                 // Parameter schema
  usageCount    Int                   @default(0)
  createdAt     DateTime              @default(now())
  updatedAt     DateTime              @updatedAt
  
  // Relations
  user          User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  executionPlan CommandExecutionPlan?
  executions    CommandExecution[]
  
  @@map("custom_commands")
}

model TabAnalysis {
  id          String   @id @default(cuid())
  userId      String
  tabId       String   @unique
  url         String
  title       String?
  analysis    Json     // AI analysis results
  embeddings  Json?    // Vector embeddings for search
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("tab_analyses")
}

model UsageEvent {
  id         String          @id @default(cuid())
  userId     String?
  eventType  String          // ai_query, command_execution, etc.
  eventData  Json?
  modelUsed  String?
  tokensUsed Int?
  cost       Decimal?        @db.Decimal(10, 4)
  createdAt  DateTime        @default(now())
  
  // Relations
  user       User?           @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@map("usage_events")
}

enum SubscriptionTier {
  FREE
  PRO
  ENTERPRISE
}

enum MessageType {
  USER
  ASSISTANT
}
```

### 5.3 AI Model Cost Management
```typescript
// Cost Calculation and Management
class CostManager {
  private readonly modelPricing = {
    'gpt-4': {
      input: 0.03 / 1000,   // $0.03 per 1K tokens
      output: 0.06 / 1000,  // $0.06 per 1K tokens
    },
    'claude-3-opus': {
      input: 0.015 / 1000,  // $0.015 per 1K tokens
      output: 0.075 / 1000, // $0.075 per 1K tokens
    },
    'gemini-pro': {
      input: 0.00025 / 1000,  // $0.00025 per 1K tokens
      output: 0.0005 / 1000,  // $0.0005 per 1K tokens
    },
  };
  
  calculateRequestCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = this.modelPricing[model];
    if (!pricing) return 0;
    
    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }
  
  async checkUserLimit(userId: string, estimatedCost: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        usageEvents: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });
    
    if (!user) return false;
    
    // Calculate current month usage
    const currentUsage = user.usageEvents.reduce(
      (sum, event) => sum + (event.cost?.toNumber() || 0),
      0
    );
    
    // Check against tier limits
    const limits = {
      FREE: 5.00,      // $5 per month
      PRO: 100.00,     // $100 per month
      ENTERPRISE: Infinity, // Unlimited
    };
    
    const userLimit = limits[user.subscriptionTier];
    return (currentUsage + estimatedCost) <= userLimit;
  }
  
  async optimizeModelSelection(request: AIRequest): Promise<string> {
    // Select most cost-effective model for the task
    if (request.type === 'simple_query') return 'gemini-pro';
    if (request.type === 'analysis' && request.complexity === 'high') return 'claude-3-opus';
    if (request.type === 'code_generation') return 'gpt-4';
    
    return 'gemini-pro'; // Most cost-effective default
  }
}
```

## 6. Performance Optimization

### 6.1 Frontend Performance
```typescript
// Performance Optimization Strategies
class PerformanceOptimizer {
  // Code splitting and lazy loading
  static setupCodeSplitting() {
    const AIPanel = lazy(() => import('./components/AIPanel'));
    const CustomCommands = lazy(() => import('./components/CustomCommands'));
    const AdvancedSettings = lazy(() => import('./components/AdvancedSettings'));
    
    return {
      AIPanel,
      CustomCommands,
      AdvancedSettings,
    };
  }
  
  // Virtual scrolling for large tab lists
  static VirtualTabList = ({ tabs }: { tabs: Tab[] }) => {
    const rowVirtualizer = useVirtualizer({
      count: tabs.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 40,
      overscan: 5,
    });
    
    return (
      <div ref={parentRef} className="h-400 overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: